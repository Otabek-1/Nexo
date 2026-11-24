export const getAdaptiveBranch = (modules, sourceIndex) => {
  const source = modules[sourceIndex]
  if (!source || source.routing !== 'adaptive') return null

  const indices = modules.reduce((matches, module, index) => {
    if (
      index > sourceIndex &&
      module.subject === source.subject &&
      ['easy', 'hard'].includes(module.difficulty)
    ) {
      matches.push(index)
    }
    return matches
  }, [])
  const difficulties = new Set(indices.map(index => modules[index].difficulty))

  if (!difficulties.has('easy') || !difficulties.has('hard')) return null
  return { indices, endIndex: Math.max(...indices) }
}

export const getModulesDuration = (modules) => {
  if (!Array.isArray(modules) || modules.length === 0) return null

  let total = 0
  for (let index = 0; index < modules.length;) {
    const module = modules[index]
    const moduleMinutes = Math.max(1, Number(module.durationMinutes) || 1)
    const branch = getAdaptiveBranch(modules, index)
    if (!branch) {
      total += moduleMinutes
      if (index < modules.length - 1) total += Math.max(0, Number(module.breakAfterMinutes) || 0)
      index += 1
      continue
    }

    total += moduleMinutes + Math.max(0, Number(module.breakAfterMinutes) || 0)
    const branchDuration = Math.max(...branch.indices.map((branchIndex) => {
      const branchModule = modules[branchIndex]
      const duration = Math.max(1, Number(branchModule.durationMinutes) || 1)
      const breakMinutes = branch.endIndex < modules.length - 1
        ? Math.max(0, Number(branchModule.breakAfterMinutes) || 0)
        : 0
      return duration + breakMinutes
    }))
    total += branchDuration
    index = branch.endIndex + 1
  }

  return total
}

export const getModuleProgress = (modules, currentIndex) => {
  const stages = []
  for (let index = 0; index < modules.length;) {
    const branch = getAdaptiveBranch(modules, index)
    if (branch) {
      stages.push([index], branch.indices)
      index = branch.endIndex + 1
    } else {
      stages.push([index])
      index += 1
    }
  }
  const currentStage = stages.findIndex(indices => indices.includes(currentIndex))
  return { current: currentStage + 1, total: stages.length }
}

export const getAdaptiveTargetIndex = (modules, sourceIndex, shuffledQuestions, answers, isAnswerCorrect) => {
  const source = modules[sourceIndex]
  const questions = shuffledQuestions.filter(({ item }) => item.moduleId === source?.id)
  const correctCount = questions.filter(({ item }) => isAnswerCorrect(item, answers[item.id])).length
  const targetDifficulty = questions.length && correctCount / questions.length >= 0.75 ? 'hard' : 'easy'
  return modules.findIndex(
    (module, index) => (
      index > sourceIndex &&
      module.subject === source?.subject &&
      module.difficulty === targetDifficulty
    )
  )
}

export const getNextModuleIndex = (modules, currentIndex, shuffledQuestions, answers, isAnswerCorrect) => {
  for (let sourceIndex = 0; sourceIndex < currentIndex; sourceIndex += 1) {
    const branch = getAdaptiveBranch(modules, sourceIndex)
    if (!branch) continue
    const targetIndex = getAdaptiveTargetIndex(
      modules, sourceIndex, shuffledQuestions, answers, isAnswerCorrect
    )
    if (targetIndex === currentIndex && branch.indices.includes(currentIndex)) {
      return branch.endIndex + 1
    }
  }

  const current = modules[currentIndex]
  if (current?.routing === 'adaptive') {
    const targetIndex = getAdaptiveTargetIndex(
      modules, currentIndex, shuffledQuestions, answers, isAnswerCorrect
    )
    if (targetIndex >= 0) return targetIndex
  }
  return currentIndex + 1
}

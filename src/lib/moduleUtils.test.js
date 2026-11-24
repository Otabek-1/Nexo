import assert from 'node:assert/strict'
import test from 'node:test'

import { getModuleProgress, getModulesDuration, getNextModuleIndex } from './moduleUtils.js'

const modules = [
  {
    id: 'math-1',
    subject: 'math',
    difficulty: 'medium',
    durationMinutes: 32,
    breakAfterMinutes: 1,
    routing: 'adaptive'
  },
  {
    id: 'math-2-easy',
    subject: 'math',
    difficulty: 'easy',
    durationMinutes: 32,
    breakAfterMinutes: 10,
    routing: 'adaptive'
  },
  {
    id: 'math-2-hard',
    subject: 'math',
    difficulty: 'hard',
    durationMinutes: 32,
    breakAfterMinutes: 10,
    routing: 'adaptive'
  }
]

const questions = [{ item: { id: 'q1', moduleId: 'math-1' } }]
const isCorrect = (_question, answer) => answer === 'correct'

test('adaptive easy and hard variants count as one module stage and one duration', () => {
  assert.equal(getModulesDuration(modules), 65)
  assert.deepEqual(getModuleProgress(modules, 1), { current: 2, total: 2 })
  assert.deepEqual(getModuleProgress(modules, 2), { current: 2, total: 2 })
})

test('adaptive routing enters the selected branch and exits after that branch', () => {
  const answersEasy = { q1: 'incorrect' }
  const answersHard = { q1: 'correct' }

  assert.equal(getNextModuleIndex(modules, 0, questions, answersEasy, isCorrect), 1)
  assert.equal(getNextModuleIndex(modules, 1, questions, answersEasy, isCorrect), 3)
  assert.equal(getNextModuleIndex(modules, 0, questions, answersHard, isCorrect), 2)
  assert.equal(getNextModuleIndex(modules, 2, questions, answersHard, isCorrect), 3)
})

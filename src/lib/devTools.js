const DEV_EMAIL = 'burhonovotabek5@gmail.com'

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000)

const toIso = (date) => date.toISOString()

const buildMcQuestion = (id, content, options, correctAnswer) => ({
  id,
  type: 'multiple-choice',
  content,
  options,
  points: '1',
  correctAnswer: String(correctAnswer),
  subQuestions: ['', ''],
  twoPartCorrectAnswers: ['', ''],
  twoPartPoints: ['1', '1'],
})

const buildTfQuestion = (id, content, correctAnswer) => ({
  id,
  type: 'true-false',
  content,
  options: [],
  points: '1',
  correctAnswer,
  subQuestions: ['', ''],
  twoPartCorrectAnswers: ['', ''],
  twoPartPoints: ['1', '1'],
})

const buildTwoPartQuestion = (id, content, subQuestions, correctAnswers) => ({
  id,
  type: 'two-part-written',
  content,
  options: [],
  points: '2',
  correctAnswer: '',
  subQuestions,
  twoPartCorrectAnswers: correctAnswers,
  twoPartPoints: ['1', '1'],
})

export const isDeveloperEmail = (email) => String(email || '').trim().toLowerCase() === DEV_EMAIL

export const createRaschDemoPayload = () => {
  const now = new Date()
  const start = addMinutes(now, 2)
  const end = addMinutes(start, 90)
  const suffix = now.toISOString().slice(0, 16).replace('T', ' ')

  return {
    testData: {
      title: `DEV DEMO Rasch ${suffix}`,
      description: `
        <p><strong>Developer demo:</strong> Rasch scoring pipeline va leaderboard tekshiruvi uchun avtomatik yaratilgan test.</p>
        <p>Faqat objective itemlar ishlatiladi. Test tugagach cohort avtomatik kalibrlanishi kerak.</p>
      `,
      startTime: toIso(start),
      endTime: toIso(end),
      duration: '45',
      attemptsEnabled: false,
      attemptsCount: '1',
      registrationWindowHours: null,
      scoringType: 'rasch',
      testType: 'exam',
      participantFields: [
        { id: 'fullName', label: 'Ism familya', type: 'text', required: true, locked: true },
      ],
    },
    questions: [
      buildMcQuestion(
        crypto.randomUUID(),
        '<p>1-savol. 2 + 2 nechiga teng?</p>',
        ['3', '4', '5', '6'],
        1,
      ),
      buildMcQuestion(
        crypto.randomUUID(),
        "<p>2-savol. O'zbekiston poytaxtini tanlang.</p>",
        ['Samarqand', 'Buxoro', 'Toshkent', 'Andijon'],
        2,
      ),
      buildTfQuestion(
        crypto.randomUUID(),
        "<p>3-savol. Quyidagi gap to'g'rimi: Yer Quyosh atrofida aylanadi.</p>",
        'true',
      ),
      buildTfQuestion(
        crypto.randomUUID(),
        "<p>4-savol. Quyidagi gap to'g'rimi: 9 tub sondir.</p>",
        'false',
      ),
      buildMcQuestion(
        crypto.randomUUID(),
        '<p>5-savol. Ingliz tilida <em>apple</em> qaysi maʼnoni bildiradi?</p>',
        ['Olma', 'Anor', 'Nok', 'Uzum'],
        0,
      ),
      buildTwoPartQuestion(
        crypto.randomUUID(),
        "<p>6-savol. Quyidagi ifodalarni kataklarga yozing.</p>",
        ['a) "kitob" soʻzini yozing', 'b) "qalam" soʻzini yozing'],
        ['kitob', 'qalam'],
      ),
      buildMcQuestion(
        crypto.randomUUID(),
        '<p>7-savol. 12 ning yarmi nechiga teng?</p>',
        ['5', '6', '7', '8'],
        1,
      ),
      buildMcQuestion(
        crypto.randomUUID(),
        '<p>8-savol. HTML qisqartmasi nimani anglatadi?</p>',
        [
          'HyperText Markup Language',
          'HighText Machine Language',
          'Hyper Tool Multi Language',
          'Home Tool Markup Language',
        ],
        0,
      ),
    ],
  }
}

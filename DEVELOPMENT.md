# Nexo - Development Guide

Nexo - Test & Olimpiada Platformasi uchun to'liq ishlab chiqish qo'llanmasi.

## Loyiha Tuzilmasi

```
nexo/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ErrorBoundary.jsx
│   ├── pages/               # Page components
│   │   ├── LandingPage.jsx
│   │   ├── AuthPage.jsx
│   │   ├── CreateTest.jsx
│   │   ├── TestSession.jsx
│   │   ├── ReviewSubmissions.jsx
│   │   ├── TestResults.jsx
│   │   └── PlansPage.jsx
│   ├── lib/                 # Utilities and helpers
│   │   ├── auth.js          # Authentication
│   │   ├── testStore.js     # Data persistence
│   │   ├── subscription.js  # Plan management
│   │   ├── urls.js          # URL generation
│   │   ├── validation.js    # Form validation
│   │   ├── dateUtils.js     # Date utilities
│   │   ├── constants.js     # App constants
│   ├── App.jsx              # Main app component
│   ├── Dashboard.jsx        # Dashboard page
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── .env.example             # Environment template
├── package.json
├── vite.config.js
├── eslint.config.js
└── README.md
```

## Qo'llanib Boshlash

### Talabalar

- Node.js 16+
- npm yoki yarn

### O'rnatish

```bash
# Repos'itoriyani klonlash
git clone https://github.com/Otabek-1/Nexo.git
cd Nexo

# Bog'lanishlarni o'rnatish
npm install

# .env fayl yaratish
cp .env.example .env.local
```

### Ishni Boshlash

```bash
# Development server (3000-port)
npm run dev

# Brauzerda http://localhost:5173 oching
```

### Build

```bash
# Production build
npm run build

# Build natijasini ko'rish
npm run preview
```

## Asosiy Xususiyatlar

### 1. Autentifikatsiya va Xavfsizlik
- Foydalanuvchi registratsiyasi va kirishi
- Parol xeshlashi va sessiya boshqaruvi
- Rout himoyasi (ProtectedRoute)
- Error handling va validation

### 2. Test Yaratish va Boshqarish
- Testni yaratish va tahrirlash
- Savol turlarini qo'shish (Multiple choice, True/False, Essay, Short answer)
- Participant ma'lumotlarini konfiguratsiya qilish
- Test vaqti va urinish limitini sozlash

### 3. Test O'tkazish
- Ishtirokchilar ma'lumotlarini kiritish
- Real-time vaqt hisobi
- Javoblarni saqlash
- Avtomatik baholash

### 4. Natijalarni Baholash
- Leaderboard
- Manual baholash (essay savollari)
- Rasch model baholashi (Pro plan)

### 5. Rejalar va Limitlar
- Free plan: 3 ta test, 30 savol/test, 100 submission/test
- Pro plan: Cheksiz testlar, Rasch baholashi, Advanced analytics

## API va Data Management

### Authentication (lib/auth.js)
```javascript
import { authenticateUser, registerUser, logoutUser, getCurrentUser } from './lib/auth'

// Foydalanuvchini ro'yxatdan o'tkazish
const result = registerUser(email, password)

// Kirish
const result = await authenticateUser(email, password)

// Sessiyani olish
const session = getCurrentSession()

// Chiqish
logoutUser()
```

### Data Storage (lib/testStore.js)
```javascript
import { 
  getTests, getTestById, createTestRecord, updateTestRecord,
  getSubmissionsByTestId, createSubmissionRecord
} from './lib/testStore'

// Testlarni olish
const tests = getTests()

// Test yaratish
const newTest = createTestRecord({ testData, questions, creatorPlan })

// Submission yaratish
const submission = createSubmissionRecord(submissionData)
```

### Validation (lib/validation.js)
```javascript
import { validators, sanitizeInput, escapeHtml } from './lib/validation'

// Email tekshirish
const result = validators.email(email)

// Composition
const validate = compose(
  validators.required,
  validators.email
)
```

### Date Utilities (lib/dateUtils.js)
```javascript
import { formatDate, formatCountdown, getRemainingTime } from './lib/dateUtils'

// Sanani formatlash
const formatted = formatDate(isoDate)

// Qolgan vaqt
const remaining = getRemainingTime(endDate)
```

## Component Development

### Form Validation Pattern
```javascript
const [validationErrors, setValidationErrors] = useState({})

const validateForm = () => {
  const errors = {}
  if (!email) errors.email = 'Email majburiy'
  return errors
}

const handleSubmit = (e) => {
  e.preventDefault()
  const errors = validateForm()
  if (Object.keys(errors).length > 0) {
    setValidationErrors(errors)
    return
  }
  // Submit logic
}
```

### Error Boundary
ErrorBoundary component barcha React xatolarini tutib oladi:
```jsx
import ErrorBoundary from './components/ErrorBoundary'

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Code Standards

### File Naming
- Components: PascalCase (LoginForm.jsx)
- Utils: camelCase (dateUtils.js)
- Constants: camelCase (constants.js)

### Component Structure
```javascript
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ComponentName() {
  const navigate = useNavigate()
  const [state, setState] = useState('')

  const handleEvent = () => {
    // Logic
  }

  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Error Handling
```javascript
try {
  const result = await someAsyncOperation()
  if (!result.success) {
    setError(result.message)
    return
  }
  // Success handling
} catch (err) {
  console.error('[ComponentName]:', err)
  setError('Xatolik yuz berdi')
} finally {
  setLoading(false)
}
```

## Debugging

### Console Logging
```javascript
// Development logging
console.log('[ComponentName]:', variable)
console.error('[ComponentName]:', error)
console.warn('[ComponentName]:', warning)
```

### LocalStorage Inspection
```javascript
// Hamma `nexo_` bilan boshlanadigan kalitlarni ko'rish
Object.keys(localStorage)
  .filter(key => key.startsWith('nexo_'))
  .forEach(key => console.log(key, JSON.parse(localStorage.getItem(key))))
```

## Deployment

### Netlify ga Deploy
```bash
# Build
npm run build

# Build papkasi (dist/) Netlify ga yukla
# Yoki git bilan avtomatik deploymentni o'rnating
```

### Environment Variables
Deployment platformasida `.env.local` o'zgaruvchilarini qo'ying:
```
VITE_APP_NAME=Nexo
VITE_TEST_BASE_URL=https://your-domain.com
```

## Performance Optimization

1. Code splitting: React Router lazy loading
2. Image optimization: WebP format, lazy loading
3. Bundle size: Tree-shaking ESLint qo'llash
4. Caching: localStorage strategically

## Security Best Practices

1. Input sanitization va validation
2. XSS protection: escapeHtml() qo'llash
3. CSRF protection: Same-site cookies
4. Secure session management
5. Error messages: Sensitive ma'lumotlarni ochiq qo'ymaslik

## Testing Checklist

- [ ] Authentication (Register, Login, Logout)
- [ ] Test Creation (All question types)
- [ ] Test Session (Timer, Answers)
- [ ] Submissions (Auto-grading, Manual grading)
- [ ] Plans & Upgrades
- [ ] Error Boundaries
- [ ] Mobile Responsiveness

## Troubleshooting

### localStorage quota exceeded
Eski ma'lumotlarni tozalash:
```javascript
// Hamma Nexo ma'lumotlarini o'chirish
Object.keys(localStorage)
  .filter(key => key.startsWith('nexo_'))
  .forEach(key => localStorage.removeItem(key))
```

### Session expired
Sessiya timeout 24 soat. Foydalanuvchi qayta kirishi kerak.

### Form validation errors
Barcha maydonlar Uzbek tilida xato xabarlarini taqdim etadi. Custom xatolarni `lib/validation.js`da sozlang.

## Keyingi Qadamlar

1. TypeScript'ga o'tish
2. Backend API integratsiyasi
3. Real database (PostgreSQL, MongoDB)
4. Email bildirishnomalar
5. Advanced analytics
6. Mobile app (React Native)

## Qo'shimcha Havolalar

- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [Vite](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com)

## Savol-Javoblar

Savollar bo'lsa, GitHub Issues qo'ling yoki repository owner bilan bog'laning.

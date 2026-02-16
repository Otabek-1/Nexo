# Nexo Platform - Backend Integration Guide

This document provides guidance on integrating a real backend with the Nexo platform.

## Current Architecture

### Frontend-Only (Current State)
- React + React Router
- Vite build tool
- LocalStorage for data persistence
- Mock authentication

### Backend-Ready Architecture (Target)
- Clean API service layer (`src/lib/api.js`)
- Validation utilities (`src/lib/validators.js`)
- Error handling (`src/lib/errors.js`)
- Configuration management (`src/lib/config.js`)

## Migration Path

### Phase 1: Database Setup
1. Choose database: PostgreSQL, MongoDB, or Cloud Database
2. Create schema for:
   - Users
   - Tests
   - Questions
   - Submissions
   - Grades

### Phase 2: Authentication Backend
1. Build authentication API endpoints:
   - `POST /api/auth/register` - Register new user
   - `POST /api/auth/login` - User login
   - `POST /api/auth/logout` - User logout
   - `GET /api/auth/verify` - Verify session token

2. Implement:
   - Password hashing (bcrypt)
   - JWT token generation
   - Refresh token rotation
   - CORS handling

### Phase 3: Test Management API
1. Implement endpoints:
   - `POST /api/tests` - Create test
   - `GET /api/tests` - List creator's tests
   - `GET /api/tests/:id` - Get single test
   - `PATCH /api/tests/:id` - Update test
   - `DELETE /api/tests/:id` - Delete test

### Phase 4: Submission & Grading API
1. Implement endpoints:
   - `POST /api/tests/:id/submissions` - Submit answers
   - `GET /api/tests/:id/submissions` - List submissions
   - `PATCH /api/tests/:id/submissions/:submissionId/grade` - Grade submission
   - `GET /api/tests/:id/results` - Get leaderboard

## Key Integration Points

### 1. API Service Layer (`src/lib/api.js`)

Current structure is ready for backend integration:

```javascript
// Replace localStorage calls with API requests
export const authApi = {
  register: async (userData) => {
    // TODO: apiRequest('POST', '/auth/register', userData)
  },
  login: async (credentials) => {
    // TODO: apiRequest('POST', '/auth/login', credentials)
  }
}
```

### 2. Environment Configuration

Add to `.env.local`:
```
VITE_API_URL=https://your-backend.com/api
```

The API service automatically uses `API_CONFIG.BASE_URL` from `src/lib/config.js`

### 3. Authentication Flow

Current implementation:
1. User submits login/register form
2. Form validation in UI (`src/lib/validators.js`)
3. Mock API call (simulate delay)
4. Navigate to dashboard

Required changes for backend:
1. Call real API endpoint
2. Store JWT token in secure storage
3. Add token to request headers
4. Handle token refresh

### 4. Error Handling

All API calls should use the error handling system:

```javascript
import { handleApiError, ValidationError } from '../lib/errors'

try {
  const response = await fetch(url)
  // Handle error
} catch (error) {
  const appError = handleApiError(error)
  // appError.message is user-friendly
  // appError.code for logging
}
```

## Required API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/verify
POST   /api/auth/refresh-token
```

### Tests
```
POST   /api/tests
GET    /api/tests
GET    /api/tests/:id
PATCH  /api/tests/:id
DELETE /api/tests/:id
```

### Submissions
```
POST   /api/tests/:id/submissions
GET    /api/tests/:id/submissions
GET    /api/tests/:id/submissions/:submissionId
PATCH  /api/tests/:id/submissions/:submissionId/grade
```

### Results
```
GET    /api/tests/:id/results
GET    /api/tests/:id/leaderboard
```

## Security Considerations

### Frontend
1. Never store passwords - only tokens
2. Use HTTP-only cookies for tokens (when possible)
3. Implement request timeout
4. Add CSRF protection
5. Sanitize all user inputs

### Backend
1. Implement rate limiting
2. Validate all inputs on server
3. Use parameterized queries (prevent SQL injection)
4. Hash passwords with bcrypt (min 12 rounds)
5. Implement Row-Level Security (RLS) for multi-tenant
6. Log all actions for audit trail
7. Implement proper error messages (no sensitive data)

## Database Schema (Example)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tests table
CREATE TABLE tests (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration INT NOT NULL,
  attempts_count INT DEFAULT 1,
  scoring_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  options JSONB,
  correct_answer VARCHAR(255),
  points INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  participant_name VARCHAR(100) NOT NULL,
  answers JSONB NOT NULL,
  auto_score INT,
  final_score INT,
  status VARCHAR(50),
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);
```

## Testing the Integration

1. **Unit Tests**: Test API service layer functions
2. **Integration Tests**: Test frontend-backend communication
3. **E2E Tests**: Test full user workflows
4. **Security Tests**: OWASP Top 10 vulnerabilities

## Monitoring & Analytics

1. Log all API errors
2. Track response times
3. Monitor user actions
4. Set up alerts for failures
5. Regular security audits

## Performance Optimization

1. Add request caching (SWR/React Query)
2. Implement pagination for large lists
3. Lazy load components
4. Compress responses
5. Use CDN for static assets

## Production Checklist

- [ ] Backend deployed and tested
- [ ] CORS properly configured
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting implemented
- [ ] Database backups configured
- [ ] Error logging setup
- [ ] Monitoring/alerts configured
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] Documentation updated

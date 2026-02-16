import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('[NEXO-GIT] Starting git push process...');
console.log('[NEXO-GIT] Project root:', projectRoot);

try {
  // Configure git (in case it's not configured)
  console.log('[NEXO-GIT] Configuring git user...');
  try {
    execSync('git config user.email "dev@nexo.local"', { cwd: projectRoot, stdio: 'pipe' });
    execSync('git config user.name "Nexo Developer"', { cwd: projectRoot, stdio: 'pipe' });
  } catch (e) {
    console.log('[NEXO-GIT] Git config already set or local config');
  }

  // Add all changes
  console.log('[NEXO-GIT] Adding all changes to git...');
  execSync('git add -A', { cwd: projectRoot, stdio: 'inherit' });

  // Check if there are changes to commit
  const status = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf8' });
  
  if (status.trim() === '') {
    console.log('[NEXO-GIT] No changes to commit');
    process.exit(0);
  }

  // Commit changes
  console.log('[NEXO-GIT] Committing changes...');
  const commitMessage = `chore: Complete Nexo platform review and enhancement

- Add comprehensive form validation (LoginForm, RegisterForm)
- Implement error boundaries and 404 error pages
- Create API service layer ready for backend integration
- Add validators.js with email, password, and name validation
- Add errors.js with structured error handling
- Add api.js for centralized API calls
- Add config.js for environment configuration
- Add useAuth.js hook for authentication state management
- Translate PlansPage to Uzbek language
- Add comprehensive documentation:
  - REVIEW_RESULTS.md: Executive summary
  - README_REVIEW_COMPLETE.md: Getting started guide
  - BACKEND_INTEGRATION.md: Backend implementation guide
  - SECURITY.md: Security best practices
  - IMPLEMENTATION_SUMMARY.md: Detailed review
  - DOCUMENTATION_INDEX.md: Navigation guide
- Add .env.example for configuration template
- Improve UX with real-time validation feedback
- Add loading states and spinner indicators
- Prepare application for production backend integration`;

  execSync(`git commit -m "${commitMessage}"`, { cwd: projectRoot, stdio: 'inherit' });

  // Push to remote
  console.log('[NEXO-GIT] Pushing to GitHub...');
  execSync('git push origin product-review-and-enhancement', { cwd: projectRoot, stdio: 'inherit' });

  console.log('[NEXO-GIT] Successfully pushed all changes to GitHub!');
  console.log('[NEXO-GIT] Branch: product-review-and-enhancement');
  console.log('[NEXO-GIT] Repository: Otabek-1/Nexo');
  
} catch (error) {
  console.error('[NEXO-GIT] Error during git operations:', error.message);
  process.exit(1);
}

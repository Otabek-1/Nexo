import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

try {
  console.log('[v0] Starting git commit and push...');
  console.log('[v0] Working directory:', projectRoot);

  // Change to project directory
  process.chdir(projectRoot);

  // Check git status
  console.log('[v0] Checking git status...');
  const status = execSync('git status --short', { encoding: 'utf-8' });
  console.log('[v0] Changed files:', status);

  // Stage all changes
  console.log('[v0] Staging all changes...');
  execSync('git add .', { stdio: 'inherit' });

  // Create commit message
  const commitMessage = `feat: Complete frontend review and enhancement

- Add comprehensive form validation (LoginForm, RegisterForm)
- Implement error boundaries and 404 error pages
- Create API service layer for backend integration
- Add error handling utilities and validators
- Implement auth state management hook (useAuth)
- Translate PlansPage to Uzbek language
- Create extensive documentation:
  * REVIEW_RESULTS.md - Executive summary
  * BACKEND_INTEGRATION.md - Backend integration guide
  * SECURITY.md - Security best practices
  * IMPLEMENTATION_SUMMARY.md - Detailed improvements
  * DOCUMENTATION_INDEX.md - Documentation navigation
  * README_REVIEW_COMPLETE.md - Getting started guide
- Add environment configuration template (.env.example)
- Implement real-time field validation with error feedback
- Add loading states and spinners
- Improve UX with better error messages and visual feedback`;

  // Commit changes
  console.log('[v0] Creating commit...');
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

  // Push to remote
  console.log('[v0] Pushing to GitHub...');
  execSync('git push origin product-review-and-enhancement', { stdio: 'inherit' });

  console.log('[v0] Successfully pushed all changes to GitHub!');
  console.log('[v0] Repository: Otabek-1/Nexo');
  console.log('[v0] Branch: product-review-and-enhancement');
  console.log('[v0] Push completed successfully!');

} catch (error) {
  console.error('[v0] Error during commit/push:', error.message);
  process.exit(1);
}

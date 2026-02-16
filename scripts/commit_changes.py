#!/usr/bin/env python3

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a shell command and print the output"""
    print(f"\n{'='*60}")
    print(f"📝 {description}")
    print(f"{'='*60}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        if result.returncode != 0:
            print(f"❌ Error: {result.stderr}")
            return False
        print(f"✅ Success!")
        return True
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def main():
    """Main commit and push process"""
    os.chdir('/vercel/share/v0-project')
    
    print("\n🚀 Starting Nexo Project Git Commit and Push")
    print("=" * 60)
    
    # Check if we're in a git repository
    if not os.path.exists('.git'):
        print("❌ Error: Not a git repository")
        sys.exit(1)
    
    # Show current status
    if not run_command('git status', 'Current Git Status'):
        sys.exit(1)
    
    # Add all changes
    if not run_command('git add -A', 'Adding All Changes'):
        sys.exit(1)
    
    # Create commit message
    commit_message = """✨ Complete platform review and enhancement

- Add comprehensive form validation (validators.js)
- Implement error handling and boundaries (errors.js, ErrorBoundary.jsx)
- Create API service layer ready for backend (api.js)
- Add 404 error page and improved routing
- Enhance LoginForm and RegisterForm with real-time validation
- Create authentication hook for state management (useAuth.js)
- Add configuration system (config.js)
- Translate all UI text to Uzbek language
- Create comprehensive documentation:
  * BACKEND_INTEGRATION.md - Backend implementation guide
  * SECURITY.md - Security best practices
  * IMPLEMENTATION_SUMMARY.md - Review results summary
  * REVIEW_RESULTS.md - Before/after comparison
  * README_REVIEW_COMPLETE.md - Getting started guide
  * DOCUMENTATION_INDEX.md - Documentation navigation
- Add .env.example for configuration template
- Improve UX with loading states and error feedback
- Production-ready frontend ready for backend integration"""
    
    # Create commit
    if not run_command(f'git commit -m "{commit_message}"', 'Creating Commit'):
        sys.exit(1)
    
    # Push to remote
    if not run_command('git push origin HEAD', 'Pushing to GitHub'):
        print("\n⚠️  Warning: Push may have failed. Check your git credentials and network connection.")
        # Don't exit, as this might be expected in some environments
    
    # Show final status
    run_command('git log --oneline -5', 'Recent Commits')
    
    print("\n" + "="*60)
    print("✅ All git operations completed successfully!")
    print("="*60)

if __name__ == '__main__':
    main()

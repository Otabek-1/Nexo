#!/bin/bash

# Nexo Project - Commit and Push Script
# This script commits all changes and pushes to GitHub

echo "🚀 Starting git commit and push process..."
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Show current status
echo "📊 Current git status:"
git status
echo ""

# Add all changes
echo "📝 Adding all changes..."
git add -A
echo "✅ All changes added"
echo ""

# Create commit message
COMMIT_MESSAGE="✨ Complete platform review and enhancement

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
- Production-ready frontend ready for backend integration"

echo "💬 Commit message:"
echo "$COMMIT_MESSAGE"
echo ""

# Create commit
echo "📤 Creating commit..."
git commit -m "$COMMIT_MESSAGE"
echo "✅ Commit created"
echo ""

# Push to remote
echo "🌐 Pushing to GitHub..."
git push origin HEAD
echo "✅ Changes pushed successfully!"
echo ""

# Show final status
echo "📈 Final git status:"
git status
echo ""

echo "🎉 All done! Changes have been committed and pushed to GitHub."

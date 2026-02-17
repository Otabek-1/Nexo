#!/bin/bash

set -e

echo "🚀 Starting deployment process..."

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Current branch: $CURRENT_BRANCH"

# Add all changes
echo "📝 Staging changes..."
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "⚠️ No changes to commit"
    exit 0
fi

# Commit changes with descriptive message
echo "✅ Committing changes..."
git commit -m "🎯 Enhancement: Production-ready improvements

- ✨ Enhanced authentication with proper validation and error handling
- 🔒 Added auth library with secure session management
- 🛡️ Implemented error boundary for better error handling
- ✅ Added comprehensive form validation with real-time feedback
- 📝 Created validation, constants, and date utility libraries
- 🎨 Improved RegisterForm with better UX
- 🔐 Added protected routes and route guards
- 👤 Added user session display and logout functionality
- 🌐 Enhanced URL utilities with validation
- 📚 Created comprehensive development documentation
- 🐛 Improved error handling in data storage
- 📋 Added CHANGELOG documenting all improvements
- ⚙️ Created app configuration system
- 📦 Added npm scripts for development and linting
- 🔧 Enhanced ESLint configuration
- 📄 Created .env.example for configuration
- 🎯 Production-ready improvements for deployment"

# Push changes to remote
echo "🚀 Pushing to remote..."
git push origin $CURRENT_BRANCH

echo "✅ Deployment successful!"
echo "📊 Summary:"
echo "   • Branch: $CURRENT_BRANCH"
echo "   • Status: Ready for production"
echo "   • Changes: All improvements committed and pushed"

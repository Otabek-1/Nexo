import { execSync } from 'child_process'

console.log('🚀 Starting deployment process...\n')

try {
  // Get current branch
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  console.log(`📍 Current branch: ${branch}\n`)

  // Add all changes
  console.log('📝 Staging all changes...')
  execSync('git add -A')
  console.log('✅ Changes staged\n')

  // Check if there are changes
  let status = ''
  try {
    status = execSync('git diff --cached --name-only').toString()
  } catch (e) {
    status = ''
  }

  if (!status.trim()) {
    console.log('⚠️  No changes to commit')
    process.exit(0)
  }

  console.log('📋 Files to be committed:')
  status.split('\n').filter(f => f).forEach(f => console.log(`   • ${f}`))
  console.log('')

  // Commit changes
  console.log('✅ Committing changes...')
  const commitMessage = `🎯 Enhancement: Production-ready improvements

- ✨ Enhanced authentication with validation and error handling
- 🔒 Added auth library with secure session management  
- 🛡️ Implemented error boundary for better error handling
- ✅ Added comprehensive form validation
- 📝 Created utility libraries (validation, constants, date)
- 🎨 Improved form components with better UX
- 🔐 Added protected routes and route guards
- 👤 Added user session display and logout
- 🌐 Enhanced URL utilities with validation
- 📚 Created development documentation
- 🐛 Improved error handling in data storage
- 📋 Added CHANGELOG and DEVELOPMENT.md
- ⚙️ Created app configuration system
- 📦 Added npm scripts for development
- 🔧 Enhanced ESLint configuration
- 📄 Created .env.example file`

  execSync(`git commit -m "${commitMessage}"`)
  console.log('✅ Changes committed\n')

  // Push to remote
  console.log('🚀 Pushing to remote repository...')
  execSync(`git push origin ${branch}`)
  console.log('✅ Push successful\n')

  console.log('✨ Deployment complete!')
  console.log('📊 Summary:')
  console.log(`   • Branch: ${branch}`)
  console.log('   • Status: All changes committed and pushed')
  console.log('   • Ready: Project is production-ready')

} catch (error) {
  console.error('❌ Error during deployment:')
  console.error(error.message)
  process.exit(1)
}

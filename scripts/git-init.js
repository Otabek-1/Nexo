import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

try {
  console.log('[v0] Project root:', projectRoot);
  process.chdir(projectRoot);
  console.log('[v0] Changed to directory:', process.cwd());

  // Check if .git exists
  const fs = await import('fs');
  const gitPath = path.join(projectRoot, '.git');
  const gitExists = fs.existsSync(gitPath);
  console.log('[v0] .git exists:', gitExists);
  console.log('[v0] Contents of project root:');
  
  const files = fs.readdirSync(projectRoot);
  console.log(files.filter(f => f.startsWith('.')).join('\n'));

  // Try to run git command
  console.log('[v0] Attempting git status...');
  const result = execSync('git status', { encoding: 'utf-8', stdio: 'pipe' });
  console.log('[v0] Git status result:\n', result);

} catch (error) {
  console.error('[v0] Error:', error.message);
  console.log('[v0] Trying alternative: git log...');
  try {
    process.chdir('/vercel/share/v0-project');
    const log = execSync('git log --oneline -5', { encoding: 'utf-8', stdio: 'pipe' });
    console.log('[v0] Recent commits:\n', log);
  } catch (e) {
    console.error('[v0] Git log also failed:', e.message);
  }
}

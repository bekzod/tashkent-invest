import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Only a proven change confined to the other independent app may skip work.
// Unknown paths, missing history, and non-PR events always run all checks.
export function shouldRun(component, env = process.env, cwd = process.cwd()) {
  if (!['backend', 'frontend'].includes(component)) throw new Error('Invalid component');
  if (env.CI_EVENT !== 'pull_request') return true;
  if (![env.CI_BASE, env.CI_HEAD].every(value => /^[a-f0-9]{40}$/.test(value ?? ''))) return true;
  try {
    const git = args => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const base = git(['merge-base', env.CI_BASE, env.CI_HEAD]).trim();
    // --no-renames keeps both old and new paths for cross-component moves.
    const paths = git(['diff', '--no-renames', '--name-only', '-z', base, env.CI_HEAD, '--']).split('\0').filter(Boolean);
    const other = component === 'backend' ? 'frontend/' : 'backend/';
    return paths.length === 0 || paths.some(path => !path.startsWith(other));
  } catch {
    return true;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = shouldRun(process.argv[2]);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `run=${run}\n`);
  console.log(run ? 'Running component checks.' : 'Only the independent app changed; component checks not needed.');
}

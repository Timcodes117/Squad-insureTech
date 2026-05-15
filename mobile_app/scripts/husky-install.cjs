const fs = require('fs');
const { execSync } = require('child_process');

try {
  fs.accessSync('.git');
} catch {
  // Repo root may be above `mobile_app/`; skip silently.
  process.exit(0);
}

try {
  execSync('husky', { stdio: 'inherit' });
} catch {
  process.exit(0);
}

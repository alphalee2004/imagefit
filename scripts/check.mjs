import { execSync } from 'node:child_process';

const steps = [
  ['tests', 'npm run test'],
  ['typescript', 'npx tsc --noEmit'],
  ['eslint', 'npm run lint'],
  ['build', 'npm run build'],
];

for (const [name, command] of steps) {
  console.log(`[check] ${name}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch {
    console.error(`[check] ${name} failed`);
    process.exit(1);
  }
}

console.log('[check] all checks passed');

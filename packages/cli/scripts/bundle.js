/**
 * Bundle script for shaagent CLI.
 *
 * Uses esbuild to create a single-file CJS bundle that includes all
 * dependencies. Templates and skills are copied alongside (not inlined).
 *
 * Output:
 *   dist/
 *   ├── index.js          ← single bundled CJS entry point
 *   ├── templates/        ← copied from monorepo root
 *   └── skills/           ← copied from monorepo root
 */

const esbuild = require('esbuild');
const fs = require('fs-extra');
const path = require('path');

const CLI_ROOT = path.resolve(__dirname, '..');
const MONOREPO_ROOT = path.resolve(CLI_ROOT, '../..');
const DIST = path.join(CLI_ROOT, 'dist');

async function bundle() {
  console.log('🔨 Cleaning dist/...');
  await fs.remove(DIST);
  await fs.ensureDir(DIST);

  console.log('📦 Bundling with esbuild...');
  await esbuild.build({
    entryPoints: [path.join(CLI_ROOT, 'src/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: path.join(DIST, 'index.js'),
    minify: false, // Keep readable for debugging
    sourcemap: true,
    external: [
      // Node built-ins
      'fs', 'path', 'os', 'child_process', 'util', 'stream', 'events',
      'readline', 'tty', 'net', 'url', 'crypto',
    ],
    define: {
      'process.env.SHAAGENT_BUNDLED': '"true"',
    },
  });

  console.log('📋 Copying templates...');
  const srcTemplates = path.join(MONOREPO_ROOT, 'templates');
  const destTemplates = path.join(DIST, 'templates');
  if (await fs.pathExists(srcTemplates)) {
    await fs.copy(srcTemplates, destTemplates);
  } else {
    console.warn('  ⚠ templates/ not found at monorepo root');
  }

  console.log('📋 Copying skills...');
  const srcSkills = path.join(MONOREPO_ROOT, 'skills');
  const destSkills = path.join(DIST, 'skills');
  if (await fs.pathExists(srcSkills)) {
    await fs.copy(srcSkills, destSkills);
  } else {
    console.warn('  ⚠ skills/ not found at monorepo root');
  }

  // Make the entry point executable
  const indexPath = path.join(DIST, 'index.js');
  if (process.platform !== 'win32') {
    await fs.chmod(indexPath, 0o755);
  }

  const stats = await fs.stat(indexPath);
  console.log(`\n✅ Bundle complete: dist/index.js (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log(`   Templates: ${destTemplates}`);
  console.log(`   Skills:    ${destSkills}`);
}

bundle().catch((err) => {
  console.error('❌ Bundle failed:', err);
  process.exit(1);
});

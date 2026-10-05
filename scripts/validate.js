/**
 * Production Validation Script for howhow Chrome Extension
 * Checks manifest validity, referenced files, syntax, and asset existence.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
let errors = 0;

function error(msg) {
  console.error(`❌ [ERROR] ${msg}`);
  errors++;
}

function success(msg) {
  console.log(`✅ [OK] ${msg}`);
}

function checkFileExists(relPath, context) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    error(`Missing file referenced in ${context}: ${relPath}`);
    return false;
  }
  return true;
}

console.log('🚀 Running production validation checks...\n');

// 1. Validate manifest.json
const manifestPath = path.join(ROOT_DIR, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  error('manifest.json does not exist in root directory.');
  process.exit(1);
}

let manifest;
try {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  manifest = JSON.parse(raw);
  success('manifest.json is valid JSON');
} catch (err) {
  error(`manifest.json parse error: ${err.message}`);
  process.exit(1);
}

// 2. Validate manifest fields
if (manifest.manifest_version !== 3) {
  error(`manifest_version must be 3, found: ${manifest.manifest_version}`);
} else {
  success('Manifest Version: 3 (MV3)');
}

if (!manifest.name || typeof manifest.name !== 'string') {
  error('manifest.json missing required string "name"');
}

if (!manifest.version || !/^\d+\.\d+\.\d+(\.\d+)?$/.test(manifest.version)) {
  error(`Invalid extension version: "${manifest.version}". Must follow semver (e.g. 1.0.0)`);
} else {
  success(`Extension Version: ${manifest.version}`);
}

// 3. Check referenced icons
if (manifest.icons) {
  for (const [size, iconPath] of Object.entries(manifest.icons)) {
    checkFileExists(iconPath, `icons.${size}`);
  }
}

// 4. Check action
if (manifest.action) {
  if (manifest.action.default_popup) {
    checkFileExists(manifest.action.default_popup, 'action.default_popup');
  }
  if (manifest.action.default_icon) {
    if (typeof manifest.action.default_icon === 'string') {
      checkFileExists(manifest.action.default_icon, 'action.default_icon');
    } else {
      for (const [size, iconPath] of Object.entries(manifest.action.default_icon)) {
        checkFileExists(iconPath, `action.default_icon.${size}`);
      }
    }
  }
}

// 5. Check background service worker
if (manifest.background && manifest.background.service_worker) {
  checkFileExists(manifest.background.service_worker, 'background.service_worker');
}

// 6. Check content scripts
if (Array.isArray(manifest.content_scripts)) {
  manifest.content_scripts.forEach((cs, idx) => {
    if (Array.isArray(cs.js)) {
      cs.js.forEach(file => checkFileExists(file, `content_scripts[${idx}].js`));
    }
    if (Array.isArray(cs.css)) {
      cs.css.forEach(file => checkFileExists(file, `content_scripts[${idx}].css`));
    }
  });
}

// 7. Check JavaScript syntax using node --check
console.log('\n🔍 Checking JavaScript syntax...');
const jsFiles = [
  'background.js',
  'popup/popup.js',
  'content/scribd.js',
  'content/slideshare.js',
  'content/studocu.js'
];

for (const jsFile of jsFiles) {
  const fullPath = path.join(ROOT_DIR, jsFile);
  if (fs.existsSync(fullPath)) {
    try {
      execSync(`node --check "${fullPath}"`, { stdio: 'pipe' });
      success(`Syntax OK: ${jsFile}`);
    } catch (err) {
      error(`Syntax error in ${jsFile}:\n${err.stderr ? err.stderr.toString() : err.message}`);
    }
  }
}

console.log('\n--- Validation Result ---');
if (errors > 0) {
  console.error(`💥 Validation failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log('✨ All validation checks passed successfully!\n');
  process.exit(0);
}

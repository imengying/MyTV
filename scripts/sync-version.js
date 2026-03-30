#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();
const versionTsPath = path.join(rootDir, 'src/lib/version.ts');
const packageJsonPath = path.join(rootDir, 'package.json');

function sanitizeVersion(input) {
  if (!input) return null;

  const normalized = String(input).trim().replace(/^refs\/tags\//, '');
  if (!normalized) return null;

  return normalized.startsWith('v') ? normalized.slice(1) : normalized;
}

function readFileIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch {
    return null;
  }
}

function readVersionFromVersionTs() {
  const content = readFileIfExists(versionTsPath);
  if (!content) return null;

  const match = content.match(
    /const CURRENT_VERSION = ['"`]([^'"`]+)['"`];/,
  );
  return match ? match[1] : null;
}

function readVersionFromPackageJson() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || null;
  } catch {
    return null;
  }
}

function readVersionFromGitTag() {
  try {
    const tag = execSync('git describe --tags --exact-match HEAD', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return sanitizeVersion(tag);
  } catch {
    return null;
  }
}

function resolveVersion() {
  const envCandidates = [
    { source: 'APP_VERSION', value: process.env.APP_VERSION },
    { source: 'RELEASE_VERSION', value: process.env.RELEASE_VERSION },
    { source: 'GIT_TAG', value: process.env.GIT_TAG },
    { source: 'VERCEL_GIT_COMMIT_TAG', value: process.env.VERCEL_GIT_COMMIT_TAG },
    {
      source: 'GITHUB_REF_NAME',
      value:
        process.env.GITHUB_REF_TYPE === 'tag'
          ? process.env.GITHUB_REF_NAME
          : null,
    },
  ];

  for (const candidate of envCandidates) {
    const sanitized = sanitizeVersion(candidate.value);
    if (sanitized) {
      return { version: sanitized, source: candidate.source };
    }
  }

  const gitTagVersion = readVersionFromGitTag();
  if (gitTagVersion) {
    return { version: gitTagVersion, source: 'git tag' };
  }

  const versionTsVersion = sanitizeVersion(readVersionFromVersionTs());
  if (versionTsVersion) {
    return { version: versionTsVersion, source: 'src/lib/version.ts fallback' };
  }

  const packageJsonVersion = sanitizeVersion(readVersionFromPackageJson());
  if (packageJsonVersion) {
    return { version: packageJsonVersion, source: 'package.json fallback' };
  }

  return { version: '0.0.0-dev', source: 'default fallback' };
}

function updateVersionTs(version) {
  const content = `const CURRENT_VERSION = '${version}';

// 由 scripts/sync-version.js 在构建前同步，优先使用 git tag。
export { CURRENT_VERSION };
`;

  fs.writeFileSync(versionTsPath, content, 'utf8');
}

function main() {
  const { version, source } = resolveVersion();
  updateVersionTs(version);
  console.log(`✅ synced version: ${version} (${source})`);
}

main();

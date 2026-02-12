const { execFileSync } = require('child_process')

let lastTag
try {
  lastTag = execFileSync('git', ['describe', '--tags', '--abbrev=0'], {
    stdio: ['pipe', 'pipe', 'ignore'],
  }).toString().trim()
} catch {
  // No tags yet — skip the check
  process.exit(0)
}

let diff
try {
  diff = execFileSync('git', ['log', '--name-only', '--pretty=format:', `${lastTag}..HEAD`]).toString()
} catch {
  // Can't check — don't block versioning
  process.exit(0)
}

if (!diff.includes('CHANGELOG.md')) {
  // Block `npm version` so that a git tag is never created without a
  // corresponding CHANGELOG.md entry.  The "version" lifecycle runs after
  // the version bump in package.json but *before* the git commit & tag,
  // so a non-zero exit code here prevents the tag from being created.
  console.error(
    '\x1b[31m✖ Error: CHANGELOG.md has not been modified since ' + lastTag + '.\x1b[0m\n' +
    '  Please add an entry to CHANGELOG.md describing the changes in this release,\n' +
    '  then run \x1b[36mnpm version\x1b[0m again.'
  )
  process.exitCode = 1
}

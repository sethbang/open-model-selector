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
} else {
  // Verify that CHANGELOG.md contains a version heading matching package.json.
  // This prevents trivial whitespace-only edits from satisfying the check above.
  const fs = require('fs')
  const pkg = require('../package.json')
  try {
    const path = require('path')
    const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8')

    if (!changelog.includes('## [' + pkg.version + ']')) {
      console.error(
        '\x1b[31m✖ Error: CHANGELOG.md does not contain a ## [' + pkg.version + '] heading.\x1b[0m\n' +
        '  Please add a "## [' + pkg.version + ']" section to CHANGELOG.md,\n' +
        '  then run \x1b[36mnpm version\x1b[0m again.'
      )
      process.exitCode = 1
    }
  } catch {
    // If CHANGELOG.md can't be read, don't block versioning
  }
}

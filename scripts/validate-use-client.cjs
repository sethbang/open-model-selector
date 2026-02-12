const fs = require('fs')
const path = require('path')

const dist = path.resolve(__dirname, '..', 'dist')
const files = fs.readdirSync(dist).filter(
  (f) => f.endsWith('.js') && !f.startsWith('utils') && !f.startsWith('chunk-'),
)

const missing = files.filter((f) => {
  const content = fs.readFileSync(path.join(dist, f), 'utf8')
  return !content.startsWith('"use client"')
})

if (missing.length) {
  console.error(
    '\x1b[31m✖ Missing "use client" directive in: ' + missing.join(', ') + '\x1b[0m',
  )
  process.exitCode = 1
} else {
  console.log('✅ All ' + files.length + ' JS files in dist/ start with "use client"')
}

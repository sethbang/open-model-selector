#!/usr/bin/env node

/**
 * capture-provider-snapshots.cjs
 *
 * Hits the /models endpoint for every provider in openai-compatible-providers.yaml,
 * saves the raw JSON response to test-fixtures/providers/<slug>.json,
 * and writes a summary report to test-fixtures/providers/_report.json.
 *
 * Usage:
 *   node scripts/capture-provider-snapshots.cjs
 *
 * Environment variables (optional — only needed if a provider requires auth):
 *   OPENROUTER_API_KEY, OPENAI_API_KEY, TOGETHER_API_KEY, GROQ_API_KEY,
 *   MISTRAL_API_KEY, DEEPSEEK_API_KEY, CEREBRAS_API_KEY,
 *   VENICE_API_KEY, GOOGLE_AI_API_KEY, NVIDIA_API_KEY, SAMBANOVA_API_KEY
 */

const fs = require('fs')
const path = require('path')
const parseEnvContent = require('./parse-env.cjs')

// ── Load .env file (respects existing env vars — won't overwrite) ─
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const vars = parseEnvContent(fs.readFileSync(envPath, 'utf-8'))
  for (const [key, val] of Object.entries(vars)) {
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}

// ── Provider Definitions ──────────────────────────────────────────
// We only include providers that have concrete endpoints (no {placeholders}).
// Venice gets a special queryParams to request all model types.

const PROVIDERS = [
  {
    name: 'OpenRouter',
    slug: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1',
    envKey: 'OPENROUTER_API_KEY',
  },
  {
    name: 'OpenAI',
    slug: 'openai',
    endpoint: 'https://api.openai.com/v1',
    envKey: 'OPENAI_API_KEY',
  },
  {
    name: 'Venice AI',
    slug: 'venice',
    endpoint: 'https://api.venice.ai/api/v1',
    envKey: 'VENICE_API_KEY',
    queryParams: { type: 'all' },
  },
  {
    name: 'Together AI',
    slug: 'together',
    endpoint: 'https://api.together.xyz/v1',
    envKey: 'TOGETHER_API_KEY',
  },
  {
    name: 'Groq',
    slug: 'groq',
    endpoint: 'https://api.groq.com/openai/v1',
    envKey: 'GROQ_API_KEY',
  },
  {
    name: 'Cerebras',
    slug: 'cerebras',
    endpoint: 'https://api.cerebras.ai/v1',
    envKey: 'CEREBRAS_API_KEY',
  },
  {
    name: 'Mistral AI',
    slug: 'mistral',
    endpoint: 'https://api.mistral.ai/v1',
    envKey: 'MISTRAL_API_KEY',
  },
  {
    name: 'DeepSeek',
    slug: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1',
    envKey: 'DEEPSEEK_API_KEY',
  },
  {
    name: 'Google AI Studio',
    slug: 'google-ai',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
    envKey: 'GOOGLE_AI_API_KEY',
  },
  {
    name: 'Nvidia NIM',
    slug: 'nvidia',
    endpoint: 'https://integrate.api.nvidia.com/v1',
    envKey: 'NVIDIA_API_KEY',
  },
  {
    name: 'SambaNova',
    slug: 'sambanova',
    endpoint: 'https://api.sambanova.ai/v1',
    envKey: 'SAMBANOVA_API_KEY',
  },
  {
    name: 'Helicone',
    slug: 'helicone',
    endpoint: 'https://ai-gateway.helicone.ai/v1',
    envKey: 'HELICONE_API_KEY', // not required
  },
  {
    name: 'Vercel AI Gateway',
    slug: 'vercel',
    endpoint: 'https://ai-gateway.vercel.sh/v1',
    envKey: 'VERCEL_API_KEY', // not required
  },
]

// ── Helpers ────────────────────────────────────────────────────────

const FIXTURES_DIR = path.join(__dirname, '..', 'test-fixtures', 'providers')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * Fetch the /models endpoint for a provider.
 * Returns { ok, status, body, error, authRequired }.
 */
async function fetchModels(provider) {
  const apiKey = process.env[provider.envKey]
  const params = provider.queryParams ?? {}
  const qs = new URLSearchParams(params).toString()
  const url = `${provider.endpoint.replace(/\/+$/, '')}/models${qs ? `?${qs}` : ''}`

  const headers = { 'Accept': 'application/json' }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const controller = new AbortController()
  // 15 s timeout — longer than the 10 s used in the useModels() browser hook
  // because CLI snapshots can tolerate slower responses (cold-starts, rate limits).
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(url, { headers, signal: controller.signal })
    clearTimeout(timeout)

    const text = await res.text()
    let body
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }

    const authRequired = !res.ok && (res.status === 401 || res.status === 403)
    return { ok: res.ok, status: res.status, body, error: null, authRequired, apiKeyUsed: !!apiKey }
  } catch (err) {
    clearTimeout(timeout)
    return { ok: false, status: null, body: null, error: err.message, authRequired: false, apiKeyUsed: !!apiKey }
  }
}

/**
 * Extract the model array from a response body.
 * Tries: top-level array → .data → .models
 */
function extractModels(body) {
  if (Array.isArray(body)) return body
  if (body && typeof body === 'object') {
    if (Array.isArray(body.data)) return body.data
    if (Array.isArray(body.models)) return body.models
  }
  return []
}

/**
 * Analyze a single model object to detect which fields are present.
 */
function analyzeModelFields(model) {
  if (!model || typeof model !== 'object') return {}
  const fields = {}
  for (const key of Object.keys(model)) {
    const val = model[key]
    if (val === null || val === undefined) {
      fields[key] = 'null'
    } else if (Array.isArray(val)) {
      fields[key] = `array[${val.length}]`
    } else if (typeof val === 'object') {
      fields[key] = `object{${Object.keys(val).join(',')}}`
    } else {
      fields[key] = typeof val
    }
  }
  return fields
}

/**
 * Collect unique type values from all models.
 */
function collectTypes(models) {
  const types = new Map()
  for (const m of models) {
    // Check explicit type field
    const t = m.type ?? m.model_type ?? 'NONE'
    types.set(t, (types.get(t) || 0) + 1)
  }
  return Object.fromEntries(types)
}

/**
 * Detect the response wrapper shape.
 */
function detectWrapper(body) {
  if (Array.isArray(body)) return 'top-level-array'
  if (body && typeof body === 'object') {
    if (Array.isArray(body.data)) return '{ data: [...] }'
    if (Array.isArray(body.models)) return '{ models: [...] }'
    return `object{${Object.keys(body).slice(0, 5).join(',')}}`
  }
  return typeof body
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  ensureDir(FIXTURES_DIR)

  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║         Provider /models Snapshot Capture                   ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log()

  const report = []

  for (const provider of PROVIDERS) {
    const hasKey = !!process.env[provider.envKey]
    const keyStatus = hasKey ? '🔑' : '🔓'
    process.stdout.write(`${keyStatus} ${provider.name.padEnd(20)} ... `)

    const result = await fetchModels(provider)

    if (!result.ok) {
      if (result.authRequired) {
        console.log(`❌ AUTH REQUIRED (${result.status}) — set ${provider.envKey}`)
      } else if (result.error) {
        console.log(`❌ ERROR: ${result.error}`)
      } else {
        console.log(`❌ HTTP ${result.status}`)
      }
      report.push({
        provider: provider.name,
        slug: provider.slug,
        ok: false,
        status: result.status,
        error: result.error || `HTTP ${result.status}`,
        authRequired: result.authRequired,
        apiKeyUsed: result.apiKeyUsed,
      })
      continue
    }

    // Save full response
    const outPath = path.join(FIXTURES_DIR, `${provider.slug}.json`)
    fs.writeFileSync(outPath, JSON.stringify(result.body, null, 2))

    const models = extractModels(result.body)
    const wrapper = detectWrapper(result.body)
    const types = collectTypes(models)
    const specimen = models[0] ? analyzeModelFields(models[0]) : {}

    // Also save a specimen (first model) for easy inspection
    if (models[0]) {
      const specimenPath = path.join(FIXTURES_DIR, `${provider.slug}.specimen.json`)
      fs.writeFileSync(specimenPath, JSON.stringify(models[0], null, 2))
    }

    console.log(`✅ ${models.length} models | wrapper: ${wrapper} | types: ${JSON.stringify(types)}`)

    report.push({
      provider: provider.name,
      slug: provider.slug,
      ok: true,
      status: result.status,
      modelCount: models.length,
      wrapper,
      types,
      specimenFields: specimen,
      apiKeyUsed: result.apiKeyUsed,
    })
  }

  // Write summary report
  const reportPath = path.join(FIXTURES_DIR, '_report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log()
  console.log(`📋 Report saved to: test-fixtures/providers/_report.json`)
  console.log(`📁 Snapshots in:    test-fixtures/providers/`)
  console.log()

  // Print summary table
  console.log('┌─────────────────────┬────────┬────────┬──────────────────────────┐')
  console.log('│ Provider            │ Status │ Models │ Types                    │')
  console.log('├─────────────────────┼────────┼────────┼──────────────────────────┤')
  for (const r of report) {
    const name = r.provider.padEnd(19)
    const status = r.ok ? ' ✅  ' : (r.authRequired ? ' 🔑  ' : ' ❌  ')
    const count = r.ok ? String(r.modelCount).padStart(6) : '     -'
    const types = r.ok
      ? JSON.stringify(r.types).substring(0, 24).padEnd(24)
      : (r.authRequired ? `Need ${r.slug.toUpperCase()}_API_KEY`.padEnd(24) : 'Failed'.padEnd(24))
    console.log(`│ ${name} │${status} │${count} │ ${types} │`)
  }
  console.log('└─────────────────────┴────────┴────────┴──────────────────────────┘')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})

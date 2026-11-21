import assert from 'node:assert/strict'
import { test } from 'node:test'
import { azureCompletion, azureConfiguration, AzureResearchError } from '../training/azure_client.mjs'

test('research client sends bounded requests and keeps provider bodies out of errors', async () => {
  const names = ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_CHAT_DEPLOYMENT', 'AZURE_OPENAI_API_VERSION']
  const previous = names.map(name => process.env[name])
  const originalFetch = globalThis.fetch
  Object.assign(process.env, { AZURE_OPENAI_ENDPOINT: 'https://research.example.invalid/',
    AZURE_OPENAI_API_KEY: 'test-only-secret', AZURE_OPENAI_CHAT_DEPLOYMENT: 'vision model',
    AZURE_OPENAI_API_VERSION: '2024-10-21' })
  try {
    const configuration = azureConfiguration()
    assert.match(configuration.url.pathname, /deployments\/vision%20model\/chat\/completions$/)
    globalThis.fetch = async (url, options) => {
      assert.equal(options.headers['api-key'], 'test-only-secret')
      assert.deepEqual(JSON.parse(options.body), { messages: [{ role: 'user', content: 'Public test data' }],
        max_completion_tokens: 512, reasoning_effort: 'low' })
      return Response.json({ model: 'test-model', choices: [{ message: { content: 'UNKNOWN' }, finish_reason: 'stop' }], usage: { total_tokens: 8 } })
    }
    const result = await azureCompletion([{ role: 'user', content: 'Public test data' }], { maxTokens: 512, reasoningEffort: 'low' })
    assert.equal(result.text, 'UNKNOWN')
    assert.equal(result.model, 'test-model')
    assert.equal('key' in result, false)
    globalThis.fetch = async () => Response.json({ error: { code: 'Unauthorized', message: 'provider-echo-private-input' } }, { status: 401 })
    await assert.rejects(azureCompletion([]), error => {
      assert.ok(error instanceof AzureResearchError)
      assert.equal(error.status, 401)
      assert.equal(error.code, 'Unauthorized')
      assert.doesNotMatch(error.stack, /test-only-secret|provider-echo-private-input/)
      return true
    })
    process.env.AZURE_OPENAI_ENDPOINT = 'http://research.example.invalid'
    assert.throws(azureConfiguration, /HTTPS/)
  } finally {
    globalThis.fetch = originalFetch
    names.forEach((name, index) => { if (previous[index] === undefined) delete process.env[name]; else process.env[name] = previous[index] })
  }
})

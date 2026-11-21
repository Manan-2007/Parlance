/** Research client: credentials and signed payloads never enter result files. */
export class AzureResearchError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function azureConfiguration() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim().replace(/\/$/, '')
  const key = process.env.AZURE_OPENAI_API_KEY?.trim()
  const deployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT?.trim()
  const version = process.env.AZURE_OPENAI_API_VERSION?.trim() || '2024-10-21'
  if (!endpoint || !key || !deployment) throw new Error('Azure research configuration is incomplete')
  const url = new URL(`${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions`)
  if (url.protocol !== 'https:') throw new Error('Azure endpoint must use HTTPS')
  url.searchParams.set('api-version', version)
  return { url, key }
}

export async function azureCompletion(messages, { maxTokens = 256, reasoningEffort, timeoutMs = 45000 } = {}) {
  const { url, key } = azureConfiguration()
  const body = { messages, max_completion_tokens: maxTokens }
  if (reasoningEffort) body.reasoning_effort = reasoningEffort
  const started = performance.now()
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': key },
    body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    // Error codes are useful diagnostics; raw provider bodies may echo inputs.
    throw new AzureResearchError('Azure research request failed', response.status, result.error?.code || 'provider_error')
  }
  return { model: result.model, text: result.choices?.[0]?.message?.content || '',
    finishReason: result.choices?.[0]?.finish_reason, usage: result.usage,
    milliseconds: Math.round(performance.now() - started) }
}

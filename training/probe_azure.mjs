import { mkdir, writeFile } from 'node:fs/promises'
import { azureCompletion } from './azure_client.mjs'

await mkdir('.research-cache', { recursive: true })
try {
  const result = await azureCompletion([{ role: 'user', content: 'Reply with OK.' }], { maxTokens: 64 })
  const report = { reachable: true, model: result.model, milliseconds: result.milliseconds,
    finishReason: result.finishReason, contentPresent: Boolean(result.text), usage: result.usage }
  await writeFile('.research-cache/azure-capability-probe.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
} catch (error) {
  const report = { reachable: false, status: error.status, code: error.code || error.name }
  await writeFile('.research-cache/azure-capability-probe.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
  process.exitCode = 1
}

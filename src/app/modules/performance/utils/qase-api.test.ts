import { afterEach, expect, test } from 'bun:test'
import { QaseAPI } from './qase-api'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('createSuite returns the full QaseSuite shape required by UI state', async () => {
  globalThis.fetch = Object.assign(
    async () => Response.json({ status: true, result: { id: 42 } }),
    { preconnect: () => undefined },
  )

  const suite = await new QaseAPI('test-token').createSuite('GI', 'Stock', 7)

  expect(suite).toEqual({
    id: 42,
    title: 'Stock',
    description: '',
    preconditions: '',
    position: 0,
    parent_id: 7,
  })
})

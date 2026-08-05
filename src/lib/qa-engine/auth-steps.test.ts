import { expect, test } from 'bun:test'
import { QAEngine } from './qa-engine'
import { buildScopeAuthSteps } from './auth-steps'

const actions = async (prd: string) =>
  (await QAEngine.generateTests(prd))[0]?.steps.map((step) => step.action) ?? []

test('prepends Web Invest login before authenticated feature steps', async () => {
  const result = await actions('Growin Invest Web Stock Screener. Authenticated user accesses F1 — Popular Screener.')

  expect(result.slice(0, 4)).toEqual([
    'Buka halaman login https://pro.growin.id/login',
    'Input UserID',
    'Input Password',
    'Click button Login',
  ])
})

test('uses Mobile Pro Android Qase-derived profile with PIN for order scope', () => {
  const auth = buildScopeAuthSteps('Growin Mobile Pro Android. Authenticated user submits Pro Order.')

  expect(auth.map((step) => step.action)).toContain('Input valid PIN')
  expect(auth.every((step) => step.source === 'Qase-derived MP auth profile: Login Success with Input Pin')).toBe(true)
})

test('does not force login into public registration scope', () => {
  expect(buildScopeAuthSteps('Growin Mobile Android public registration and onboarding')).toEqual([])
})

test('uses Web Pro profile and PIN for authenticated order scope', () => {
  const auth = buildScopeAuthSteps('Growin Pro Web authenticated order entry')

  expect(auth.at(-2)?.action).toBe('Input valid PIN')
  expect(auth[0]?.source).toBe('Qase-derived GP auth profile: Login - input PIN success')
})

test('uses OTP instead of PIN when ITS explicitly requires MFA', () => {
  const actions = buildScopeAuthSteps('Internal Trading System authenticated withdrawal with MFA OTP').map((step) => step.action)

  expect(actions).toContain('Input valid OTP')
  expect(actions).not.toContain('Input valid PIN')
})

test('prepends auth steps on generic PRD branch', async () => {
  const result = await actions('Growin Mobile Invest iOS. F1 - Portfolio: Authenticated user views portfolio.')

  expect(result[0]).toBe('Buka halaman login https://pro.growin.id/login')
  expect(result).toContain('Click button Login')
})

test('does not add login to a public generic PRD when explicitly stated', async () => {
  const result = await actions('Public Landing Page. F1 - Pricing without login: Guest views pricing.')

  expect(result.some((action) => /password|user id/i.test(action))).toBe(false)
  expect(result[0]).toBe('Akses aplikasi tanpa login (Guest mode).')
})

test('does not establish a session for an unauthenticated access scenario', () => {
  expect(buildScopeAuthSteps('Growin Invest Stock Screener access without login must be rejected')).toEqual([])
})

test('resolves authentication per scenario inside a mixed-scope PRD', () => {
  const prd = 'Growin Mobile Invest supports public registration and authenticated portfolio.'

  expect(buildScopeAuthSteps(prd, 'User completes registration')).toEqual([])
  expect(buildScopeAuthSteps(prd, 'User views portfolio')).not.toEqual([])
})

test('inherits authenticated product context when child scenario omits auth wording', () => {
  expect(buildScopeAuthSteps('Growin Invest Web authenticated Stock Screener', 'User adds a filter')).not.toEqual([])
})

test('applies authentication per generated case instead of whole PRD', async () => {
  const tests = await QAEngine.generateTests([
    'Growin Mobile Invest iOS supports public registration and authenticated portfolio.',
    'F1 — Registration without login: Public user completes registration.',
    'F2 — Portfolio: Authenticated user views portfolio.',
  ].join('\n'))
  const registration = tests.find((item) => item.requirementId === 'F1')
  const portfolio = tests.find((item) => item.requirementId === 'F2')

  expect(registration?.steps.some((step) => step.action.includes('Akses aplikasi tanpa login'))).toBe(true)
  expect(portfolio?.steps.some((step) => step.action.includes('Buka halaman login'))).toBe(true)
})


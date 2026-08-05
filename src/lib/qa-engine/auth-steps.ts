import { t } from './locales'

export interface AuthStep {
  action: string
  expectedResult: string
  source: string
}

const PUBLIC_SCOPE = /\b(registration|register|sign[ -]?up|onboarding|oao|forgot password|reset password|public page|landing page|guest|without login|not logged in|unauthenticated)\b/i
const AUTH_REQUIRED = /\b(authenticated|logged in|requires? login|after login|stock screener|portfolio|order|trading|transaction|withdraw|watchlist|growin|internal trading system|\bITS\b)\b/i
const SENSITIVE_ACTION = /\b(pin|order|buy|sell|trade|transaction|withdraw|eipo|sbn|portfolio|account)\b/i

const step = (profile: string, action: string, expectedResult: string): AuthStep => ({
  action,
  expectedResult,
  source: profile,
})

export function buildScopeAuthSteps(requirement: string, scenario = requirement): AuthStep[] {
  const context = `${requirement} ${scenario}`
  if (PUBLIC_SCOPE.test(scenario) || !AUTH_REQUIRED.test(context)) return []
  const mobile = /\b(mobile|android|ios)\b/i.test(context)
  const pro = /\b(pro|mobile pro)\b/i.test(context)
  const invest = /\b(invest|mobile invest)\b/i.test(context)
  const its = /\b(internal trading system|ITS)\b/i.test(context)
  const os = /\bios\b/i.test(context) ? 'iOS' : /\bandroid\b/i.test(context) ? 'Android' : 'target device'
  const variant = pro ? 'Pro' : invest ? 'Invest' : ''
  const profile = its
    ? `Qase-derived ITS auth profile: ${/\b(otp|2fa|mfa)\b/i.test(context) ? 'Login ITS with OTP' : 'ITS-Success Login'}`
    : mobile && pro
      ? 'Qase-derived MP auth profile: Login Success with Input Pin'
      : mobile && invest
        ? 'Qase-derived GM auth profile: Login Success'
        : mobile && /\bios\b/i.test(requirement)
          ? 'Qase-derived GIOS auth profile: Login Growin using UserID'
          : mobile
            ? 'Qase-derived GA auth profile: Login Growin using UserID'
            : pro
              ? 'Qase-derived GP auth profile: Login - input PIN success'
              : invest
                ? 'Qase-derived GI auth profile: Login Success'
                : 'Qase-derived scoped auth profile'
  const loginTarget = its ? 'ITS login page' : mobile ? `Growin Mobile ${variant || ''} application on ${os}`.replace(/\s+/g, ' ').trim() : `Growin ${variant || 'Web'} Web login page`
  const submit = mobile ? t('tapLogin') : t('clickLogin')

  const result = [
    step(profile, t('openTargetPattern', loginTarget), t('loginEntryDisplayed')),
  ]
  if (mobile) result.push(step(profile, t('tapLogin'), t('credentialFormDisplayed')))
  result.push(
    step(profile, t('inputUserIdAuth'), t('userIdAccepted')),
    step(profile, t('inputPasswordAuth'), t('passwordAccepted')),
    step(profile, submit, t('credentialsSubmitted')),
  )

  if (/\b(otp|2fa|mfa)\b/i.test(context)) {
    result.push(step(profile, t('inputOtp'), t('otpAccepted')))
  } else if (SENSITIVE_ACTION.test(scenario) && (pro || its || mobile)) {
    result.push(step(profile, t('inputPin'), t('pinAccepted')))
  }

  result.push(step(profile, t('verifyLoggedIn'), t('sessionEstablished')))
  return result
}

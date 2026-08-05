const QASE_API_BASE = 'https://api.qase.io/v1'

export interface QaseProject {
  id: number
  code: string
  title: string
  description: string
  access: string
  group: string | null
  counts: {
    cases: number
    suites: number
    runs: number
  }
}

export interface QaseSuite {
  id: number
  title: string
  description: string
  preconditions: string
  position: number
}

export interface QaseTestCase {
  id: number
  title: string
  description: string
  preconditions: string
  postconditions: string
  priority: number
  severity: number
  type: number
  behavior: number
  status: number
  suite_id: number
  tags: string[]
  steps: Array<{
    action: string
    expected_result: string
    data: string
  }>
}

export interface QaseRun {
  id: number
  title: string
  status: number
  started_at: string
  ended_at: string
  public_id: number
}

export interface QaseDefect {
  id: number
  title: string
  status: number
  milestone_id: number | null
  created_at: string
}

export interface QaseCapabilityStatus {
  resource: string
  endpoint: string
  status: 'available' | 'error' | 'pending'
  count: number
  lastChecked: string | null
  error?: string
}

/**
 * Qase wraps list responses as:
 *   { status: true, result: { total, filtered, count, entities: [...] } }
 *
 * Some endpoints / older responses return `result` directly as an array.
 * This normalizes both shapes into a plain array so callers never have to guess.
 */
export interface QaseListResult<T> {
  total?: number
  filtered?: number
  count?: number
  entities?: T[]
}

export interface QaseListResponse<T> {
  status?: boolean
  result?: QaseListResult<T> | T[]
}

export function extractEntities<T>(payload: unknown): T[] {
  if (!payload) return []

  // Already an array (e.g. someone passed `result` straight through)
  if (Array.isArray(payload)) return payload as T[]

  const record = payload as Record<string, unknown>

  // { result: ... }
  if ('result' in record) {
    return extractEntities<T>(record.result)
  }

  // { entities: [...] }
  if (Array.isArray(record.entities)) {
    return record.entities as T[]
  }

  return []
}

export function extractTotal(payload: unknown, fallback: number): number {
  if (!payload || Array.isArray(payload)) return fallback

  const record = payload as Record<string, unknown>

  if ('result' in record) {
    return extractTotal(record.result, fallback)
  }

  if (typeof record.total === 'number') return record.total
  if (typeof record.count === 'number') return record.count

  return fallback
}

export class QaseAPI {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async makeRequest<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    const url = `${QASE_API_BASE}${endpoint}`
    const options: RequestInit = {
      method,
      headers: {
        Token: this.token,
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { message?: string }
      throw new Error(
        `Qase API Error: ${response.status} - ${errorData.message || response.statusText}`
      )
    }

    const data = (await response.json()) as T
    return data
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest<QaseListResponse<QaseProject>>('GET', '/project')
      return Boolean(response) && Array.isArray(extractEntities<QaseProject>(response))
    } catch (error) {
      console.error('[v0] Connection test failed:', error)
      return false
    }
  }

  async getProjects(): Promise<QaseProject[]> {
    try {
      const response = await this.makeRequest<QaseListResponse<QaseProject>>('GET', '/project')
      return extractEntities<QaseProject>(response)
    } catch (error) {
      console.error('[v0] Failed to fetch projects:', error)
      throw error
    }
  }

  async getSuites(projectCode: string): Promise<QaseSuite[]> {
    try {
      const response = await this.makeRequest<QaseListResponse<QaseSuite>>(
        'GET',
        `/suite/${projectCode}`
      )
      return extractEntities<QaseSuite>(response)
    } catch (error) {
      console.error(`[v0] Failed to fetch suites for ${projectCode}:`, error)
      throw error
    }
  }

  async getTestCases(projectCode: string): Promise<QaseTestCase[]> {
    try {
      const response = await this.makeRequest<QaseListResponse<QaseTestCase>>(
        'GET',
        `/case/${projectCode}`
      )
      return extractEntities<QaseTestCase>(response)
    } catch (error) {
      console.error(`[v0] Failed to fetch test cases for ${projectCode}:`, error)
      throw error
    }
  }

  async getRuns(projectCode: string): Promise<QaseRun[]> {
    try {
      const response = await this.makeRequest<QaseListResponse<QaseRun>>(
        'GET',
        `/run/${projectCode}`
      )
      return extractEntities<QaseRun>(response)
    } catch (error) {
      console.error(`[v0] Failed to fetch runs for ${projectCode}:`, error)
      throw error
    }
  }

  async getDefects(projectCode: string): Promise<QaseDefect[]> {
    try {
      const response = await this.makeRequest<QaseListResponse<QaseDefect>>(
        'GET',
        `/defect/${projectCode}`
      )
      return extractEntities<QaseDefect>(response)
    } catch (error) {
      console.error(`[v0] Failed to fetch defects for ${projectCode}:`, error)
      throw error
    }
  }

  async bulkCreateTestCases(projectCode: string, cases: Partial<QaseTestCase>[]): Promise<void> {
    try {
      await this.makeRequest('POST', `/case/${projectCode}/bulk`, { cases })
    } catch (error) {
      console.error(`[v0] Failed to create test cases in ${projectCode}:`, error)
      throw error
    }
  }
}

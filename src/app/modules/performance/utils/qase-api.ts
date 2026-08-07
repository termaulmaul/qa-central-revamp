const QASE_API_BASE = '/api/qase'

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
  parent_id: number | null
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
  if (Array.isArray(payload)) return payload as T[]

  const record = payload as Record<string, unknown>
  if ('result' in record) {
    return extractEntities<T>(record.result)
  }
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
      const response = await this.makeRequest<QaseListResponse<QaseProject>>('GET', '/project?limit=1')
      return Boolean(response) && Array.isArray(extractEntities<QaseProject>(response))
    } catch (error) {
      console.error('[v0] Connection test failed:', error)
      return false
    }
  }

  async getProjects(): Promise<QaseProject[]> {
    try {
      const response = await this.makeRequest<QaseListResponse<QaseProject>>('GET', '/project?limit=100')
      return extractEntities<QaseProject>(response)
    } catch (error) {
      console.error('[v0] Failed to fetch projects:', error)
      throw error
    }
  }

  async createProject(title: string, code: string): Promise<QaseProject> {
    try {
      const response = await this.makeRequest<any>('POST', '/project', {
        title,
        code: code.toUpperCase()
      })
      return { id: 0, title, code: code.toUpperCase(), counts: { cases: 0 } } as QaseProject
    } catch (error) {
      console.error('[v0] Failed to create project:', error)
      throw error
    }
  }

  async getSuites(projectCode: string): Promise<QaseSuite[]> {
    try {
      const response = await this.makeRequest<QaseListResponse<QaseSuite>>(
        'GET',
        `/suite/${projectCode}?limit=100`
      )
      return extractEntities<QaseSuite>(response)
    } catch (error) {
      console.error(`[v0] Failed to fetch suites for ${projectCode}:`, error)
      throw error
    }
  }

  async createSuite(projectCode: string, title: string, parentId?: number): Promise<QaseSuite> {
    try {
      const payload: any = { title }
      if (parentId) payload.parent_id = parentId
      
      const response = await this.makeRequest<any>(
        'POST',
        `/suite/${projectCode}`,
        payload
      )
      // Qase returns { status: true, result: { id: 123 } } for creation
      return {
        id: response.result?.id,
        title,
        description: '',
        preconditions: '',
        position: 0,
        parent_id: parentId ?? null,
      }
    } catch (error) {
      console.error(`[v0] Failed to create suite in ${projectCode}:`, error)
      throw error
    }
  }

  async bulkCreateTestCases(projectCode: string, cases: Partial<QaseTestCase>[]): Promise<void> {
    try {
      // Chunk cases into groups of 50 to avoid 502 Bad Gateway from Qase API payload limits
      const chunkSize = 50
      for (let i = 0; i < cases.length; i += chunkSize) {
        const chunk = cases.slice(i, i + chunkSize)
        await this.makeRequest('POST', `/case/${projectCode}/bulk`, { cases: chunk })
      }
    } catch (error) {
      console.error(`[v0] Failed to create test cases in ${projectCode}:`, error)
      throw error
    }
  }
}

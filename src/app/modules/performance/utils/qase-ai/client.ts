import type { QaseProject } from '@/types/qase';
import { toQaseCase, toQaseSuite } from './adapters';
import { QaseProjectsAPI } from './projects';
import { QaseSuitesAPI } from './suites';
import { QaseCasesAPI } from './cases';
import { QaseLearningCache } from './cache';
import { QaseKnowledgeGraph } from './knowledge';

export interface QaseAIModule {
  getProjects(): Promise<QaseProject[]>;
  getSuites(projectCode: string): Promise<unknown[]>;
  getCases(projectCode: string, suiteId?: string): Promise<unknown[]>;
  updateKnowledge(project: unknown, suites: unknown[], cases: unknown[]): Promise<void>;
  generateRecommendations(projectCode: string): Promise<unknown>;
  detectDuplicates(projectCode: string): Promise<unknown[]>;
  analyzeCoverage(projectCode: string): Promise<unknown>;
}

export class QaseAIClient implements QaseAIModule {
  private cache: QaseLearningCache;
  private knowledgeGraph: QaseKnowledgeGraph;
  private projectsAPI: QaseProjectsAPI;
  private suitesAPI: QaseSuitesAPI;
  private casesAPI: QaseCasesAPI;

  constructor(projectsAPI: QaseProjectsAPI, suitesAPI: QaseSuitesAPI, casesAPI: QaseCasesAPI) {
    this.projectsAPI = projectsAPI;
    this.suitesAPI = suitesAPI;
    this.casesAPI = casesAPI;
    this.cache = new QaseLearningCache();
    this.knowledgeGraph = new QaseKnowledgeGraph();
  }

  async getProjects(): Promise<QaseProject[]> {
    const cacheKey = 'projects';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached as QaseProject[];

    const projects = await this.projectsAPI.getAll();
    await this.cache.set(cacheKey, projects, 3600000); // 1 hour
    return projects;
  }

  async getSuites(projectCode: string): Promise<unknown[]> {
    const cacheKey = `suites-${projectCode}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached as unknown[];

    const suites = await this.suitesAPI.getByProject(projectCode);
    await this.cache.set(cacheKey, suites, 3600000);
    await this.knowledgeGraph.addSuiteData(projectCode, suites.map(toQaseSuite));
    return suites;
  }

  async getCases(projectCode: string, suiteId?: string): Promise<unknown[]> {
    const cacheKey = suiteId
      ? `cases-${projectCode}-${suiteId}`
      : `cases-${projectCode}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached as unknown[];

    const cases = await this.casesAPI.getByProject(projectCode, suiteId);
    await this.cache.set(cacheKey, cases, 600000); // 10 minutes
    await this.knowledgeGraph.addCasesData(projectCode, suiteId, cases.map(toQaseCase));
    return cases;
  }

  async updateKnowledge(project: unknown, suites: unknown[], cases: unknown[]): Promise<void> {
    const rawSuites = suites as import('./suites').QaseSuiteRaw[];
    const rawCases = cases as import('./cases').QaseCaseRaw[];
    await this.knowledgeGraph.addProjectData(project as QaseProject, rawSuites.map(toQaseSuite), rawCases.map(toQaseCase));
    await this.cache.updateLearningMetrics();
  }

  async generateRecommendations(projectCode: string): Promise<unknown> {
    return await this.knowledgeGraph.getRecommendations(projectCode);
  }

  async detectDuplicates(projectCode: string): Promise<unknown[]> {
    return await this.knowledgeGraph.findDuplicates(projectCode);
  }

  async analyzeCoverage(projectCode: string): Promise<unknown> {
    return await this.knowledgeGraph.analyzeProjectCoverage(projectCode);
  }
}

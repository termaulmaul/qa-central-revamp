import { QaseProjectsAPI } from './projects';
import { QaseSuitesAPI } from './suites';
import { QaseCasesAPI } from './cases';
import { QaseLearningCache } from './cache';
import { QaseKnowledgeGraph } from './knowledge';
import { QaseLearningEngine, type LearningResult } from './learning';
import type { QaseProject } from '../../types/qase';
import { toQaseCase, toQaseSuite } from './adapters';

export interface CrawlProgress {
  projectCode: string;
  stage: 'projects' | 'suites' | 'cases' | 'learning' | 'complete';
  percentage: number;
  message: string;
}

export class QaseCrawler {
  private projectsAPI: QaseProjectsAPI;
  private suitesAPI: QaseSuitesAPI;
  private casesAPI: QaseCasesAPI;
  private cache: QaseLearningCache;
  private knowledgeGraph: QaseKnowledgeGraph;
  private learningEngine: QaseLearningEngine;

  constructor(token: string, baseUrl?: string) {
    this.projectsAPI = new QaseProjectsAPI(token, baseUrl);
    this.suitesAPI = new QaseSuitesAPI(token, baseUrl);
    this.casesAPI = new QaseCasesAPI(token, baseUrl);
    this.cache = new QaseLearningCache();
    this.knowledgeGraph = new QaseKnowledgeGraph();
    this.learningEngine = new QaseLearningEngine();
  }

  onProgress?: (progress: CrawlProgress) => void;

  private report(stage: CrawlProgress['stage'], projectCode: string, percentage: number, message: string): void {
    this.onProgress?.({ projectCode, stage, percentage, message });
  }

  async crawl(projectCode?: string): Promise<Map<string, LearningResult>> {
    const results = new Map<string, LearningResult>();

    this.report('projects', '', 0, 'Fetching projects');
    const projects = projectCode
      ? [(await this.projectsAPI.getByCode(projectCode))].filter(Boolean) as QaseProject[]
      : await this.projectsAPI.getAll();

    if (!projects.length) {
      this.report('complete', projectCode ?? '', 100, 'No projects found');
      return results;
    }

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const code = project.code;
      const baseProgress = (i / projects.length) * 100;

      this.report('suites', code, baseProgress, `Fetching suites for ${code}`);
      const suites = await this.suitesAPI.getTree(code);
      this.cache.set(`suites-${code}`, suites, 3600000);

      this.report('cases', code, baseProgress + 10, `Fetching cases for ${code}`);
      const cases = await this.casesAPI.getByProject(code);
      this.cache.set(`cases-${code}`, cases, 600000);

      this.report('learning', code, baseProgress + 30, `Learning from ${code}`);

      // Populate knowledge graph
      this.knowledgeGraph.addProjectData(project, suites.map(toQaseSuite), cases.map(toQaseCase));

      // Run learning engine
      const qaseCases = cases.map(toQaseCase);
      const learning = this.learningEngine.learn(code, qaseCases);

      results.set(code, learning);

      await this.cache.set(`learned-${code}`, learning, 3600000);
      await this.cache.setSyncMeta(code, { lastSync: new Date().toISOString(), etag: null, updatedAt: null, revision: 0 });
    }

    this.report('complete', '', 100, 'Crawl complete');
    return results;
  }

  async incrementalSync(projectCode: string): Promise<boolean> {
    const meta = await this.cache.getSyncMeta(projectCode);
    if (!meta.lastSync) {
      await this.crawl(projectCode);
      return true;
    }

    const cases = await this.casesAPI.getByProject(projectCode);
    if (cases.length > 0) {
      await this.cache.set(`cases-${projectCode}`, cases, 600000);
      await this.cache.setSyncMeta(projectCode, { lastSync: new Date().toISOString(), revision: meta.revision + 1 });
    }
    return true;
  }

  getKnowledgeGraph(): QaseKnowledgeGraph {
    return this.knowledgeGraph;
  }

  getCache(): QaseLearningCache {
    return this.cache;
  }
}
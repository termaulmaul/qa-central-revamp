import type { QaseProject, QaseSuite, QaseCase } from '../../types/qase';

export interface GraphNode {
  id: string;
  type: GraphEntity;
  label: string;
  properties: Record<string, unknown>;
  relationships: string[];
}

export type GraphEntity =
  | 'requirement' | 'feature' | 'suite' | 'section' | 'scenario'
  | 'test-case' | 'step' | 'expected-result' | 'risk'
  | 'automation-pattern' | 'business-rule' | 'tag'
  | 'priority' | 'severity';

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
  weight: number;
}

export interface Recommendation {
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  sourceIds?: string[];
}

export class QaseKnowledgeGraph {
  private nodes = new Map<string, GraphNode>();
  private edges: GraphEdge[] = [];
  private projectIndex = new Map<string, Set<string>>();

  addProjectData(project: QaseProject, suites: QaseSuite[], cases: QaseCase[]): void {
    const pNode: GraphNode = {
      id: `project-${project.code}`,
      type: 'feature',
      label: project.title,
      properties: { code: project.code },
      relationships: [],
    };
    this.addNode(pNode);

    for (const suite of suites) {
      this.addSuiteData(project.code, [suite]);
    }
    for (const tc of cases) {
      this.addCaseData(tc);
    }
  }

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    const parts = node.id.split('-');
    if (parts[0] === 'project' && parts[1]) {
      const set = this.projectIndex.get(parts[1]) ?? new Set();
      set.add(node.id);
      this.projectIndex.set(parts[1], set);
    }
  }

  addEdge(from: string, to: string, type: string, weight = 1): void {
    this.edges.push({ from, to, type, weight });
  }

  addSuiteData(projectCode: string, suites: QaseSuite[]): void {
    for (const suite of suites) {
      const sNode: GraphNode = {
        id: `suite-${projectCode}-${suite.id}`,
        type: suite.parentId ? 'section' : 'suite',
        label: suite.title,
        properties: { suiteId: suite.id, parentId: suite.parentId, casesCount: suite.casesCount },
        relationships: [],
      };
      this.addNode(sNode);
      this.addEdge(`project-${projectCode}`, sNode.id, 'contains');
      if (suite.parentId) {
        this.addEdge(`suite-${projectCode}-${suite.parentId}`, sNode.id, 'contains');
      }
    }
  }

  addCasesData(projectCode: string, suiteId: string | undefined, cases: QaseCase[]): void {
    for (const tc of cases) {
      this.addCaseData(tc);
      if (suiteId) {
        this.addEdge(`suite-${projectCode}-${suiteId}`, `case-${tc.id}`, 'contains');
      }
    }
  }

  addCaseData(tc: QaseCase): void {
    const cNode: GraphNode = {
      id: `case-${tc.id}`,
      type: 'test-case',
      label: tc.title,
      properties: {
        severity: tc.severity, priority: tc.priority, type: tc.type,
        automationStatus: tc.automationStatus, status: tc.status,
        suiteTitle: tc.suiteTitle,
      },
      relationships: [],
    };
    this.addNode(cNode);

    for (const tag of tc.tags) {
      const tagNode: GraphNode = {
        id: `tag-${tag}`,
        type: 'tag',
        label: tag,
        properties: {},
        relationships: [],
      };
      this.addNode(tagNode);
      this.addEdge(cNode.id, tagNode.id, 'tagged');
    }

    if (tc.severity) {
      const sevNode: GraphNode = {
        id: `severity-${tc.severity}`,
        type: 'severity',
        label: tc.severity,
        properties: {},
        relationships: [],
      };
      this.addNode(sevNode);
      this.addEdge(cNode.id, sevNode.id, 'has-severity');
    }

    for (let i = 0; i < (tc.steps ?? []).length; i++) {
      const step = tc.steps[i];
      const sNode: GraphNode = {
        id: `step-${tc.id}-${i}`,
        type: 'step',
        label: step.action ?? `Step ${i + 1}`,
        properties: { position: i, expectedResult: step.expectedResult },
        relationships: [],
      };
      this.addNode(sNode);
      this.addEdge(cNode.id, sNode.id, 'has-step', 1);
      if (step.expectedResult) {
        const eNode: GraphNode = {
          id: `expected-${tc.id}-${i}`,
          type: 'expected-result',
          label: step.expectedResult,
          properties: {},
          relationships: [],
        };
        this.addNode(eNode);
        this.addEdge(sNode.id, eNode.id, 'expects');
      }
    }
  }

  getRecommendations(projectCode: string): Recommendation[] {
    const projectNodes = this.projectIndex.get(projectCode);
    if (!projectNodes) return [];

    const recs: Recommendation[] = [];
    const cases = Array.from(this.nodes.values()).filter((n) =>
      projectNodes.has(n.id) && n.type === 'test-case',
    );

    if (cases.length === 0) {
      recs.push({ type: 'seed', description: 'No test cases found — start by seeding Qase with initial cases', priority: 'high' });
      return recs;
    }

    const tags = new Set<string>();
    const severities = new Set<string>();
    for (const tc of cases) {
      for (const rel of tc.relationships) {
        if (rel.startsWith('tag-')) tags.add(rel.slice(4));
        if (rel.startsWith('severity-')) severities.add(rel.slice(9));
      }
    }

    if (tags.size < 2) recs.push({ type: 'tagging', description: 'Add more tags to improve traceability', priority: 'medium' });
    if (!severities.has('Critical') || !severities.has('High')) {
      recs.push({ type: 'severity', description: 'Define severity levels consistently across test cases', priority: 'medium' });
    }
    if (cases.length > 5) {
      recs.push({ type: 'coverage', description: 'Analyze requirement-to-test mapping for coverage gaps', priority: 'high' });
    }

    return recs;
  }

  findDuplicates(projectCode: string): unknown[] {
    const projectNodes = this.projectIndex.get(projectCode);
    if (!projectNodes) return [];

    const cases = Array.from(this.nodes.values())
      .filter((n) => projectNodes.has(n.id) && n.type === 'test-case');

    const byLabel = new Map<string, string[]>();
    for (const tc of cases) {
      const normalized = tc.label.toLowerCase().replace(/[^a-z0-9]/g, ' ');
      const existing = byLabel.get(normalized) ?? [];
      existing.push(tc.id);
      byLabel.set(normalized, existing);
    }

    const duplicates: Array<{ label: string; ids: string[]; similarity: number }> = [];
    for (const [label, ids] of byLabel) {
      if (ids.length > 1) {
        duplicates.push({ label, ids, similarity: 1.0 });
      }
    }
    return duplicates.sort((a, b) => b.ids.length - a.ids.length);
  }

  analyzeProjectCoverage(projectCode: string): unknown {
    const projectNodes = this.projectIndex.get(projectCode);
    if (!projectNodes) return { totalCases: 0, suites: 0, tags: 0, severities: [], coverageScore: 0 };

    const cases = Array.from(this.nodes.values()).filter((n) =>
      projectNodes.has(n.id) && n.type === 'test-case',
    );
    const suites = Array.from(this.nodes.values()).filter((n) =>
      projectNodes.has(n.id) && (n.type === 'suite' || n.type === 'section'),
    );
    const tags = Array.from(this.nodes.values()).filter((n) => n.type === 'tag');
    const severities = Array.from(this.nodes.values()).filter((n) => n.type === 'severity');

    const hasSteps = cases.filter((c) => c.properties.steps ?? false).length;
    const stepCoverage = cases.length > 0 ? hasSteps / cases.length : 0;
    const tagCoverage = cases.length > 0 ? tags.length / Math.max(cases.length, 1) : 0;
    const coverageScore = Math.round(((stepCoverage * 0.5 + Math.min(tagCoverage, 0.3) * 0.3 + 0.2) * 100));

    return {
      totalCases: cases.length,
      suites: suites.length,
      tags: tags.length,
      severities: severities.map((s) => s.label),
      coverageScore,
    };
  }

  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): GraphEdge[] {
    return this.edges;
  }

  getSize(): { nodes: number; edges: number } {
    return { nodes: this.nodes.size, edges: this.edges.length };
  }
}
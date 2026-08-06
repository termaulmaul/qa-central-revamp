import type { ParsedRequirement, RequirementGraph, TraceabilityLink } from './types';

export class TraceabilityManager {
  addLink(requirement: ParsedRequirement, link: TraceabilityLink): ParsedRequirement {
    return {
      ...requirement,
      traceability: [...requirement.traceability.filter((l) => l.target_id !== link.target_id), link],
    };
  }

  linksByType(requirements: ParsedRequirement[], type: TraceabilityLink['type']): TraceabilityLink[] {
    return requirements.flatMap((r) => r.traceability.filter((l) => l.type === type));
  }

  buildTraceabilityMatrix(requirements: ParsedRequirement[]): { matrix: Record<string, Record<string, string[]>>; summary: Record<string, number> } {
    const matrix: Record<string, Record<string, string[]>> = {};
    const summary: Record<string, number> = {};

    for (const req of requirements) {
      matrix[req.id] = {};
      for (const link of req.traceability) {
        if (!matrix[req.id][link.type]) matrix[req.id][link.type] = [];
        matrix[req.id][link.type].push(link.target_id);
        summary[link.type] = (summary[link.type] ?? 0) + 1;
      }
    }

    return { matrix, summary };
  }

  coverageByLinkType(requirements: ParsedRequirement[]): Record<string, { total: number; linked: number; coverage: number }> {
    const types: TraceabilityLink['type'][] = ['test_case', 'automation', 'execution', 'defect', 'fix'];
    const result: Record<string, { total: number; linked: number; coverage: number }> = {};

    for (const t of types) {
      const linked = requirements.filter((r) => r.traceability.some((l) => l.type === t)).length;
      result[t] = {
        total: requirements.length,
        linked,
        coverage: requirements.length ? Math.round((linked / requirements.length) * 100) : 0,
      };
    }

    return result;
  }

  getTraceabilityChain(reqId: string, graph: RequirementGraph): RequirementGraph {
    const ids = new Set<string>([reqId]);
    const edges = graph.edges.filter((e) => e.source === reqId || e.target === reqId);
    for (const e of edges) {
      ids.add(e.source);
      ids.add(e.target);
    }
    return {
      nodes: graph.nodes.filter((n) => ids.has(n.id)),
      edges,
    };
  }
}

export const traceabilityManager = new TraceabilityManager();
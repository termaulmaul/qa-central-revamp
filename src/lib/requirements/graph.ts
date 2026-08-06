import type { ParsedRequirement, RequirementGraph, RequirementGraphNode, RequirementGraphEdge } from './types';

export class RequirementGraphBuilder {
  build(requirements: ParsedRequirement[]): RequirementGraph {
    const nodes: RequirementGraphNode[] = [];
    const edges: RequirementGraphEdge[] = [];

    for (const req of requirements) {
      nodes.push({
        id: req.id,
        type: 'requirement',
        label: req.title,
        data: { source: req.source, platform: req.platform, status: req.status },
        risk: req.risk,
        coverage: req.coverage,
      });

      for (const ac of req.acceptance_criteria) {
        nodes.push({
          id: ac.id,
          type: 'acceptance_criterion',
          label: ac.text.slice(0, 80),
          data: { type: ac.type, priority: ac.priority, testable: ac.testable },
        });
        edges.push({
          id: `e-${req.id}-${ac.id}`,
          source: req.id,
          target: ac.id,
          relationship: 'covers',
        });
      }

      for (const br of req.business_rules) {
        nodes.push({
          id: br.id,
          type: 'business_rule',
          label: br.text.slice(0, 80),
          data: { category: br.category, priority: br.priority, testable: br.testable },
        });
        edges.push({
          id: `e-${req.id}-${br.id}`,
          source: req.id,
          target: br.id,
          relationship: 'constrains',
        });
      }
    }

    return { nodes, edges };
  }

  toMatrix(requirements: ParsedRequirement[]): string[][] {
    const headers = ['Requirement', 'Source', 'Risk', 'Platform', 'Coverage', 'Status', 'AC Count', 'BR Count', 'Automation', 'Priority'];
    const rows = requirements.map((r) => [
      r.title,
      r.source,
      r.risk,
      r.platform,
      `${r.coverage}%`,
      r.status,
      String(r.acceptance_criteria.length),
      String(r.business_rules.length),
      r.automation_candidate ? 'Yes' : 'No',
      r.metadata.feature || '-',
    ]);
    return [headers, ...rows];
  }

  findIslands(graph: RequirementGraph): RequirementGraphNode[][] {
    const visited = new Set<string>();
    const islands: RequirementGraphNode[][] = [];
    const adjacency = new Map<string, string[]>();
    for (const n of graph.nodes) adjacency.set(n.id, []);
    for (const e of graph.edges) {
      adjacency.get(e.source)?.push(e.target);
      adjacency.get(e.target)?.push(e.source);
    }
    for (const node of graph.nodes) {
      if (visited.has(node.id)) continue;
      const island: RequirementGraphNode[] = [];
      const stack = [node.id];
      while (stack.length) {
        const id = stack.pop()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const n = graph.nodes.find((n) => n.id === id);
        if (n) island.push(n);
        for (const neighbor of adjacency.get(id) ?? []) {
          if (!visited.has(neighbor)) stack.push(neighbor);
        }
      }
      if (island.length) islands.push(island);
    }
    return islands;
  }
}

export const graphBuilder = new RequirementGraphBuilder();
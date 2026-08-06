import type { RequirementSource, ParsedRequirement, ExtractionResult } from './types';
import { RequirementParser } from './parser';

// ponytail: local regex-based extraction, replace with LLM-based extractor when quality demands
// ponytail: per-source parsers (Jira JSON, Confluence HTML, OpenAPI YAML) should live here, add when a source type is actively used

export class RequirementExtractor {
  private parser = new RequirementParser();

  extract(text: string, source: RequirementSource, owner = 'AI Extractor'): ExtractionResult {
    const warnings: string[] = [];
    const segments = this.segment(text, source);
    const requirements: ParsedRequirement[] = [];
    const seen = new Set<string>();

    for (const seg of segments) {
      if (seen.has(seg.feature)) {
        warnings.push(`Duplicate feature "${seg.feature}" skipped`);
        continue;
      }
      seen.add(seg.feature);
      try {
        const req = this.parser.parse(
          {
            feature: seg.feature,
            description: seg.description,
            acceptance_criteria: seg.acceptance_criteria,
            business_rules: seg.business_rules,
            source,
            owner,
          },
          source,
          owner,
        );
        requirements.push(req);
      } catch (e: unknown) {
        warnings.push(`Failed to parse "${seg.feature}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return {
      requirements,
      confidence: this.calcConfidence(requirements, warnings),
      warnings,
      source_format: source,
    };
  }

  private segment(text: string, source: RequirementSource): ExtractedSegment[] {
    if (source === 'Swagger/OpenAPI' || source === 'Postman Collection') {
      return this.extractApiSegments(text);
    }
    return this.extractTextSegments(text);
  }

  private extractTextSegments(text: string): ExtractedSegment[] {
    const segments: ExtractedSegment[] = [];
    const sections = text.split(/\n#{1,3}\s+/).filter(Boolean);

    for (const raw of sections) {
      const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
      if (!lines.length) continue;

      const feature = lines[0].replace(/^#{1,3}\s*/, '').trim();
      if (feature.length < 3) continue;

      const ac: string[] = [];
      const br: string[] = [];
      const descParts: string[] = [];

      let section: 'desc' | 'ac' | 'br' = 'desc';
      for (const line of lines.slice(1)) {
        const lower = line.toLowerCase();
        if (/^(acceptance criter|ac|scenarios|test conditions|what happens)/i.test(line)) {
          section = 'ac';
          const after = line.replace(/^.*?:?\s*/, '').trim();
          if (after && after !== line) ac.push(after);
          continue;
        }
        if (/^(business rule|br|rule|constraint|logic|if|when |given\b|then\b)/i.test(line) && lower !== line.replace(/^[-*]\s*/, '').toLowerCase()) {
          section = 'br';
          const after = line.replace(/^.*?:?\s*/, '').trim();
          if (after && after !== line) br.push(after);
          continue;
        }
        if (/^(description|desc|overview|background|context)/i.test(line)) {
          section = 'desc';
          continue;
        }

        const clean = line.replace(/^[-*]\s+/, '');
        switch (section) {
          case 'ac':
            ac.push(clean);
            break;
          case 'br':
            br.push(clean);
            break;
          default:
            descParts.push(clean);
        }
      }

      segments.push({
        feature,
        description: descParts.join(' ') || feature,
        acceptance_criteria: ac,
        business_rules: br,
      });
    }

    return segments;
  }

  private extractApiSegments(text: string): ExtractedSegment[] {
    const segments: ExtractedSegment[] = [];
    // ponytail: basic OpenAPI path extraction, add full YAML parser when swagger source goes live
    const pathBlocks = text.split(/\n\s*(?:get|post|put|patch|delete|options)\s+\//g).filter(Boolean);

    for (const block of pathBlocks) {
      const lines = block.split('\n').filter(Boolean);
      const pathLine = lines[0]?.trim();
      if (!pathLine) continue;

      const ac: string[] = [];
      const br: string[] = [];
      const descParts: string[] = [];

      for (const line of lines.slice(1)) {
        const lower = line.toLowerCase();
        if (lower.includes('parameter') || lower.includes('request body') || lower.includes('schema')) {
          br.push(line.replace(/^[-*]\s*/, ''));
        } else if (lower.includes('response') && (lower.includes('200') || lower.includes('201') || lower.includes('success'))) {
          ac.push(line.replace(/^[-*]\s*/, ''));
        } else {
          descParts.push(line.replace(/^[-*]\s*/, ''));
        }
      }

      const method = block.match(/(get|post|put|patch|delete|options)\s+\//i)?.[1] || 'API';
      segments.push({
        feature: `${method.toUpperCase()} ${pathLine}`,
        description: descParts.join(' ') || `${method} ${pathLine}`,
        acceptance_criteria: ac.length ? ac : [`${method} ${pathLine} returns expected response`],
        business_rules: br,
      });
    }

    return segments;
  }

  private calcConfidence(requirements: ParsedRequirement[], warnings: string[]): number {
    if (!requirements.length) return 0;
    const baseScore = 0.8;
    const warnPenalty = Math.min(warnings.length * 0.05, 0.3);
    // ponytail: heuristic, replace with LLM confidence when AI extractor is integrated
    const avgAc = requirements.reduce((s, r) => s + r.acceptance_criteria.length, 0) / requirements.length;
    const qualityBonus = avgAc >= 1 ? 0.1 : 0;
    return Math.min(baseScore - warnPenalty + qualityBonus, 1);
  }
}

interface ExtractedSegment {
  feature: string;
  description: string;
  acceptance_criteria: string[];
  business_rules: string[];
}

export const requirementExtractor = new RequirementExtractor();

export interface AttachmentInfo {
  id: number;
  name: string;
  size: number;
  mimeType: string;
  extension: string;
  caseId?: number;
}

export class QaseAttachmentsHandler {
  extractCaseAttachments(
    cases: Array<{ id?: number; attachments?: Array<Record<string, unknown>> }>,
  ): AttachmentInfo[] {
    const all: AttachmentInfo[] = [];
    for (const tc of cases) {
      const attaches = tc.attachments ?? [];
      for (const a of attaches) {
        const name = String(a?.name ?? a?.filename ?? '');
        all.push({
          id: Number(a?.id ?? 0),
          name,
          size: Number(a?.size ?? 0),
          mimeType: String(a?.mime_type ?? a?.mime ?? 'application/octet-stream'),
          extension: this.extension(name),
          caseId: tc.id,
        });
      }
    }
    return all;
  }

  private extension(filename: string): string {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
  }

  categorizeByType(attachments: AttachmentInfo[]): Record<string, AttachmentInfo[]> {
    const categories: Record<string, AttachmentInfo[]> = {
      images: [],
      documents: [],
      logs: [],
      data: [],
      other: [],
    };
    for (const a of attachments) {
      const ext = a.extension;
      if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'].includes(ext)) {
        categories.images.push(a);
      } else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.md'].includes(ext)) {
        categories.documents.push(a);
      } else if (['.log', '.txt'].includes(ext)) {
        categories.logs.push(a);
      } else if (['.json', '.xml', '.csv', '.yaml', '.yml'].includes(ext)) {
        categories.data.push(a);
      } else {
        categories.other.push(a);
      }
    }
    return categories;
  }
}
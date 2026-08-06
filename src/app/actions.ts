'use server';

import { processPdf } from '@firecrawl/pdf-inspector';

export async function parsePdfAction(formData: FormData): Promise<string> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error("No file provided");
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Process with pdf-inspector
    const result = processPdf(buffer);
    
    if (result.markdown) {
      return result.markdown;
    } else {
      throw new Error("Failed to extract markdown from PDF");
    }
  } catch (error: any) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

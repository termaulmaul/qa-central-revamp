import { parsePdfAction } from '../app/actions';

/**
 * Advanced PDF Parser with layout analysis
 * Powered by @firecrawl/pdf-inspector for clean Markdown extraction
 */
export const PDFParser = {
  extractText: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const markdownText = await parsePdfAction(formData);
      return markdownText;
    } catch (e: any) {
      throw new Error(`PDF parsing failed: ${e.message}`);
    }
  },
};

/**
 * PDF Text Extraction Service
 * Extracts readable plain text from uploaded PDF buffers using pdf-parse.
 * Handles validation, empty/scanned PDFs, and size limits.
 */

import pdfParse from 'pdf-parse';
import { ValidationError } from '../utils/validateInput';
import { config } from '../config/env';

export interface ExtractedPdfResult {
  text: string;
  pageCount: number;
  charCount: number;
}

export const pdfService = {
  /**
   * Validates and extracts text from an uploaded PDF buffer.
   *
   * @param buffer Raw binary buffer of the uploaded PDF
   * @param originalName Optional filename for reporting
   * @returns Cleaned extracted text and metadata
   */
  async extractText(buffer: Buffer, originalName = 'document.pdf'): Promise<ExtractedPdfResult> {
    if (!buffer || buffer.length === 0) {
      throw new ValidationError('Uploaded PDF buffer is empty.');
    }

    if (buffer.length > config.maxUploadBytes) {
      throw new ValidationError(
        `PDF file is too large (${(buffer.length / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`
      );
    }

    try {
      const data = await pdfParse(buffer);
      const rawText = data.text || '';
      const cleanedText = rawText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Detect empty or image-only scanned PDFs
      if (cleanedText.length < 20) {
        throw new ValidationError(
          `Unable to extract readable text from "${originalName}". The file appears to be empty, password-protected, or a scanned image without selectable text. Please paste the text manually into StudyPilot AI.`
        );
      }

      // Safeguard: Limit extracted text length to avoid token overflows
      const truncatedText =
        cleanedText.length > config.maxTextChars
          ? cleanedText.substring(0, config.maxTextChars)
          : cleanedText;

      return {
        text: truncatedText,
        pageCount: data.numpages || 1,
        charCount: truncatedText.length,
      };
    } catch (err: unknown) {
      if (err instanceof ValidationError) throw err;
      const errorMsg = err instanceof Error ? err.message : 'Unknown extraction failure';
      throw new ValidationError(
        `Failed to parse PDF "${originalName}": ${errorMsg}. Please ensure the PDF is valid and not corrupted.`
      );
    }
  },
};

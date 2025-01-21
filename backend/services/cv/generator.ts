import { CV, CVGenerationPrompt } from "../../types/cv.ts";
import { CVProvider } from "../../types/provider.ts";
import { CVFormatter } from "./formatter.ts";
import { CVGenerationError } from "../../types/errors.ts";

/**
 * Core CV Generation Service
 * 
 * Coordinates the CV generation process by:
 * 1. Getting raw CV data from a provider (AI, JSON, etc.)
 * 2. Formatting the data into a consistent structure
 * 3. Applying any final processing/validation
 */
export class CVGenerator {
  constructor(
    private provider: CVProvider,
    private formatter: CVFormatter
  ) {}

  async generateCV(data: CVGenerationPrompt): Promise<CV> {
    try {
      const cv = await this.provider.getCV(data);
      return this.formatter.format(cv);
    } catch (error) {
      throw new CVGenerationError('generate', String(error));
    }
  }

  async cleanup(): Promise<void> {
    await this.provider.cleanup();
  }
} 
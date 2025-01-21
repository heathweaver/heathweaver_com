import { CV } from "../../types/cv.ts";

/**
 * Service for loading CVs from JSON files
 */
export class CVLoader {
  constructor(private jsonPath: string) {}

  async loadCV(): Promise<CV> {
    try {
      const jsonContent = await Deno.readTextFile(this.jsonPath);
      return JSON.parse(jsonContent);
    } catch (error) {
      throw new Error(`Failed to load CV from JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 
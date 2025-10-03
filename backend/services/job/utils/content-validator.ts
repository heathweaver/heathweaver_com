import { ContentValidator, ParserConfig } from "../types.ts";

export class JobContentValidator implements ContentValidator {
  constructor(private config: ParserConfig) {}

  validate(
    content: string,
  ): { isValid: boolean; reason?: string; score?: number } {
    if (!content || content.length < this.config.minContentLength) {
      return {
        isValid: false,
        reason: `Content length (${
          content?.length || 0
        }) below minimum (${this.config.minContentLength})`,
        score: 0,
      };
    }

    const contentLower = content.toLowerCase();
    const foundTerms = this.config.jobTerms.filter((term) =>
      contentLower.includes(term)
    );

    const score = foundTerms.length / this.config.jobTerms.length;

    if (foundTerms.length < this.config.minJobTerms) {
      return {
        isValid: false,
        reason:
          `Found only ${foundTerms.length} job terms (minimum ${this.config.minJobTerms})`,
        score,
      };
    }

    return {
      isValid: true,
      score,
    };
  }
}

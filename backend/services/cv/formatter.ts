import { CV } from "../../types/cv.ts";
import { DBEducation, DBAward } from "../database.ts";
import { FormatError } from "../../types/errors.ts";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { 
  year: 'numeric',
  month: 'short'
};

/**
 * CV Formatting Service
 * 
 * Handles all formatting of CV data into consistent structures:
 * - Date formatting
 * - Text formatting
 * - Structure validation
 */
export class CVFormatter {
  /**
   * Formats and validates a CV structure
   */
  format(cv: CV): CV {
    try {
      return {
        ...cv,
        headline: cv.headline.toUpperCase(),
        employmentHistory: cv.employmentHistory.map(job => ({
          ...job,
          date: this.formatDate(job.date),
          bulletPoints: job.bulletPoints.map(b => ({
            content: b.content.trim()
          }))
        }))
      };
    } catch (error) {
      throw new FormatError(String(error));
    }
  }

  /**
   * Formats education entries into a standardized string format
   */
  formatEducation(education: DBEducation[]): string {
    return education.map(e => 
      `${e.degree} in ${e.field}\n${e.institution}, ${this.formatSingleDate(e.end_date)}`
    ).join("\n");
  }

  /**
   * Formats awards into a consistent string format
   */
  formatAwards(awards: DBAward[]): string[] {
    return awards.map(a => 
      `${a.title}${a.issuer ? ` - ${a.issuer}` : ''}`
    );
  }

  /**
   * Formats dates into consistent format
   */
  private formatDate(dateStr: string): string {
    const [start, end] = dateStr.split(" - ");
    return `${this.formatSingleDate(new Date(start))} - ${end === "PRESENT" ? end : this.formatSingleDate(new Date(end))}`;
  }

  private formatSingleDate(date: Date | null): string {
    if (!date) return "PRESENT";
    try {
      return date.toLocaleDateString('en-US', DATE_FORMAT).toUpperCase();
    } catch {
      throw new FormatError(`Invalid date format: ${date}`);
    }
  }
} 
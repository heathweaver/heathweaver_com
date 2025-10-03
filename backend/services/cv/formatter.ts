import { CV } from "../../types/cv.ts";
import { DBAward, DBEducation } from "../../types/db.ts";
import { FormatError } from "../../types/errors.ts";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
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
        employmentHistory: cv.employmentHistory.map((job) => ({
          ...job,
          start_date: this.formatSingleDate(new Date(job.start_date)),
          end_date: job.end_date
            ? this.formatSingleDate(new Date(job.end_date))
            : "PRESENT",
          bulletPoints: job.bulletPoints.map((b) => ({
            content: b.content.trim(),
          })),
        })),
      };
    } catch (error) {
      throw new FormatError(String(error));
    }
  }

  /**
   * Formats education entries into a standardized string format
   */
  formatEducation(education: DBEducation[]): string {
    return education.map((e) =>
      `${e.degree} in ${e.field}\n${e.institution}, ${
        this.formatSingleDate(e.end_date)
      }`
    ).join("\n");
  }

  /**
   * Formats awards into a consistent string format
   */
  formatAwards(awards: DBAward[]): string[] {
    return awards.map((a) => `${a.title}${a.issuer ? ` - ${a.issuer}` : ""}`);
  }

  /**
   * Formats a single date into consistent format
   */
  private formatSingleDate(date: Date | null): string {
    if (!date) return "PRESENT";
    try {
      return date.toLocaleDateString("en-US", DATE_FORMAT).toUpperCase();
    } catch {
      throw new FormatError(`Invalid date format: ${date}`);
    }
  }
}

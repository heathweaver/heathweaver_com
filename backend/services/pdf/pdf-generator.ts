import { PageSizes, PDFDocument, PDFFont, PDFPage, RGB, rgb } from "pdf-lib";
import fontkit from "npm:@pdf-lib/fontkit";
import { CV } from "../../types/cv.ts";

export class PDFGenerator {
  private currentPage!: PDFPage;
  private doc!: PDFDocument;
  private font!: PDFFont;
  private boldFont!: PDFFont;
  private italicFont!: PDFFont;
  private blackFont!: PDFFont;
  private narrowFont!: PDFFont; // Arial Narrow for headline
  private width!: number;
  private height!: number;
  private margin = 45; // Reduced from 54 to tighten margins
  private topMargin = 72; // Reduced from 82 to tighten margins
  private y!: number;
  private lineHeight = 14; // Consistent with Python's spacing
  private currentPageNumber = 1; // Add page counter

  // Format dates to Month YYYY
  private formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "Present";
    const date = new Date(dateStr);
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  }

  /**
   * Formats a phone number based on region
   */
  private formatPhoneNumber(
    phone: string | undefined,
    region: "US" | "EU",
  ): string | undefined {
    if (!phone) return undefined;

    // Remove all non-numeric characters
    const numbers = phone.replace(/\D/g, "");

    if (region === "US") {
      // US format: +1 (XXX) XXX-XXXX
      if (numbers.length === 10) {
        return `+1 (${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${
          numbers.slice(6)
        }`;
      } else if (numbers.length === 11 && numbers[0] === "1") {
        return `+1 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${
          numbers.slice(7)
        }`;
      }
    } else {
      // EU format: +XX XXX XXX XXX
      if (numbers.length >= 11) {
        const countryCode = numbers.slice(0, 2);
        const remaining = numbers.slice(2).match(/.{1,3}/g) || [];
        return `+${countryCode} ${remaining.join(" ")}`;
      }
    }

    // If format doesn't match expected patterns, return cleaned original
    return `+${numbers}`;
  }

  async generateCV(cv: CV, region: "US" | "EU" = "EU"): Promise<Uint8Array> {
    // Initialize document with region-specific page size
    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);
    const pageSize = region === "US" ? PageSizes.Letter : PageSizes.A4;
    this.currentPage = this.doc.addPage(pageSize);
    const { width, height } = this.currentPage.getSize();
    this.width = width;
    this.height = height;

    // Load and embed Arial fonts
    const arialFontBytes = await Deno.readFile(
      "backend/assets/fonts/Arial.ttf",
    );
    const arialBoldFontBytes = await Deno.readFile(
      "backend/assets/fonts/Arial Bold.ttf",
    );
    const arialItalicFontBytes = await Deno.readFile(
      "backend/assets/fonts/Arial Italic.ttf",
    );
    const arialBlackFontBytes = await Deno.readFile(
      "backend/assets/fonts/Arial Black.ttf",
    );
    const arialNarrowFontBytes = await Deno.readFile(
      "backend/assets/fonts/Arial Narrow.ttf",
    );

    this.font = await this.doc.embedFont(arialFontBytes);
    this.boldFont = await this.doc.embedFont(arialBoldFontBytes);
    this.italicFont = await this.doc.embedFont(arialItalicFontBytes);
    this.blackFont = await this.doc.embedFont(arialBlackFontBytes);
    this.narrowFont = await this.doc.embedFont(arialNarrowFontBytes);

    this.y = height - this.topMargin;

    // Name (Arial Black)
    this.drawText(cv.basicInfo.name, {
      font: this.blackFont,
      size: 24,
      color: rgb(0, 0, 0),
    });
    this.y -= this.lineHeight * 1.5; // Space after name

    // Contact info under name
    if (cv.basicInfo.phone) {
      try {
        const phoneNumbers = JSON.parse(cv.basicInfo.phone);
        const phoneNumber = region === "US" ? phoneNumbers.US : phoneNumbers.BE;
        if (phoneNumber) {
          const formattedPhone = this.formatPhoneNumber(phoneNumber, region);
          if (formattedPhone) {
            this.drawText(formattedPhone, {
              font: this.font,
              size: 11,
              color: rgb(0, 0, 0),
            });
          }
        }
      } catch (e) {
        console.error("Failed to parse phone numbers:", e);
      }
      this.y -= this.lineHeight;
    }

    // Email below phone
    this.drawText(cv.basicInfo.email, {
      font: this.font,
      size: 11,
      color: rgb(0, 0, 0),
    });
    this.y -= this.lineHeight * 2; // Extra space before Career section

    // Career section
    this.drawText("Career", {
      font: this.boldFont,
      size: 19,
      color: rgb(0, 0, 0),
    });
    this.y -= this.lineHeight * 1.5;

    // Employment history
    for (const job of cv.employmentHistory) {
      // Check space for both title and date before drawing
      const startDate = this.formatDate(job.start_date);
      const endDate = job.end_date === "Present"
        ? "Present"
        : this.formatDate(job.end_date);
      const dateLocation = `${startDate} – ${endDate}${
        job.location ? " | " + job.location : ""
      }`;

      this.checkAndEnsureSpace([
        {
          text: `${job.title} at ${job.company}`,
          font: this.boldFont,
          size: 11,
        }, // Reduced from 12
        { text: dateLocation, font: this.font, size: 9 }, // Reduced from 10
      ], this.lineHeight + 3);

      // Job title (bold)
      this.drawText(`${job.title} at ${job.company}`, {
        font: this.boldFont,
        size: 11, // Reduced from 12
        color: rgb(0, 0, 0),
      });
      this.y -= this.lineHeight;

      // Date and location (normal Arial, uppercase with en dash)
      this.drawText(dateLocation, {
        font: this.font,
        size: 9, // Reduced from 10
        color: rgb(0.4, 0.4, 0.4),
      });
      this.y -= this.lineHeight + 3; // Added 1pt more spacing after date

      // Bullet points
      for (const bullet of job.bulletPoints) {
        this.checkNewPage();
        const lines = this.wrapText(
          bullet.content,
          this.font,
          10,
          this.width - this.margin * 2.5,
        ); // Reduced from 11

        for (const [index, line] of lines.entries()) {
          if (index === 0) {
            // Draw bullet point at margin
            this.drawText("•", {
              font: this.font,
              size: 10, // Reduced from 11
              x: this.margin,
            });
          }

          // Draw line with proper indentation
          this.drawText(line, {
            font: this.font,
            size: 10, // Reduced from 11
            x: this.margin + 12,
          });
          this.y -= this.lineHeight;
        }
        this.y -= 1; // Add 1px after each bullet point
      }
      this.y -= this.lineHeight;
    }

    // Education section if exists
    if (cv.education && cv.education.length > 0) {
      this.checkNewPage();
      this.drawText("Education", {
        font: this.boldFont,
        size: 13, // Reduced from 14
        color: rgb(0, 0, 0),
      });
      this.y -= this.lineHeight;

      for (const edu of cv.education) {
        // Institution and degree
        const educationText =
          `${edu.institution} - ${edu.degree} in ${edu.field}`;
        const educationLines = this.wrapText(
          educationText,
          this.boldFont,
          10,
          this.width - this.margin * 2,
        ); // Reduced from 11
        for (const line of educationLines) {
          this.drawText(line, {
            font: this.boldFont,
            size: 10, // Reduced from 11
            color: rgb(0, 0, 0),
          });
          this.y -= this.lineHeight;
        }

        // Date and location
        const startDate = this.formatDate(edu.start_date);
        const endDate = edu.end_date
          ? this.formatDate(edu.end_date)
          : "Present";
        const dateLocation = `${startDate} – ${endDate} | ${
          edu.location || ""
        }`;
        this.drawText(dateLocation, {
          font: this.font,
          size: 9, // Reduced from 10
          color: rgb(0.4, 0.4, 0.4),
        });
        this.y -= this.lineHeight;

        // Achievements if any
        if (edu.achievements && edu.achievements.length > 0) {
          for (const achievement of edu.achievements) {
            const lines = this.wrapText(
              achievement,
              this.font,
              10,
              this.width - this.margin * 2.5,
            ); // Reduced from 11
            for (const [index, line] of lines.entries()) {
              if (index === 0) {
                this.drawText("•", {
                  font: this.font,
                  size: 10, // Reduced from 11
                  x: this.margin,
                });
              }
              this.drawText(line, {
                font: this.font,
                size: 10, // Reduced from 11
                x: this.margin + 12,
              });
              this.y -= this.lineHeight;
            }
          }
        }
        this.y -= this.lineHeight;
      }
    }

    // Skills section
    if (cv.skills && cv.skills.length > 0) {
      this.checkNewPage();

      // Draw skills section
      this.drawText("Skills", {
        font: this.boldFont,
        size: 14,
        color: rgb(0, 0, 0),
      });
      this.y -= this.lineHeight;

      // Draw each category and its skills
      for (const skill of cv.skills) {
        this.checkNewPage();

        // Draw category in bold with colon
        const categoryText = skill.category + ": ";
        const categoryWidth = this.boldFont.widthOfTextAtSize(categoryText, 9);

        this.drawText(categoryText, {
          font: this.boldFont,
          size: 9,
          color: rgb(0, 0, 0),
        });

        // Draw skills as a flowing paragraph
        const skillText = skill.skills.join(" • ");

        // First line has less width due to the category
        const firstLineWidth = this.width - (this.margin * 2) - categoryWidth;
        const remainingLinesWidth = this.width - (this.margin * 2);

        // Split text into words and build lines
        const words = skillText.split(" ");
        let lines: string[] = [];
        let currentLine = "";
        let isFirstLine = true;

        for (const word of words) {
          const testLine = currentLine.length === 0
            ? word
            : `${currentLine} ${word}`;
          const width = this.font.widthOfTextAtSize(testLine, 9);
          const maxWidth = isFirstLine ? firstLineWidth : remainingLinesWidth;

          if (width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = word;
            isFirstLine = false;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }

        // Draw first line after category
        if (lines.length > 0) {
          this.drawText(lines[0], {
            font: this.font,
            size: 9,
            color: rgb(0, 0, 0),
            x: this.margin + categoryWidth,
          });
          this.y -= this.lineHeight;
        }

        // Draw remaining lines
        for (let i = 1; i < lines.length; i++) {
          this.drawText(lines[i], {
            font: this.font,
            size: 9,
            color: rgb(0, 0, 0),
            x: this.margin,
          });
          this.y -= this.lineHeight;
        }

        this.y -= this.lineHeight / 4; // Small space between skill categories
      }
      this.y -= this.lineHeight / 2;
    }

    // Add note at the end
    this.y -= this.lineHeight;

    // Generate a random 20-character hex code
    const code = Array.from(crypto.getRandomValues(new Uint8Array(10)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const note =
      `This CV/Resume was tailored to this position with an AI agent that I built myself. If you'd like to chat with that agent and get more insight into my profile, please visit heathweaver.com/career and enter the code: ${code}`;

    const noteLines = this.wrapText(
      note,
      this.italicFont,
      9,
      this.width - this.margin * 2,
    );
    for (const line of noteLines) {
      this.checkNewPage();
      this.drawText(line, {
        font: this.italicFont,
        size: 9,
        color: rgb(0.4, 0.4, 0.4), // Gray color like the dates
      });
      this.y -= this.lineHeight * 0.8; // Slightly reduced line spacing for the note
    }

    return this.doc.save();
  }

  private checkNewPage(requiredHeight: number = this.lineHeight) {
    if (
      this.y <
        (this.currentPageNumber === 1 ? this.margin * 2 : this.margin) +
          requiredHeight
    ) {
      const pageSize = this.currentPage.getSize();
      this.currentPage = this.doc.addPage([pageSize.width, pageSize.height]);
      this.currentPageNumber++;
      this.y = this.height - this.topMargin;
    }
  }

  private checkAndEnsureSpace(
    elements: { text: string; font: PDFFont; size: number }[],
    spacing: number = 0,
  ) {
    const totalHeight = elements.reduce((height, element) => {
      return height + this.lineHeight;
    }, spacing);

    this.checkNewPage(totalHeight);
  }

  private drawText(text: string, options: {
    font: PDFFont;
    size: number;
    color?: RGB;
    x?: number;
    y?: number;
  }) {
    const cleanText = text.replace(/\n/g, " ").trim();
    this.currentPage.drawText(cleanText, {
      x: options.x ?? this.margin,
      y: options.y ?? this.y,
      font: options.font,
      size: options.size,
      color: options.color ?? rgb(0, 0, 0),
    });
  }

  private wrapText(
    text: string,
    font: PDFFont,
    fontSize: number,
    maxWidth: number,
  ): string[] {
    const cleanText = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    const words = cleanText.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine.length === 0
        ? word
        : `${currentLine} ${word}`;
      const width = font.widthOfTextAtSize(testLine, fontSize);

      if (width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }

  private calculateContentHeight(
    elements: { text: string; font: PDFFont; size: number }[],
  ): number {
    return elements.reduce((height, element) => {
      const lines = this.wrapText(
        element.text,
        element.font,
        element.size,
        this.width - this.margin * 2,
      );
      return height + (lines.length * this.lineHeight);
    }, 0);
  }
}

import { PDFDocument, rgb, PDFPage, PDFFont, RGB } from "pdf-lib";
import fontkit from "npm:@pdf-lib/fontkit";
import { CV } from "../../types/cv.ts";

export class PDFGenerator {
  private currentPage!: PDFPage;
  private doc!: PDFDocument;
  private font!: PDFFont;
  private boldFont!: PDFFont;
  private italicFont!: PDFFont;
  private blackFont!: PDFFont;
  private narrowFont!: PDFFont;  // Arial Narrow for headline
  private width!: number;
  private height!: number;
  private margin = 54;  // Reduced left margin
  private topMargin = 82;  // Added 10pt to top margin
  private y!: number;
  private lineHeight = 14;  // Consistent with Python's spacing

  async generateCV(cv: CV): Promise<Uint8Array> {
    // Initialize document
    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);
    this.currentPage = this.doc.addPage();
    const { width, height } = this.currentPage.getSize();
    this.width = width;
    this.height = height;

    // Load and embed Arial fonts
    const arialFontBytes = await Deno.readFile("backend/assets/fonts/Arial.ttf");
    const arialBoldFontBytes = await Deno.readFile("backend/assets/fonts/Arial Bold.ttf");
    const arialItalicFontBytes = await Deno.readFile("backend/assets/fonts/Arial Italic.ttf");
    const arialBlackFontBytes = await Deno.readFile("backend/assets/fonts/Arial Black.ttf");
    const arialNarrowFontBytes = await Deno.readFile("backend/assets/fonts/Arial Narrow.ttf");

    this.font = await this.doc.embedFont(arialFontBytes);
    this.boldFont = await this.doc.embedFont(arialBoldFontBytes);
    this.italicFont = await this.doc.embedFont(arialItalicFontBytes);
    this.blackFont = await this.doc.embedFont(arialBlackFontBytes);
    this.narrowFont = await this.doc.embedFont(arialNarrowFontBytes);
    
    this.y = height - this.topMargin;

    // Name (Arial Black) and email on same line
    this.drawText(cv.basicInfo.name, {
      font: this.blackFont,
      size: 24,
      color: rgb(0, 0, 0)
    });

    // Calculate position for email to be on same line
    const nameWidth = this.blackFont.widthOfTextAtSize(cv.basicInfo.name, 24);
    this.drawText(cv.basicInfo.email, {
      font: this.font,
      size: 11,
      color: rgb(0, 0, 0),
      x: this.margin + nameWidth + 12  // Add some spacing between name and email
    });
    this.y -= this.lineHeight + 3;  // Reduced spacing after name/email

    // Profile text (italic)
    const profileLines = this.wrapText(cv.profile, this.italicFont, 11, this.width - this.margin * 2);
    for (const line of profileLines) {
      this.drawText(line, {
        font: this.italicFont,
        size: 11,
        color: rgb(0, 0, 0)
      });
      this.y -= this.lineHeight;
    }
    this.y -= this.lineHeight * 2;  // Increased spacing before Career section

    // Career section
    this.drawText("Career", {
      font: this.boldFont,
      size: 20,
      color: rgb(0, 0, 0)
    });
    this.y -= this.lineHeight * 1.5;

    // Employment history
    for (const job of cv.employmentHistory) {
      this.checkNewPage();

      // Job title (bold)
      this.drawText(`${job.title} at ${job.company}`, {
        font: this.boldFont,
        size: 12,
        color: rgb(0, 0, 0)
      });
      this.y -= this.lineHeight;

      // Date and location (normal Arial, uppercase with en dash)
      const dateStr = `${job.start_date}${job.end_date ? ` – ${job.end_date}` : ' – Present'}`;
      const dateLocation = `${dateStr.toUpperCase()} | ${job.location || ''}`;
      this.drawText(dateLocation, {
        font: this.font,
        size: 10,
        color: rgb(0.4, 0.4, 0.4)
      });
      this.y -= this.lineHeight + 3;  // Added 1pt more spacing after date

      // Bullet points
      for (const bullet of job.bulletPoints) {
        this.checkNewPage();
        const lines = this.wrapText(bullet.content, this.font, 11, this.width - this.margin * 2.5);
        
        for (const [index, line] of lines.entries()) {
          if (index === 0) {
            // Draw bullet point at margin
            this.drawText("•", {
              font: this.font,
              size: 11,
              x: this.margin
            });
          }
          
          // Draw line with proper indentation
          this.drawText(line, {
            font: this.font,
            size: 11,
            x: this.margin + 12
          });
          this.y -= this.lineHeight;
        }
      }
      this.y -= this.lineHeight;
    }

    // Education section if exists
    if (cv.education && cv.education.length > 0) {
      this.checkNewPage();
      this.drawText("Education", {
        font: this.boldFont,
        size: 14,
        color: rgb(0, 0, 0)
      });
      this.y -= this.lineHeight;

      for (const edu of cv.education) {
        // Institution and degree
        const educationText = `${edu.institution} - ${edu.degree} in ${edu.field}`;
        const educationLines = this.wrapText(educationText, this.boldFont, 11, this.width - this.margin * 2);
        for (const line of educationLines) {
          this.drawText(line, {
            font: this.boldFont,
            size: 11,
            color: rgb(0, 0, 0)
          });
          this.y -= this.lineHeight;
        }

        // Date and location
        const dateStr = `${edu.start_date}${edu.end_date ? ` – ${edu.end_date}` : ' – Present'}`;
        const dateLocation = `${dateStr.toUpperCase()} | ${edu.location || ''}`;
        this.drawText(dateLocation, {
          font: this.font,
          size: 10,
          color: rgb(0.4, 0.4, 0.4)
        });
        this.y -= this.lineHeight;

        // Achievements if any
        if (edu.achievements && edu.achievements.length > 0) {
          for (const achievement of edu.achievements) {
            const lines = this.wrapText(achievement, this.font, 11, this.width - this.margin * 2.5);
            for (const [index, line] of lines.entries()) {
              if (index === 0) {
                this.drawText("•", {
                  font: this.font,
                  size: 11,
                  x: this.margin
                });
              }
              this.drawText(line, {
                font: this.font,
                size: 11,
                x: this.margin + 12
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
      this.drawText("Skills", {
        font: this.boldFont,
        size: 14,
        color: rgb(0, 0, 0)
      });
      this.y -= this.lineHeight;

      // Group skills by category
      const skillsByCategory = cv.skills.reduce((acc, skill) => {
        if (!acc[skill.category]) {
          acc[skill.category] = [];
        }
        acc[skill.category].push(...skill.skills);
        return acc;
      }, {} as Record<string, string[]>);

      // Draw each category and its skills
      for (const [category, skills] of Object.entries(skillsByCategory)) {
        this.checkNewPage();
        
        // Draw category in bold
        this.drawText(category + ":", {
          font: this.boldFont,
          size: 11,
          color: rgb(0, 0, 0)
        });
        this.y -= this.lineHeight;

        // Draw skills as a wrapped paragraph
        const skillText = skills.join(" • ");
        const skillLines = this.wrapText(skillText, this.font, 11, this.width - this.margin * 2);
        for (const line of skillLines) {
          this.drawText(line, {
            font: this.font,
            size: 11,
            color: rgb(0, 0, 0)
          });
          this.y -= this.lineHeight;
        }
        this.y -= this.lineHeight / 2;  // Add a bit of space between categories
      }
      this.y -= this.lineHeight;
    }

    // Add note at the end
    this.y -= this.lineHeight * 1.5;  // Add some space before the note
    
    // Generate a random 20-character hex code
    const code = Array.from(crypto.getRandomValues(new Uint8Array(10)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const note = `This CV/Resume was tailored to this position with an AI agent that I built myself. If you'd like to chat with that agent and get more insight into my profile, please visit heathweaver.com/career and enter the code: ${code}`;
    
    const noteLines = this.wrapText(note, this.italicFont, 9, this.width - this.margin * 2);
    for (const line of noteLines) {
      this.checkNewPage();
      this.drawText(line, {
        font: this.italicFont,
        size: 9,
        color: rgb(0.4, 0.4, 0.4)  // Gray color like the dates
      });
      this.y -= this.lineHeight * 0.8;  // Slightly reduced line spacing for the note
    }

    return this.doc.save();
  }

  private checkNewPage() {
    if (this.y < this.margin * 2) {
      this.currentPage = this.doc.addPage();
      this.y = this.height - this.margin;
    }
  }

  private drawText(text: string, options: {
    font: PDFFont;
    size: number;
    color?: RGB;
    x?: number;
  }) {
    const cleanText = text.replace(/\n/g, ' ').trim();
    this.currentPage.drawText(cleanText, {
      x: options.x ?? this.margin,
      y: this.y,
      font: options.font,
      size: options.size,
      color: options.color ?? rgb(0, 0, 0)
    });
  }

  private wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const words = cleanText.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;
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
} 
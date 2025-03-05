import { DOMParser, Document, Element } from "@b-fuze/deno-dom/wasm";
import { ParserConfig } from "../types.ts";

export class HtmlCleaner {
  constructor(private config: ParserConfig) {}

  clean(html: string): string {
    // Create a temporary document to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    if (!doc) return html;

    // Replace common elements with appropriate text
    const elementReplacements: Record<string, string> = {
      'p': '\n\n',
      'br': '\n',
      'div': '\n',
      'h1': '\n\n',
      'h2': '\n\n',
      'h3': '\n\n',
      'h4': '\n\n',
      'h5': '\n\n',
      'h6': '\n\n',
      'li': '\n• ',
      'tr': '\n',
      'th': '\t',
      'td': '\t',
    };

    // Replace elements with their text equivalents
    Object.entries(elementReplacements).forEach(([tag, replacement]) => {
      doc.querySelectorAll(tag).forEach(el => {
        try {
          const text = el.textContent || '';
          el.textContent = `${replacement}${text}`;
        } catch (err) {
          console.debug(`Failed to process ${tag} element:`, err);
        }
      });
    });

    // Get the text content
    let text = doc.body?.textContent || html;

    // Apply cleanup patterns
    return this.config.cleanupPatterns.reduce(
      (content, { pattern, replacement }) => content.replace(pattern, replacement),
      text
    ).trim();
  }

  removeElements(doc: Document, selectors: string[]): void {
    selectors.forEach(selector => {
      doc.querySelectorAll(selector).forEach((el: Element) => {
        try {
          el.remove();
        } catch (err) {
          console.debug(`Failed to remove element ${selector}:`, err);
        }
      });
    });
  }
} 
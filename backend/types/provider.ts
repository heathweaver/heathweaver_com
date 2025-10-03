import { CV } from "./cv.ts";
import { CVGenerationPrompt } from "./cv.ts";

export interface CVProvider {
  getCV(data?: CVGenerationPrompt): Promise<CV>;
  cleanup(): Promise<void>;
}

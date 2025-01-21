export class CVGenerationError extends Error {
  constructor(operation: string, cause?: string) {
    super(`${operation}: ${cause || 'Unknown error'}`);
    this.name = 'CVGenerationError';
  }
}

export class EmptyResponseError extends CVGenerationError {
  constructor(operation: string) {
    super(operation, 'Empty response from AI service');
    this.name = 'EmptyResponseError';
  }
}

export class JSONParsingError extends CVGenerationError {
  constructor(operation: string, rawResponse: string, parseError: string) {
    super(operation, `Failed to parse JSON: ${parseError}`);
    this.name = 'JSONParsingError';
    this.rawResponse = rawResponse;
  }

  rawResponse: string;
}

export class FormatError extends CVGenerationError {
  constructor(message: string) {
    super('Format', message);
    this.name = 'FormatError';
  }
} 
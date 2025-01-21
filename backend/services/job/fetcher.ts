import { FetchResult } from "../../types/job.ts";

/**
 * Fetches job posting HTML from a URL with appropriate headers
 */
export async function fetchJobPosting(url: string): Promise<FetchResult> {
  try {
    new URL(url);
  } catch {
    console.error("fetch: Invalid URL format");
    return { success: false, error: "fetch: Invalid URL format" };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      const error = `${response.status} ${response.statusText}`;
      console.error(`fetch: ${error}`);
      return { success: false, error: `fetch: ${error}` };
    }

    return { success: true, content: await response.text() };

  } catch (error) {
    const message = String(error);
    console.error(`fetch: ${message}`);
    return { success: false, error: `fetch: ${message}` };
  }
} 
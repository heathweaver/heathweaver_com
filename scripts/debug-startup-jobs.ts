import { extractJobContent } from "../backend/services/job/parser.ts";

async function debugJobParser(url: string) {
  try {
    console.log(`\nFetching job from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}\nURL: ${url}\nResponse: ${responseText.substring(0, 500)}`);
    }

    const html = await response.text();
    
    // Save full response for inspection
    await Deno.writeTextFile("debug_job_parser.html", html);
    console.log("\nSaved full HTML to debug_job_parser.html");

    // Check for Cloudflare
    if (html.includes('challenge-platform') || html.includes('cloudflare')) {
      console.log("\n⚠️ Detected Cloudflare protection");
    }

    // Try to parse the content
    console.log("\nAttempting to parse job content...");
    const result = await extractJobContent(html);
    
    if (result.success && result.content) {
      console.log("\n✅ Successfully parsed job content");
      console.log("\nDebug info:", result.debug);
      console.log("\nContent sample:", result.content.substring(0, 500));
    } else {
      console.error("\n❌ Failed to parse job content:", result.error);
    }

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("An unknown error occurred:", String(error));
    }
  }
}

const testUrl = "https://www.simplyhired.com/job/DgeJCfenAuXryVKYHFpClga-u3tSjpDq5PZ4LIAVfbjghTXaz1U2wA";
await debugJobParser(testUrl); 
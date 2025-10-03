import { DOMParser } from "@b-fuze/deno-dom";

async function debugWorkableJob(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    const html = await response.text();

    // Save HTML for inspection
    await Deno.writeTextFile("debug_workable.html", html);
    console.log("Saved full HTML response to debug_workable.html");

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    if (!doc) {
      throw new Error("Failed to parse HTML");
    }

    // Look for window.careers data
    const scripts = doc.querySelectorAll("script");
    console.log("\n=== Examining Script Contents ===\n");

    scripts.forEach((script, i) => {
      const content = script.textContent;
      if (content?.includes("window.careers")) {
        console.log(`\nFound window.careers in script ${i}:`);
        console.log(content);

        try {
          // Try to extract the JSON object
          const match = content.match(/window\.careers\s*=\s*({.*});/s);
          if (match) {
            const careersData = JSON.parse(match[1]);
            console.log(
              "\nParsed careers data:",
              JSON.stringify(careersData, null, 2),
            );
          }
        } catch (e) {
          console.error("Failed to parse window.careers data:", e);
        }
      }
    });

    // Check if we're getting a Cloudflare challenge
    if (html.includes("challenge-platform")) {
      console.log("\n⚠️ Detected Cloudflare challenge in response!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

const url = Deno.args[0];
if (!url) {
  console.error("Please provide a Workable job URL");
  Deno.exit(1);
}

await debugWorkableJob(url);

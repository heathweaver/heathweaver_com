import { DOMParser } from "@b-fuze/deno-dom";

async function debugWorkableJobs(companySlug: string) {
  try {
    // Try the API endpoint that might list jobs
    const apiUrl = `https://apply.workable.com/api/v1/widget/accounts/${companySlug}/jobs`;
    console.log(`\nTrying API endpoint: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': `https://apply.workable.com/${companySlug}/`,
        'Origin': 'https://apply.workable.com'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    console.log("\nAPI Response:");
    console.log(JSON.stringify(data, null, 2));

    // Save response for inspection
    await Deno.writeTextFile("debug_workable_jobs.json", JSON.stringify(data, null, 2));
    console.log("\nSaved response to debug_workable_jobs.json");

  } catch (error) {
    console.error("Error:", error.message);
  }
}

const companySlug = Deno.args[0] || "blueprint-bryanjohnson";
await debugWorkableJobs(companySlug); 
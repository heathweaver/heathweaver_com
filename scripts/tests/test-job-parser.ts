import { processJobUrl } from "../../backend/utils/process-job-url.ts";

// List of job URLs to test
const testUrls = [
  "https://www.linkedin.com/jobs/view/4093796649/",
  "https://www.simplyhired.com/search?q=VP&l=Remote&cursor=ABQAAQAUAAAAAAAAAAAAAAACH7j1uAEBAQgAwDBVELXBnFOcPX4HURognI04wp5aqjPKeuvGxoFyrayCspxoEptA1eDeoMXidVM3lnKjPg%3D%3D&job=qiyQgYQ7WVwN9B2FQtZ4bnpkNYIS6fgbtEkAS57FnGA5sMripS3CZQ",
  "https://app.swooped.co/job-postings?addressId=dc46b1e7-3f82-4393-b44f-8ec656a54c2e&experienceLevels=executive&locationDistance=25&officeRequirements=remote&search=VP&selectedJobId=efb1b52d-9a57-4ee8-8cac-506f849a6fb0"
];

console.log("Starting job parser test...\n");

for (const url of testUrls) {
  console.log("=".repeat(80));
  console.log(`Testing URL: ${url}`);
  
  try {
    // First just fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch:", response.status, response.statusText);
      continue;
    }

    const html = await response.text();
    console.log("\nPage size:", html.length);
    
    // Log the entire HTML for inspection
    console.log("\nFirst 1000 characters of raw HTML:");
    console.log(html.slice(0, 1000));
    
    console.log("\nCommon job-related classes found:");
    [
      "job",
      "description",
      "posting",
      "content",
      "details",
      "position",
      "requirements"
    ].forEach(term => {
      const matches = html.match(new RegExp(`class="[^"]*${term}[^"]*"`, "gi"));
      if (matches) {
        console.log(`\n${term}:`);
        matches.slice(0, 3).forEach(m => console.log("  " + m));
      }
    });

    // Now try our processor
    console.log("\nTrying our processor:");
    const result = await processJobUrl(url);
    
    if (result.success) {
      console.log("\nSuccess!");
      console.log("Content length:", result.debug?.contentLength);
      
      // Show both HTML and text content for comparison
      const content = result.content || "";
      console.log("\nFirst 1000 characters of content:");
      console.log("-".repeat(40));
      console.log(content.slice(0, 1000) + "...");
    } else {
      console.log("\nFailed!");
      console.log("Error:", result.error);
    }
  } catch (error) {
    console.error("\nError during processing:", error);
  }
  
  console.log("\n");
}

console.log("Test complete!"); 
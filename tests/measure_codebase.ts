import { walk } from "@std/fs";

async function measureCodebase(rootDir: string): Promise<{
  totalChars: number;
  fileStats: { path: string; chars: number }[];
}> {
  const fileStats: { path: string; chars: number }[] = [];
  let totalChars = 0;

  for await (
    const entry of walk(rootDir, {
      includeDirs: false,
      exts: [".ts", ".js", ".tsx", ".jsx"],
    })
  ) {
    const content = await Deno.readTextFile(entry.path);
    const chars = content.length;
    totalChars += chars;
    fileStats.push({
      path: entry.path,
      chars,
    });
  }

  return {
    totalChars,
    fileStats: fileStats.sort((a, b) => b.chars - a.chars),
  };
}

// Main execution
const backendDir = new URL("../backend", import.meta.url).pathname;
console.log(`\nMeasuring codebase size in: ${backendDir}\n`);

const { totalChars, fileStats } = await measureCodebase(backendDir);

// Print results
console.log("File Statistics (sorted by size):");
console.log("==================================");
fileStats.forEach(({ path, chars }) => {
  const relativePath = path.split("backend/")[1];
  console.log(`${relativePath}: ${chars} chars`);
});

console.log("\nTotal Statistics:");
console.log("==================================");
console.log(`Total characters: ${totalChars}`);
console.log(`Total files: ${fileStats.length}`);
console.log(
  `Average file size: ${Math.round(totalChars / fileStats.length)} chars\n`,
);

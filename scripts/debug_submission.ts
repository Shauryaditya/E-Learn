
import { db } from "../src/lib/db";
import fs from "fs";
import path from "path";

async function main() {
  try {
    const submissions = await db.testSubmission.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: {
          id: true,
          status: true,
          annotatedPdfUrl: true,
          updatedAt: true
      }
    });
    
    const outputPath = path.resolve(__dirname, "..", "debug_output.json");
    fs.writeFileSync(outputPath, JSON.stringify(submissions, null, 2));
    console.log(`Wrote ${submissions.length} submissions to ${outputPath}`);
    
  } catch (e) {
      console.error(e);
      const outputPath = path.resolve(__dirname, "..", "debug_output.json");
      fs.writeFileSync(outputPath, JSON.stringify({ error: e.toString() }));
  }
}

main();

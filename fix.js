const fs = require('fs');

const content = fs.readFileSync('src/app/admin/day/page.tsx', 'utf-8');

const regex = /\{activeTab === 'SALES' &&[\s\S]*?\{activeTab === 'EXPENSES' &&/m;

const match = content.match(regex);
if (!match) {
  console.log("No match found!");
} else {
  // Just log the last 15 lines of the match to see what the end looks like.
  console.log("Found match. Last 20 lines:");
  const lines = match[0].split('\n');
  console.log(lines.slice(lines.length - 20).join('\n'));
}

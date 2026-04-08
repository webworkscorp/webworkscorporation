const fs = require('fs');
const path = require('path');

function searchFiles(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchFiles(fullPath, pattern);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (pattern.test(content)) {
        console.log(`Found in ${fullPath}`);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
          }
        }
      }
    }
  }
}

searchFiles('node_modules', /(?<!(?:const|let|var|function)\s+)fetch\s*=/);

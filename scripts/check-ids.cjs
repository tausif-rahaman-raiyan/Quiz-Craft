const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');

const idRegex = /getElementById\((['"`])([^'"`]+)\1\)/g;
const docIdRegex = /\bid=(['"])([^'"]+)\1/g;

const allIdsInDoc = new Set();
let match;
while ((match = docIdRegex.exec(html)) !== null) {
  allIdsInDoc.add(match[2]);
}

const missingIds = new Set();
while ((match = idRegex.exec(html)) !== null) {
  const id = match[2];
  if (!allIdsInDoc.has(id)) {
    missingIds.add(id);
  }
}

console.log('Total doc IDs found:', allIdsInDoc.size);
console.log('Missing element IDs referenced in JS:', Array.from(missingIds));

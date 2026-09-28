const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../index.html');
const catalogPath = path.join(__dirname, '../public/exams/catalog.json');

let indexContent = fs.readFileSync(indexPath, 'utf-8');
const catalogJson = fs.readFileSync(catalogPath, 'utf-8');

// 1. Replace <script src="exams/catalog.js"></script> with inline catalog definition
const inlineCatalogScript = `<script>
  window.MED_EXAM_CATALOG = ${catalogJson.trim()};
</script>`;

indexContent = indexContent.replace(
  /<script src="exams\/catalog\.js"><\/script>/,
  inlineCatalogScript
);

// 2. Add Fullscreen button to header if not present
if (!indexContent.includes('id="fullscreenToggleBtn"')) {
  const targetHeaderButton = `<button class="btn-icon" id="themeToggleBtn"`;
  const fullscreenButtonHtml = `
        <button class="btn-icon" id="fullscreenToggleBtn" title="Toggle Fullscreen (or Double-Click anywhere on page) (F11)" aria-label="Toggle Fullscreen">
          <svg id="fsIconExpand" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          <svg id="fsIconCompress" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
        </button>
        ${targetHeaderButton}`;
  indexContent = indexContent.replace(targetHeaderButton, fullscreenButtonHtml);
}

fs.writeFileSync(indexPath, indexContent, 'utf-8');
console.log('✓ Successfully inlined catalog and added fullscreen button to index.html');

const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, '../client/src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

const addition = `
/* Custom Top Scroller Track & Thumb */
.top-scroller-bar::-webkit-scrollbar {
  height: 10px;
}
.top-scroller-bar::-webkit-scrollbar-track {
  background: #0f172a;
  border-radius: 6px;
}
.top-scroller-bar::-webkit-scrollbar-thumb {
  background: #10b981;
  border-radius: 6px;
}
.top-scroller-bar::-webkit-scrollbar-thumb:hover {
  background: #34d399;
}

/* Hide only bottom horizontal scrollbar on tables where top scroller is active, preserving vertical scroll */
.table-hide-bottom-scroller::-webkit-scrollbar:horizontal {
  height: 0px !important;
  display: none !important;
}
.table-hide-bottom-scroller {
  /* Keep vertical scrollbar working */
  scrollbar-width: thin;
}
`;

if (!css.includes('.top-scroller-bar')) {
  css += addition;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('[PASS] Added top-scroller-bar styles to index.css');
} else {
  console.log('[SKIP] Already contains top-scroller-bar');
}

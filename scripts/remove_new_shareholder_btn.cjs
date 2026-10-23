const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../client/src/components/Shareholders/ShareholderList.jsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const targetButton = `          {/* New Shareholder Registration */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950 transition-all cursor-pointer"
            title="Add New Shareholder Record (+ ಹೊಸ ನೋಂದಣಿ)"
          >
            <Plus className="w-4 h-4" />
            <span>+ ಹೊಸ ನೋಂದಣಿ (New Shareholder)</span>
          </button>
`;

if (content.includes(targetButton)) {
  content = content.replace(targetButton, '');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] Removed "+ ಹೊಸ ನೋಂದಣಿ (New Shareholder)" button from ShareholderList.jsx');
} else {
  console.error('[FAIL] Target button not found');
  process.exit(1);
}

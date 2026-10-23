const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../client/src/components/Shareholders/ShareholderList.jsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// Clean up duplicate script file
const oldScript = path.resolve(__dirname, 'add_edit_record_system.cjs');
if (fs.existsSync(oldScript)) {
  fs.unlinkSync(oldScript);
}

const targetBlock = `          {/* Edit Record Button */}
          <button
            onClick={() => setShowEditSelector(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-950 transition-all cursor-pointer"
            title="Edit Statutory Shareholder Record (ಷೇರುದಾರರ ತಿದ್ದುಪಡಿ)"
          >
            <Edit className="w-4 h-4" />
            <span>ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Record)</span>
          </button>`;

const newBlock = `          {/* Restored New Shareholder Button */}
          <button
            onClick={() => {
              setEditShareholderData(null);
              setShowAddForm(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950 transition-all cursor-pointer"
            title="Add New Shareholder Record (+ ಹೊಸ ನೋಂದಣಿ)"
          >
            <Plus className="w-4 h-4" />
            <span>+ ಹೊಸ ನೋಂದಣಿ (New Shareholder)</span>
          </button>

          {/* Edit Record Button */}
          <button
            onClick={() => setShowEditSelector(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-950 transition-all cursor-pointer"
            title="Edit Statutory Shareholder Record (ಷೇರುದಾರರ ದಾಖಲೆ ತಿದ್ದುಪಡಿ)"
          >
            <Edit className="w-4 h-4" />
            <span>ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Record)</span>
          </button>`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, newBlock);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] ShareholderList.jsx successfully updated with both + ಹೊಸ ನೋಂದಣಿ and ದಾಖಲೆ ತಿದ್ದುಪಡಿ buttons');
} else {
  console.error('[FAIL] targetBlock not found in ShareholderList.jsx');
  process.exit(1);
}

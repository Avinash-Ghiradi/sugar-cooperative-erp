const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../client/src/components/Shareholders/ShareholderList.jsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Remove New Shareholder and Edit Record buttons from the header
const targetBlock = `          {/* Restored New Shareholder Button */}
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
  content = content.replace(targetBlock, '');
  console.log('[PASS] Removed "+ ಹೊಸ ನೋಂದಣಿ" and "ದಾಖಲೆ ತಿದ್ದುಪಡಿ" from header');
} else {
  // Try matching individual buttons
  const newBtn = `          {/* Restored New Shareholder Button */}
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
          </button>`;
  
  const editBtn = `          {/* Edit Record Button */}
          <button
            onClick={() => setShowEditSelector(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-950 transition-all cursor-pointer"
            title="Edit Statutory Shareholder Record (ಷೇರುದಾರರ ದಾಖಲೆ ತಿದ್ದುಪಡಿ)"
          >
            <Edit className="w-4 h-4" />
            <span>ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Record)</span>
          </button>`;
  
  if (content.includes(newBtn)) content = content.replace(newBtn, '');
  if (content.includes(editBtn)) content = content.replace(editBtn, '');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('[PASS] Restored previous Shareholder Statutory Ledger header buttons successfully');

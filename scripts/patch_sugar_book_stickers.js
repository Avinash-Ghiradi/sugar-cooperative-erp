const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'client', 'src', 'components', 'SugarAllotment', 'SugarAllotmentModule.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add Tag to lucide-react import
if (!content.includes('Tag,')) {
  content = content.replace(
    'PackageCheck, Search, Printer,',
    'PackageCheck, Search, Printer, Tag,'
  );
}

// 2. Import BookStickerModal
if (!content.includes("import BookStickerModal")) {
  content = content.replace(
    "import ShareholderForm from '../Shareholders/ShareholderForm';",
    "import ShareholderForm from '../Shareholders/ShareholderForm';\nimport BookStickerModal from './BookStickerModal';"
  );
}

// 3. Add showBookStickerModal state
if (!content.includes('showBookStickerModal')) {
  content = content.replace(
    'const [showBatchReceiptModal, setShowBatchReceiptModal] = useState(false);',
    'const [showBatchReceiptModal, setShowBatchReceiptModal] = useState(false);\n  const [showBookStickerModal, setShowBookStickerModal] = useState(false);'
  );
}

// 4. Add the Book Stickers Button in the top action toolbar
const bookStickerButton = `
          {/* Book Stickers Button */}
          <button
            type="button"
            onClick={() => setShowBookStickerModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
            title="ಆಯ್ಕೆ ಮಾಡಿದ ಫಿಲ್ಟರ್‌ಗಳ ಪ್ರಕಾರ ಬುಕ್ ಸ್ಟಿಕ್ಕರ್‌ಗಳು ಮುದ್ರಿಸಿ (Print Book Stickers)"
          >
            <Tag className="w-4 h-4 text-slate-950" />
            <span>ಬುಕ್ ಸ್ಟಿಕ್ಕರ್‌ಗಳು</span>
          </button>`;

if (!content.includes('setShowBookStickerModal(true)')) {
  content = content.replace(
    `          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClearFilters}`,
    `${bookStickerButton}\n\n          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClearFilters}`
  );
}

// 5. Render BookStickerModal at the end of the return statement
const stickerModalRender = `
      {/* MODAL: BOOK STICKER PRINT MODAL */}
      <BookStickerModal
        isOpen={showBookStickerModal}
        onClose={() => setShowBookStickerModal(false)}
        shareholders={processedShareholders}
        user={user}
        filterDescription={
          searchAddress
            ? \`ಗ್ರಾಮ/ಸ್ಥಳ: \${searchAddress} • ಒಟ್ಟು \${processedShareholders.length} ಶೇರುದಾರರು\`
            : selectedCircle && selectedCircle !== 'all'
            ? \`ವಲಯ: \${selectedCircle} • ಒಟ್ಟು \${processedShareholders.length} ಶೇರುದಾರರು\`
            : \`ಸಕ್ಕರೆ ಹಂಚಿಕೆ ಪಟ್ಟಿ • ಒಟ್ಟು \${processedShareholders.length} ಶೇರುದಾರರು\`
        }
      />
`;

if (!content.includes('<BookStickerModal')) {
  content = content.replace(
    '    </div>\n  );\n}',
    `${stickerModalRender}    </div>\n  );\n}`
  );
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully patched SugarAllotmentModule.jsx with Book Stickers feature!');

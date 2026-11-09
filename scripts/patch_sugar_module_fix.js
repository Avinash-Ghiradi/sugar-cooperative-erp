const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'client', 'src', 'components', 'SugarAllotment', 'SugarAllotmentModule.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF
const isCRLF = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

// 1. Ensure Tag is in imports
if (!norm.includes('Tag,')) {
  norm = norm.replace(
    'PackageCheck, Search, Printer,',
    'PackageCheck, Search, Printer, Tag,'
  );
  console.log('Added Tag to lucide imports');
}

// 2. Ensure BookStickerModal is imported
if (!norm.includes("import BookStickerModal")) {
  norm = norm.replace(
    "import ShareholderForm from '../Shareholders/ShareholderForm';",
    "import ShareholderForm from '../Shareholders/ShareholderForm';\nimport BookStickerModal from './BookStickerModal';"
  );
  console.log('Added BookStickerModal import');
}

// 3. Ensure showBookStickerModal state
if (!norm.includes('showBookStickerModal')) {
  norm = norm.replace(
    'const [showBatchReceiptModal, setShowBatchReceiptModal] = useState(false);',
    'const [showBatchReceiptModal, setShowBatchReceiptModal] = useState(false);\n  const [showBookStickerModal, setShowBookStickerModal] = useState(false);'
  );
  console.log('Added showBookStickerModal state');
}

// 4. Insert Book Stickers button
if (!norm.includes('setShowBookStickerModal(true)')) {
  const buttonCode = `          {/* Book Stickers Button */}
          <button
            type="button"
            onClick={() => setShowBookStickerModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#d97706] hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            title="ಆಯ್ಕೆ ಮಾಡಿದ ಫಿಲ್ಟರ್‌ಗಳ ಪ್ರಕಾರ ಬುಕ್ ಸ್ಟಿಕ್ಕರ್‌ಗಳು ಮುದ್ರಿಸಿ (Print Book Stickers)"
          >
            <Tag className="w-4 h-4 text-white" />
            <span>ಬುಕ್ ಸ್ಟಿಕ್ಕರ್‌ಗಳು</span>
          </button>
`;

  norm = norm.replace(
    '          {/* Clear Button */}',
    `${buttonCode}\n          {/* Clear Button */}`
  );
  console.log('Inserted Book Stickers button in toolbar!');
} else {
  console.log('Book Stickers button already exists in toolbar');
}

// 5. Insert BookStickerModal render
if (!norm.includes('<BookStickerModal')) {
  const modalRender = `      {/* MODAL: BOOK STICKER PRINT MODAL */}
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

  // Find the closing </div> of the main component (before the final `</div>\n  );\n}`)
  const lastIndex = norm.lastIndexOf('    </div>\n  );\n}');
  if (lastIndex !== -1) {
    norm = norm.slice(0, lastIndex) + modalRender + norm.slice(lastIndex);
    console.log('Inserted BookStickerModal before component close!');
  } else {
    console.warn('Could not find lastIndex for component close!');
  }
} else {
  console.log('BookStickerModal is already rendered');
}

// Restore CRLF
if (isCRLF) {
  norm = norm.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, norm, 'utf8');
console.log('Successfully updated SugarAllotmentModule.jsx!');

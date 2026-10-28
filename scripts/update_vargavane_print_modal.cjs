const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../client/src/components/Vargavane/VargavanePrintModal.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Replace the return section of VargavanePrintModal
const returnRegex = /return createPortal\([\s\S]*?\n\s*document\.body\s*\);\s*\}\s*$/;

const newReturnSection = `  return (
    <>
      {/* Dynamic Screen/Print Style Injector */}
      <style>{\`
        @media screen {
          .vargavane-print-portal {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body.vargavane-printing > #root {
            display: none !important;
            visibility: hidden !important;
          }
          body.vargavane-printing .shareholder-record-print-portal,
          body.vargavane-printing .id-card-profile-print-portal,
          body.vargavane-printing .office-note-print-portal,
          body.vargavane-printing .varasa-print-portal {
            display: none !important;
            visibility: hidden !important;
          }
          body.vargavane-printing {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body.vargavane-printing > .vargavane-print-portal,
          body.vargavane-printing .vargavane-print-portal {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Anek Kannada', 'Noto Sans Kannada', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body.vargavane-printing .vargavane-a4-page {
            box-shadow: none !important;
            border: 2px solid #000000 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 272mm !important;
            height: 272mm !important;
            padding: 16px 20px 20px 20px !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          body.vargavane-printing .vargavane-a4-page:last-child {
            page-break-after: avoid !important;
          }
        }
      \`}</style>

      {/* Screen Modal Dialog (Exactly like Varasa 12-Page Complete Bundle) */}
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
          
          {/* Modal Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-600/60 flex items-center justify-center text-purple-400 font-bold shadow">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ (Vargavane 5-Page Complete Bundle)</span>
                  {isNewSubmission && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ (Newly Submitted)
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  ಕಾನೂನುಬದ್ಧ 5 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಪತ್ರಗಳು (A4 Format)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
                title="ಮುದ್ರಿಸಿ (Print Document)"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {activeTab === 'all' ? 'ಎಲ್ಲಾ 5 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)
                </span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                title="ಮುಕ್ತಾಯ (Close)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Page Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-1.5 text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={\`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'all'
                  ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              <Layers className="w-3.5 h-3.5" /> ಎಲ್ಲಾ 5 ಪುಟಗಳು (All 5 Pages)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p1')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p1' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 1: ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ – 1
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p2')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p2' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 2: ಟ್ರಾನ್ಸಾಕ್ಷನ್ ವಿವರ (Transfer- 01 Photos)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p3')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p3' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 3: ನಾಮಿನಲ್ ಮೆಂಬರ ಅರ್ಜಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p4')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p4' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 4: ಕಛೇರಿ ಟಿಪ್ಪಣೆ & ಕಬ್ಬು ಲೇಖಪಾಲರು
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p5')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p5' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 5: ನಿರ್ದೇಶಕರ ಪರಿಶೀಲನಾ ಪತ್ರ
            </button>
          </div>

          {/* Modal Preview Area */}
          <div className="p-4 sm:p-6 bg-slate-950/50 overflow-y-auto flex flex-col items-center gap-6">
            {activeTab === 'all' ? (
              <div className="space-y-6 w-full max-w-[790px]">
                {renderPage1()}
                {renderPage2()}
                {renderPage3()}
                {renderPage4()}
                {renderPage5()}
              </div>
            ) : activeTab === 'p1' ? (
              <div className="w-full max-w-[790px]">{renderPage1()}</div>
            ) : activeTab === 'p2' ? (
              <div className="w-full max-w-[790px]">{renderPage2()}</div>
            ) : activeTab === 'p3' ? (
              <div className="w-full max-w-[790px]">{renderPage3()}</div>
            ) : activeTab === 'p4' ? (
              <div className="w-full max-w-[790px]">{renderPage4()}</div>
            ) : (
              <div className="w-full max-w-[790px]">{renderPage5()}</div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              ವರ್ಗಾವಣೆ ID: <strong className="text-purple-400 font-mono">{transferId}</strong>
              {' • ಶೇರು ನಂ: '}
              <strong className="text-emerald-400 font-mono">#{shareNo}</strong>
              {receiptNo ? \` • ರಶೀದಿ: #\${receiptNo}\` : ''}
              {' • ವರ್ಗಾವಣೆ ಶುಲ್ಕ: '}
              <strong className="text-amber-400 font-mono">₹{fees}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'all' ? 'ಎಲ್ಲಾ 5 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)
                </span>
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
              >
                ಮುಕ್ತಾಯ (Close)
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Standalone Print Portal (Portaled directly to document.body outside #root) */}
      {typeof document !== 'undefined' && createPortal(
        <div className="vargavane-print-portal">
          {activeTab === 'all' ? (
            <>
              {renderPage1()}
              {renderPage2()}
              {renderPage3()}
              {renderPage4()}
              {renderPage5()}
            </>
          ) : activeTab === 'p1' ? (
            renderPage1()
          ) : activeTab === 'p2' ? (
            renderPage2()
          ) : activeTab === 'p3' ? (
            renderPage3()
          ) : activeTab === 'p4' ? (
            renderPage4()
          ) : (
            renderPage5()
          )}
        </div>,
        document.body
      )}
    </>
  );
}
`;

if (returnRegex.test(content)) {
  content = content.replace(returnRegex, newReturnSection);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('Successfully updated VargavanePrintModal.jsx with Varasa-styled dialog and portal');
} else {
  console.error('Failed to match return regex in VargavanePrintModal.jsx');
}

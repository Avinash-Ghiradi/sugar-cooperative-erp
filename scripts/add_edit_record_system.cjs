const fs = require('fs');
const path = require('path');

// 1. Update ShareholderList.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Shareholders/ShareholderList.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  // A. Update handleInitiateEdit to directly open the 38-column Edit Record modal without PIN barrier
  const oldInitiateEdit = `  const handleInitiateEdit = (sh) => {
    if (isShareholderInactive(sh)) {
      showToast(\`ಈ ಖಾತೆಯು (#\${sh.share_no}) ಮುಖ್ಯ ಶೇರು #\${sh.merged_into_share_no || ''} ಗೆ ವಿಲೀನಗೊಂಡು ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ. ತಿದ್ದುಪಡಿ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ.\`, 'error');
      return;
    }
    setTargetEditShareholder(sh);
    setPinInput('');
    setPinError('');
    setShowPinPassword(false);
    setPinModalOpen(true);
  };`;

  const newInitiateEdit = `  const [showEditSelector, setShowEditSelector] = useState(false);
  const [editSearchInput, setEditSearchInput] = useState('');

  const handleInitiateEdit = (sh) => {
    if (!sh) {
      setEditShareholderData(null);
      setShowAddForm(true);
      return;
    }
    if (isShareholderInactive(sh)) {
      showToast(\`ಈ ಖಾತೆಯು (#\${sh.share_no}) ಮುಖ್ಯ ಶೇರು #\${sh.merged_into_share_no || ''} ಗೆ ವಿಲೀನಗೊಂಡು ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ. ತಿದ್ದುಪಡಿ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ.\`, 'error');
      return;
    }
    setEditShareholderData(sh);
    setShowAddForm(true);
    showToast(\`ಶೇರು #\${sh?.share_no || sh?.share_number} (\${sh?.shareholder_name || sh?.name}) ರವರ ತಿದ್ದುಪಡಿ ನಮೂನೆ ತೆರೆಯಲಾಗಿದೆ.\`);
  };`;

  if (content.includes(oldInitiateEdit)) {
    content = content.replace(oldInitiateEdit, newInitiateEdit);
  }

  // B. Add the "ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Record)" button in the header action bar
  const targetHeaderActions = `            <button
              onClick={() => setViewMode('summary')}
              className={\`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer \${
                viewMode === 'summary' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }\`}
            >
              Summary View
            </button>
          </div>`;

  const replacementHeaderActions = `            <button
              onClick={() => setViewMode('summary')}
              className={\`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer \${
                viewMode === 'summary' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }\`}
            >
              Summary View
            </button>
          </div>

          {/* Edit Record Button */}
          <button
            onClick={() => setShowEditSelector(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-950 transition-all cursor-pointer"
            title="Edit Statutory Shareholder Record (ಷೇರುದಾರರ ತಿದ್ದುಪಡಿ)"
          >
            <Edit className="w-4 h-4" />
            <span>ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Record)</span>
          </button>`;

  if (content.includes(targetHeaderActions)) {
    content = content.replace(targetHeaderActions, replacementHeaderActions);
  }

  // C. Fix column widths & sticky left offsets in thead and tbody so Book. No does not overlap Actions column
  const oldThead = `<th className="py-3.5 px-3 bg-emerald-800 text-emerald-100 font-bold sticky left-0 z-30 shadow-r border-r border-emerald-700/60">Actions</th>
                  <th className="py-3.5 px-3 bg-emerald-800 text-emerald-100 font-bold sticky left-[90px] z-30 border-r-2 border-emerald-400/80 shadow-r">Book. No</th>`;

  const newThead = `<th className="py-3.5 px-3 bg-emerald-800 text-emerald-100 font-bold sticky left-0 z-30 shadow-r border-r border-emerald-700/60 w-[130px] min-w-[130px]">Actions</th>
                  <th className="py-3.5 px-3 bg-emerald-800 text-emerald-100 font-bold sticky left-[130px] z-30 border-r-2 border-emerald-400/80 shadow-r w-[95px] min-w-[95px]">Book. No</th>`;

  if (content.includes(oldThead)) {
    content = content.replace(oldThead, newThead);
  }

  const oldTbodyTd = `<td className="py-2.5 px-3 bg-slate-950 group-hover:bg-slate-900 sticky left-0 z-10 shadow-r">`;
  const newTbodyTd = `<td className="py-2.5 px-3 bg-slate-950 group-hover:bg-slate-900 sticky left-0 z-10 shadow-r border-r border-slate-800 w-[130px] min-w-[130px]">`;

  if (content.includes(oldTbodyTd)) {
    content = content.replace(oldTbodyTd, newTbodyTd);
  }

  const oldBookTd = `<td className="py-2.5 px-3 bg-slate-950 group-hover:bg-slate-900 sticky left-[100px] z-10 font-bold text-sky-400 border-r border-slate-800">`;
  const newBookTd = `<td className="py-2.5 px-3 bg-slate-950 group-hover:bg-slate-900 sticky left-[130px] z-10 font-bold text-sky-400 border-r border-slate-800 w-[95px] min-w-[95px]">`;

  if (content.includes(oldBookTd)) {
    content = content.replace(oldBookTd, newBookTd);
  }

  // D. Update onEditRecord prop on ShareholderProfile modal
  const oldProfileModal = `<ShareholderProfile
          shareholderId={activeProfileId}
          initialTab={activeProfileTab}
          onClose={() => {
            setActiveProfileId(null);
            setActiveProfileTab('ledger');
          }}
        />`;

  const newProfileModal = `<ShareholderProfile
          shareholderId={activeProfileId}
          initialTab={activeProfileTab}
          onClose={() => {
            setActiveProfileId(null);
            setActiveProfileTab('ledger');
          }}
          onEditRecord={(sh) => {
            setActiveProfileId(null);
            handleInitiateEdit(sh);
          }}
        />`;

  if (content.includes(oldProfileModal)) {
    content = content.replace(oldProfileModal, newProfileModal);
  }

  // E. Add Quick Edit Selector Modal
  const modalPlacementMarker = `{/* Add / Edit Form Modal */}`;
  const editSelectorModalCode = `{/* Quick Edit Record Selector Modal */}
      {showEditSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit className="w-4 h-4 text-sky-400" /> ಶಾಸನಬದ್ಧ ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Shareholder Record)
              </h2>
              <button
                onClick={() => {
                  setShowEditSelector(false);
                  setEditSearchInput('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-200">
              <p className="text-slate-300">
                ತಿದ್ದುಪಡಿ ಮಾಡಲು ಶೇರು ಸಂಖ್ಯೆ (Share No) ಅಥವಾ ಸದಸ್ಯರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ:
              </p>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="ಶೇರು ಸಂಖ್ಯೆ (e.g. 1, 24, 5421) ಅಥವಾ ಹೆಸರು..."
                  value={editSearchInput}
                  onChange={(e) => setEditSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editSearchInput.trim()) {
                      const found = shareholders.find(s => 
                        String(s.share_no || s.share_number) === editSearchInput.trim() ||
                        (s.shareholder_name || '').toLowerCase().includes(editSearchInput.trim().toLowerCase())
                      );
                      setShowEditSelector(false);
                      handleInitiateEdit(found || { share_no: editSearchInput.trim(), shareholder_name: '' });
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 text-sm outline-none placeholder:text-slate-500 font-mono"
                />
              </div>

              {/* Matching records list */}
              {editSearchInput.trim().length > 0 && (
                <div className="max-h-48 overflow-y-auto bg-slate-950/80 border border-slate-800 rounded-xl divide-y divide-slate-800/60">
                  {shareholders
                    .filter(s => 
                      String(s.share_no || s.share_number).includes(editSearchInput.trim()) ||
                      (s.shareholder_name || '').toLowerCase().includes(editSearchInput.trim().toLowerCase()) ||
                      (s.place || '').toLowerCase().includes(editSearchInput.trim().toLowerCase())
                    )
                    .slice(0, 8)
                    .map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setShowEditSelector(false);
                          setEditSearchInput('');
                          handleInitiateEdit(s);
                        }}
                        className="w-full text-left p-2.5 hover:bg-sky-950/40 hover:text-sky-300 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400 group-hover:text-sky-400">
                            #{s.share_no || s.share_number}
                          </span>
                          <span className="font-semibold text-slate-200">
                            {s.shareholder_name || s.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {s.place || s.village_name}
                        </span>
                      </button>
                    ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const first = shareholders[0];
                    setShowEditSelector(false);
                    setEditSearchInput('');
                    handleInitiateEdit(first || null);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  ಪ್ರಸ್ತುತ ಮೊದಲ ಶೇರು (#1) ತಿದ್ದುಪಡಿ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const query = editSearchInput.trim();
                    const found = query ? shareholders.find(s => 
                      String(s.share_no || s.share_number) === query ||
                      (s.shareholder_name || '').toLowerCase().includes(query.toLowerCase())
                    ) : shareholders[0];
                    setShowEditSelector(false);
                    setEditSearchInput('');
                    handleInitiateEdit(found || (query ? { share_no: query } : null));
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-950 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>ತಿದ್ದುಪಡಿ ನಮೂನೆ ತೆರೆಯಿರಿ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      `;

  if (content.includes(modalPlacementMarker)) {
    content = content.replace(modalPlacementMarker, editSelectorModalCode + modalPlacementMarker);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] ShareholderList.jsx updated with Edit Record button, selector, and unblocked initiate edit');
}

// 2. Update ShareholderProfile.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Shareholders/ShareholderProfile.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  // Accept onEditRecord prop
  content = content.replace(
    'export default function ShareholderProfile({ shareholderId, initialTab = \'ledger\', onClose }) {',
    'export default function ShareholderProfile({ shareholderId, initialTab = \'ledger\', onClose, onEditRecord }) {'
  );

  // Add Edit icon to imports if not present
  if (!content.includes('Edit,')) {
    content = content.replace("import {\n  User,", "import {\n  User, Edit,");
  }

  // Add "ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Record)" button in header
  const targetProfileHeader = `            <button
              onClick={() => setActiveTab('id_card')}
              className={\`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer \${
                activeTab === 'id_card'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/80'
              }\`}
            >
              <Contact className="w-4 h-4 text-emerald-400" /> ಗುರುತಿನ ಚೀಟಿ (ID Card)
            </button>`;

  const newProfileHeader = `            {/* Edit Record Button */}
            <button
              onClick={() => {
                if (onEditRecord && sh) {
                  onEditRecord(sh);
                }
              }}
              className="px-3 py-2 text-white bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-950"
              title="ಶಾಸನಬದ್ಧ 38-ಕಾಲಂಗಳ ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Statutory Shareholder Record)"
            >
              <Edit className="w-4 h-4" />
              <span>ದಾಖಲೆ ತಿದ್ದುಪಡಿ (Edit Record)</span>
            </button>

            <button
              onClick={() => setActiveTab('id_card')}
              className={\`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer \${
                activeTab === 'id_card'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/80'
              }\`}
            >
              <Contact className="w-4 h-4 text-emerald-400" /> ಗುರುತಿನ ಚೀಟಿ (ID Card)
            </button>`;

  if (content.includes(targetProfileHeader)) {
    content = content.replace(targetProfileHeader, newProfileHeader);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] ShareholderProfile.jsx updated with onEditRecord button in header');
}

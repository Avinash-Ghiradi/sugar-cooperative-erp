const fs = require('fs');
const path = require('path');

const basePath = path.resolve(__dirname, '..');

// 1. PATCH client/src/components/Vargavane/VargavaneTransferModal.jsx
const modalPath = path.join(basePath, 'client/src/components/Vargavane/VargavaneTransferModal.jsx');
let modalContent = fs.readFileSync(modalPath, 'utf8');

// Ensure VargavanePrintModal and Lock, Printer are imported
if (!modalContent.includes('VargavanePrintModal')) {
  modalContent = modalContent.replace(
    "import { ApiService, isShareholderInactive } from '../../services/api';",
    "import { ApiService, isShareholderInactive } from '../../services/api';\nimport VargavanePrintModal from './VargavanePrintModal';"
  );
  modalContent = modalContent.replace(
    "Building2, Hash, Layers, ShieldCheck, DollarSign, Receipt, ArrowRightLeft",
    "Building2, Hash, Layers, ShieldCheck, DollarSign, Receipt, ArrowRightLeft,\n  Printer, Lock"
  );
}

// Add printRecord and showPreviewModal state & isApproved check & useEffect on initialData
const stateInjectionTarget = "const fileInputRef = useRef(null);";
const stateInjectionCode = `const fileInputRef = useRef(null);

  const [printRecord, setPrintRecord] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const isApproved = Boolean(
    initialData &&
    ['Approved', 'Completed', 'ಮಂಜೂರಾಗಿದೆ', 'ಅನುಮೋದಿಸಲಾಗಿದೆ'].includes(initialData.approval_status)
  );`;

if (!modalContent.includes('const [printRecord, setPrintRecord]')) {
  modalContent = modalContent.replace(stateInjectionTarget, stateInjectionCode);
}

// Add useEffect to sync form with initialData if editing
const syncFormEffect = `  useEffect(() => {
    if (initialData) {
      setForm({
        sl_no: initialData.sl_no || '',
        transfer_id: initialData.transfer_id || '',
        transferor_name: initialData.transferor_name || initialData.shareholder_name || '',
        shareholder_name: initialData.transferor_name || initialData.shareholder_name || '',
        transferor_place: initialData.transferor_place || '',
        transferor_taluk: initialData.transferor_taluk || 'ಇಂಡಿ',
        transferor_district: initialData.transferor_district || 'ವಿಜಯಪುರ',
        transferor_relationship: initialData.transferor_relationship || 'ಸ್ವಂತ',
        transferor_age: initialData.transferor_age || '',
        transferor_aadhaar: initialData.transferor_aadhaar || '',
        transferor_mobile: initialData.transferor_mobile || '',
        transferee_name: initialData.transferee_name || '',
        transferee_place: initialData.transferee_place || '',
        transferee_taluk: initialData.transferee_taluk || 'ಇಂಡಿ',
        transferee_district: initialData.transferee_district || 'ವಿಜಯಪುರ',
        transferee_relationship: initialData.transferee_relationship || 'ಮಗ',
        transferee_aadhaar: initialData.transferee_aadhaar || '',
        transferee_mobile: initialData.transferee_mobile || '',
        transferee_photo: initialData.transferee_photo || '',
        share_no: initialData.share_no || '',
        category: initialData.category || 'ಅ - ವರ್ಗ',
        no_of_shares: initialData.no_of_shares !== undefined ? initialData.no_of_shares : 1,
        fees: initialData.fees !== undefined ? initialData.fees : 570,
        receipt_no: initialData.receipt_no || '',
        receipt_date: initialData.receipt_date || new Date().toLocaleDateString('en-GB'),
        approval_status: initialData.approval_status || 'Application Received',
        documents_verified: initialData.documents_verified || 'Pending',
        transfer_form_attached: initialData.transfer_form_attached !== undefined ? initialData.transfer_form_attached : true,
        aadhaar_attached: initialData.aadhaar_attached !== undefined ? initialData.aadhaar_attached : true,
        consent_letter_attached: initialData.consent_letter_attached !== undefined ? initialData.consent_letter_attached : true,
        remarks: initialData.remarks || 'ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ನಮೂನೆ ಹಾಗೂ ಒಪ್ಪಿಗೆ ಪತ್ರ ಲಗತ್ತಿಸಲಾಗಿದೆ.'
      });
    }
  }, [initialData]);

  useEffect(() => {
    loadVillages();
  }, []);`;

if (!modalContent.includes('loadVillages();\n  }, []);\n  useEffect(() => {\n    if (initialData)')) {
  modalContent = modalContent.replace("  useEffect(() => {\n    loadVillages();\n  }, []);", syncFormEffect);
}

// Update handleSubmit to trigger printRecord on save and reject if isApproved
const oldHandleSubmitRegex = /const handleSubmit = async \(e\) => \{[\s\S]*?if \(initialData\?\.id \|\| initialData\?\.transfer_id\) \{[\s\S]*?\} catch \(err\) \{[\s\S]*?showToast\('Error saving Vargavane transfer: ' \+ err\.message, 'error'\);[\s\S]*?\}[\s\S]*?\};/;

const newHandleSubmit = `const handleSubmit = async (e) => {
    e.preventDefault();
    if (isApproved) {
      if (showToast) showToast('ಅನುಮೋದಿತ ವರ್ಗಾವಣೆ ದಾಖಲೆಯನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ (Locked after approval).', 'error');
      return;
    }
    if (!form.transferor_name?.trim()) {
      if (showToast) showToast('Please enter Transferor Shareholder name.', 'error');
      setActiveTab('transferor');
      return;
    }
    if (!form.transferee_name?.trim()) {
      if (showToast) showToast('Please enter Transferee (Vargavane Madikolluvaru) name.', 'error');
      setActiveTab('transferee');
      return;
    }
    if (!form.share_no?.trim()) {
      if (showToast) showToast('Please enter Share Number.', 'error');
      setActiveTab('shares_fees');
      return;
    }

    try {
      if (initialData?.id || initialData?.transfer_id) {
        const res = await ApiService.updateVargavaneTransfer(initialData.id || initialData.transfer_id, form);
        if (res.success) {
          if (showToast) showToast('Vargavane transfer application updated successfully!');
          if (onSaveSuccess) onSaveSuccess();
          const savedRec = res.data || { ...initialData, ...form };
          setPrintRecord(savedRec);
        } else {
          if (showToast) showToast(res.message || 'Update failed', 'error');
        }
      } else {
        const res = await ApiService.addVargavaneTransfer(form);
        if (res.success) {
          if (showToast) showToast(\`Vargavane transfer \${res.transfer_id || ''} registered successfully!\`);
          if (onSaveSuccess) onSaveSuccess();
          const savedRec = res.data || { ...form, transfer_id: res.transfer_id || form.transfer_id };
          setPrintRecord(savedRec);
        } else {
          if (showToast) showToast(res.message || 'Creation failed', 'error');
        }
      }
    } catch (err) {
      if (showToast) showToast('Error saving Vargavane transfer: ' + err.message, 'error');
    }
  };`;

modalContent = modalContent.replace(oldHandleSubmitRegex, newHandleSubmit);

// Early return if printRecord is active
if (!modalContent.includes('if (printRecord)')) {
  modalContent = modalContent.replace(
    "if (!isOpen) return null;",
    `if (!isOpen && !printRecord) return null;

  if (printRecord) {
    return (
      <VargavanePrintModal
        isOpen={true}
        onClose={() => {
          setPrintRecord(null);
          onClose();
        }}
        vargavaneData={printRecord}
        isNewSubmission={true}
      />
    );
  }`
  );
}

// Add lock banner after Modal Header
const headerTarget = `              <p className="text-xs text-slate-400">
                ವರ್ಗಾವಣೆ ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ನಮೂನೆ (ಮೂಲ ಶೇರುದಾರರಿಂದ ಹೊಸಬರಿಗೆ ಶೇರು ವರ್ಗಾವಣೆ)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>`;

const lockBanner = `              <p className="text-xs text-slate-400">
                ವರ್ಗಾವಣೆ ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ನಮೂನೆ (ಮೂಲ ಶೇರುದಾರರಿಂದ ಹೊಸಬರಿಗೆ ಶೇರು ವರ್ಗಾವಣೆ)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isApproved && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>ಈ ಶೇರು ವರ್ಗಾವಣೆಯು ಈಗಾಗಲೇ ಮಂಜೂರಾಗಿದೆ (Approved). ವಿವರಗಳನ್ನು ಬದಲಾಯಿಸಲು ಅನುಮತಿ ಇಲ್ಲ. ಮುದ್ರಣ (Print) ಅಥವಾ ವೀಕ್ಷಣೆ (View) ಮಾತ್ರ ಲಭ್ಯವಿದೆ.</span>
          </div>
        )}`;

modalContent = modalContent.replace(headerTarget, lockBanner);

// Add "ಪ್ರಿವ್ಯೂ (Preview)" button in footer and render preview modal
const footerBtnTarget = `<button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>`;

const footerBtnWithPreview = `<button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="5 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ಪ್ರಿವ್ಯೂ (5-Page Print Dossier Preview)"
              >
                <Printer className="w-4 h-4 text-indigo-400" />
                <span>ಪ್ರಿವ್ಯೂ (Preview)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>`;

modalContent = modalContent.replace(footerBtnTarget, footerBtnWithPreview);

// Guard submit button if isApproved
const saveBtnTarget = `<button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{initialData ? 'Update Vargavane' : 'Submit Vargavane Application'}</span>
              </button>`;

const saveBtnGuarded = `{!isApproved ? (
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{initialData ? 'Update Vargavane' : 'Submit Vargavane Application'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed">
                  <Lock className="w-4 h-4" />
                  <span>ಅನುಮೋದಿತ (Locked)</span>
                </div>
              )}`;

modalContent = modalContent.replace(saveBtnTarget, saveBtnGuarded);

// Add preview modal render before end of component
const closingModalTarget = `      </div>
    </div>
  );
}`;

const closingModalWithPreview = `      </div>

      {/* 5-Page Statutory Dossier Preview Modal */}
      {showPreviewModal && (
        <VargavanePrintModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          vargavaneData={form}
          isNewSubmission={false}
        />
      )}
    </div>
  );
}`;

modalContent = modalContent.replace(closingModalTarget, closingModalWithPreview);

fs.writeFileSync(modalPath, modalContent, 'utf8');
console.log('Successfully patched VargavaneTransferModal.jsx');

// 2. PATCH client/src/components/Vargavane/VargavaneTransferModule.jsx
const modulePath = path.join(basePath, 'client/src/components/Vargavane/VargavaneTransferModule.jsx');
let moduleContent = fs.readFileSync(modulePath, 'utf8');

// Ensure VargavanePrintModal and Lock are imported
if (!moduleContent.includes("import VargavanePrintModal from './VargavanePrintModal';")) {
  moduleContent = moduleContent.replace(
    "import VargavaneTransferModal from './VargavaneTransferModal';",
    "import VargavaneTransferModal from './VargavaneTransferModal';\nimport VargavanePrintModal from './VargavanePrintModal';"
  );
}
if (!moduleContent.includes('Lock,')) {
  moduleContent = moduleContent.replace(
    'ArrowRightLeft, Search, Plus, CheckCircle2, Clock, X, Save,',
    'ArrowRightLeft, Search, Plus, CheckCircle2, Clock, X, Save, Lock,'
  );
}

// In table row actions: lock edit/delete for approved/completed records
const tableActionsRegex = /<button\s+type="button"\s+onClick=\{\(\) => \{\s+setEditingTransfer\(v\);\s+setShowAddModal\(true\);\s+\}\}\s+className="p-1\.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"\s+title="Edit Vargavane Record"\s*>\s*<Edit3 className="w-3\.5 h-3\.5 text-sky-400" \/>\s*<\/button>\s*<button\s+type="button"\s+onClick=\{\(\) => handleDelete\(v\.transfer_id \|\| v\.id\)\}\s+className="p-1\.5 rounded-lg bg-slate-900 hover:bg-rose-950\/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"\s+title="Delete Record"\s*>\s*<Trash2 className="w-3\.5 h-3\.5" \/>\s*<\/button>/;

const lockedTableActions = `{['Approved', 'Completed', 'ಮಂಜೂರಾಗಿದೆ', 'ಅನುಮೋದಿಸಲಾಗಿದೆ'].includes(v.approval_status) ? (
                          <span
                            className="p-1.5 rounded-lg bg-slate-900/60 text-slate-500 cursor-not-allowed"
                            title="ಅನುಮೋದಿತ ಶೇರು ವರ್ಗಾವಣೆ ತಿದ್ದುಪಡಿ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ (Locked after approval)"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTransfer(v);
                                setShowAddModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Edit Vargavane Record"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(v.transfer_id || v.id)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}`;

moduleContent = moduleContent.replace(tableActionsRegex, lockedTableActions);

// Update title of printer button in row
moduleContent = moduleContent.replace(
  'title="View / Print Vargavane Acknowledgement Slip"',
  'title="ಅಧಿಕೃತ 5 ಪುಟಗಳ ಶೇರು ವರ್ಗಾವಣೆ ಮುದ್ರಣ (Print 5-Page Vargavane Transfer Application Dossier)"'
);

// Keyed instantiation for VargavaneTransferModal
const oldModalInst = `<VargavaneTransferModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTransfer(null);
        }}
        initialData={editingTransfer}
        onSaveSuccess={loadTransfers}
        showToast={showToast}
      />`;

const newModalInst = `{showAddModal && (
        <VargavaneTransferModal
          key={editingTransfer ? \`edit-\${editingTransfer.transfer_id || editingTransfer.id}\` : 'new-vargavane'}
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingTransfer(null);
          }}
          initialData={editingTransfer}
          onSaveSuccess={loadTransfers}
          showToast={showToast}
        />
      )}`;

moduleContent = moduleContent.replace(oldModalInst, newModalInst);

// Replace legacy 1-page acknowledgement slip modal with VargavanePrintModal
const oldPrintSlipRegex = /\{\/\* Official Vargavane Acknowledgement Receipt Slip Modal \*\/\}[\s\S]*?\{printSlipTransfer && \([\s\S]*?id="printable-vargavane-slip"[\s\S]*?Print Receipt[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const newPrintModalInst = `{/* Official 5-Page Statutory Vargavane Dossier Print Modal */}
      {printSlipTransfer && (
        <VargavanePrintModal
          isOpen={Boolean(printSlipTransfer)}
          onClose={() => setPrintSlipTransfer(null)}
          vargavaneData={printSlipTransfer}
          isNewSubmission={false}
        />
      )}`;

moduleContent = moduleContent.replace(oldPrintSlipRegex, newPrintModalInst);

fs.writeFileSync(modulePath, moduleContent, 'utf8');
console.log('Successfully patched VargavaneTransferModule.jsx');

// 3. PATCH client/src/services/api.js
const apiPath = path.join(basePath, 'client/src/services/api.js');
let apiContent = fs.readFileSync(apiPath, 'utf8');

const oldUpdateVg = `  async updateVargavaneTransfer(idOrTransferId, data) {
    await ensureDBReady();
    const idx = mockVargavaneTransfers.findIndex(v => String(v.id) === String(idOrTransferId) || v.transfer_id === idOrTransferId);
    if (idx !== -1) {
      mockVargavaneTransfers[idx] = { ...mockVargavaneTransfers[idx], ...data };
      saveStoredData(STORAGE_KEY_VG, mockVargavaneTransfers);
      return { success: true, data: mockVargavaneTransfers[idx] };
    }
    return { success: false, message: 'Record not found' };
  },

  async deleteVargavaneTransfer(idOrTransferId) {
    await ensureDBReady();
    const idx = mockVargavaneTransfers.findIndex(v => String(v.id) === String(idOrTransferId) || v.transfer_id === idOrTransferId);
    if (idx !== -1) {
      mockVargavaneTransfers.splice(idx, 1);
      saveStoredData(STORAGE_KEY_VG, mockVargavaneTransfers);
      return { success: true };
    }
    return { success: false, message: 'Record not found' };
  },`;

const newUpdateVg = `  async updateVargavaneTransfer(idOrTransferId, data) {
    await ensureDBReady();
    const idx = mockVargavaneTransfers.findIndex(v => String(v.id) === String(idOrTransferId) || v.transfer_id === idOrTransferId);
    if (idx !== -1) {
      const existing = mockVargavaneTransfers[idx];
      if (['Approved', 'Completed', 'ಮಂಜೂರಾಗಿದೆ', 'ಅನುಮೋದಿಸಲಾಗಿದೆ'].includes(existing.approval_status)) {
        return { success: false, message: 'ಅನುಮೋದಿತ ವರ್ಗಾವಣೆ ದಾಖಲೆಯನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ (Cannot update approved Vargavane transfer).' };
      }
      mockVargavaneTransfers[idx] = { ...existing, ...data };
      saveStoredData(STORAGE_KEY_VG, mockVargavaneTransfers);
      if (CloudDbService.isEnabled()) {
        CloudDbService.saveCollectionItem('vargavane', mockVargavaneTransfers[idx].transfer_id || String(mockVargavaneTransfers[idx].id), mockVargavaneTransfers[idx])
          .catch(err => console.warn('Cloud DB updateVargavane error:', err));
      }
      return { success: true, data: mockVargavaneTransfers[idx] };
    }
    return { success: false, message: 'Record not found' };
  },

  async deleteVargavaneTransfer(idOrTransferId) {
    await ensureDBReady();
    const idx = mockVargavaneTransfers.findIndex(v => String(v.id) === String(idOrTransferId) || v.transfer_id === idOrTransferId);
    if (idx !== -1) {
      const existing = mockVargavaneTransfers[idx];
      if (['Approved', 'Completed', 'ಮಂಜೂರಾಗಿದೆ', 'ಅನುಮೋದಿಸಲಾಗಿದೆ'].includes(existing.approval_status)) {
        return { success: false, message: 'ಅನುಮೋದಿತ ವರ್ಗಾವಣೆ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ (Cannot delete approved Vargavane transfer).' };
      }
      const removed = mockVargavaneTransfers.splice(idx, 1)[0];
      saveStoredData(STORAGE_KEY_VG, mockVargavaneTransfers);
      if (CloudDbService.isEnabled()) {
        CloudDbService.deleteCollectionItem('vargavane', removed.transfer_id || String(removed.id))
          .catch(err => console.warn('Cloud DB deleteVargavane error:', err));
      }
      return { success: true };
    }
    return { success: false, message: 'Record not found' };
  },`;

if (apiContent.includes(oldUpdateVg)) {
  apiContent = apiContent.replace(oldUpdateVg, newUpdateVg);
  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log('Successfully patched api.js');
} else {
  console.log('api.js already patched or pattern differed');
}

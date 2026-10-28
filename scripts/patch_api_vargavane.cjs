const fs = require('fs');
const path = require('path');

const apiPath = path.resolve(__dirname, '../client/src/services/api.js');
let content = fs.readFileSync(apiPath, 'utf8');

const regex = /async updateVargavaneTransfer\(idOrTransferId, data\) \{[\s\S]*?async deleteVargavaneTransfer\(idOrTransferId\) \{[\s\S]*?return \{ success: false, message: 'Record not found' \};\s*\}/;

const replacement = `async updateVargavaneTransfer(idOrTransferId, data) {
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
  }`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(apiPath, content, 'utf8');
  console.log('Successfully updated api.js for Vargavane lock and CloudDb');
} else {
  console.error('Regex match failed for api.js');
}

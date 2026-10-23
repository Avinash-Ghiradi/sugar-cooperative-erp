const fs = require('fs');
const path = require('path');

const apiPath = path.resolve(__dirname, '../client/src/services/api.js');
let api = fs.readFileSync(apiPath, 'utf8').replace(/\r\n/g, '\n');

const target = `  async clearCircleDirectory() {
    mockCircleDirectory = [];
    saveStoredData(STORAGE_KEY_CIRCLE_DIR, []);
    await saveCircleDirectoryToDB([]);
    return { success: true };
  },`;

const addition = `  async clearCircleDirectory() {
    mockCircleDirectory = [];
    saveStoredData(STORAGE_KEY_CIRCLE_DIR, []);
    await saveCircleDirectoryToDB([]);
    return { success: true };
  },

  async addCircleDirectoryItem(data) {
    await ensureDBReady();
    const rawAddr = (data.address || data.place || data.village_name || '').trim().normalize('NFC');
    if (!rawAddr) {
      return { success: false, message: 'ಗ್ರಾಮ / ಸ್ಥಳದ ಹೆಸರು ಕಡ್ಡಾಯವಾಗಿದೆ (Village/Address is required)' };
    }

    const key = rawAddr.toLowerCase();
    const existingIndex = mockCircleDirectory.findIndex(
      d => (d.address || '').trim().toLowerCase().normalize('NFC') === key
    );

    let maxId = 0;
    mockCircleDirectory.forEach(d => {
      const mid = Number(d.id);
      if (mid > maxId) maxId = mid;
    });
    const newId = maxId + 1;

    const newItem = {
      id: existingIndex >= 0 ? mockCircleDirectory[existingIndex].id : newId,
      address: rawAddr,
      circle_name: (data.circle_name || data.circle || 'ಇತರೆ').trim().normalize('NFC'),
      taluk: (data.taluk || '').trim().normalize('NFC'),
      district: (data.district || 'ವಿಜಯಪುರ').trim().normalize('NFC'),
      pincode: (data.pincode || data.pin_code || '').trim(),
      circle_in_charge: (data.circle_in_charge || data.in_charge || '').trim().normalize('NFC'),
      contact_no: (data.contact_no || data.mobile_no || data.contact || '').trim()
    };

    if (existingIndex >= 0) {
      mockCircleDirectory[existingIndex] = newItem;
    } else {
      mockCircleDirectory.push(newItem);
    }

    saveStoredData(STORAGE_KEY_CIRCLE_DIR, mockCircleDirectory);
    await saveCircleDirectoryToDB(mockCircleDirectory);
    _cachedFilterOptions = null;

    if (CloudDbService.isEnabled()) {
      try {
        await CloudDbService.saveCollectionItem('circle_directory', newItem.address, newItem);
      } catch (e) {
        console.warn('Cloud DB saveCollectionItem circle_directory error:', e);
      }
    }

    let shUpdated = false;
    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const plKey = (s.place || s.village_name || '').trim().toLowerCase().normalize('NFC');
      if (plKey === key) {
        s.circle = newItem.circle_name;
        s.circle_name = newItem.circle_name;
        if (newItem.taluk) s.taluk = newItem.taluk;
        if (newItem.district) s.district = newItem.district;
        if (newItem.pincode) s.pin_code = newItem.pincode;
        shUpdated = true;
      }
    }
    if (shUpdated) {
      await saveToIndexedDB(mockShareholders);
    }

    return { success: true, data: newItem, message: \`ಗ್ರಾಮ "\${rawAddr}" ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!\` };
  },

  async updateCircleDirectoryItem(idOrAddress, updates) {
    await ensureDBReady();
    if (idOrAddress === undefined || idOrAddress === null) {
      return { success: false, message: 'ID ಅಥವಾ ಸ್ಥಳ ಅಗತ್ಯವಿದೆ (Identifier required)' };
    }

    const searchKey = String(idOrAddress).trim().toLowerCase().normalize('NFC');
    const index = mockCircleDirectory.findIndex(d => 
      String(d.id) === String(idOrAddress) ||
      (d.address || '').trim().toLowerCase().normalize('NFC') === searchKey
    );

    if (index === -1) {
      return { success: false, message: 'ಗ್ರಾಮ / ಸ್ಥಳದ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ (Directory entry not found)' };
    }

    const current = mockCircleDirectory[index];
    const oldAddr = current.address;
    const oldCircle = current.circle_name;

    const newAddr = updates.address ? updates.address.trim().normalize('NFC') : current.address;
    const newCircle = updates.circle_name ? updates.circle_name.trim().normalize('NFC') : current.circle_name;
    const newTaluk = updates.taluk !== undefined ? (updates.taluk || '').trim().normalize('NFC') : current.taluk;
    const newDistrict = updates.district !== undefined ? (updates.district || 'ವಿಜಯಪುರ').trim().normalize('NFC') : current.district;
    const newPincode = updates.pincode !== undefined ? (updates.pincode || '').trim() : current.pincode;
    const newInCharge = updates.circle_in_charge !== undefined ? (updates.circle_in_charge || '').trim().normalize('NFC') : current.circle_in_charge;
    const newContact = updates.contact_no !== undefined ? (updates.contact_no || '').trim() : current.contact_no;

    const updatedItem = {
      ...current,
      address: newAddr,
      circle_name: newCircle,
      taluk: newTaluk,
      district: newDistrict,
      pincode: newPincode,
      circle_in_charge: newInCharge,
      contact_no: newContact
    };

    mockCircleDirectory[index] = updatedItem;

    saveStoredData(STORAGE_KEY_CIRCLE_DIR, mockCircleDirectory);
    await saveCircleDirectoryToDB(mockCircleDirectory);
    _cachedFilterOptions = null;

    if (CloudDbService.isEnabled()) {
      try {
        if (oldAddr !== newAddr) {
          await CloudDbService.deleteCollectionItem('circle_directory', oldAddr);
        }
        await CloudDbService.saveCollectionItem('circle_directory', newAddr, updatedItem);
      } catch (e) {
        console.warn('Cloud DB updateCollectionItem circle_directory error:', e);
      }
    }

    const oldKey = (oldAddr || '').trim().toLowerCase().normalize('NFC');
    let shUpdated = false;
    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      const plKey = (s.place || s.village_name || '').trim().toLowerCase().normalize('NFC');
      if (plKey === oldKey) {
        if (oldAddr !== newAddr) {
          s.place = newAddr;
          s.village_name = newAddr;
        }
        s.circle = newCircle;
        s.circle_name = newCircle;
        if (newTaluk) s.taluk = newTaluk;
        if (newDistrict) s.district = newDistrict;
        if (newPincode) s.pin_code = newPincode;
        shUpdated = true;
      }
    }
    if (shUpdated) {
      await saveToIndexedDB(mockShareholders);
    }

    return { success: true, data: updatedItem, message: \`ಗ್ರಾಮ "\${newAddr}" ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!\` };
  },

  async deleteCircleDirectoryItem(idOrAddress) {
    await ensureDBReady();
    const searchKey = String(idOrAddress).trim().toLowerCase().normalize('NFC');
    const index = mockCircleDirectory.findIndex(d => 
      String(d.id) === String(idOrAddress) ||
      (d.address || '').trim().toLowerCase().normalize('NFC') === searchKey
    );

    if (index === -1) {
      return { success: false, message: 'ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ (Directory entry not found)' };
    }

    const removed = mockCircleDirectory[index];
    mockCircleDirectory.splice(index, 1);

    saveStoredData(STORAGE_KEY_CIRCLE_DIR, mockCircleDirectory);
    await saveCircleDirectoryToDB(mockCircleDirectory);
    _cachedFilterOptions = null;

    if (CloudDbService.isEnabled()) {
      try {
        await CloudDbService.deleteCollectionItem('circle_directory', removed.address);
      } catch (e) {}
    }

    return { success: true, message: \`ಗ್ರಾಮ "\${removed.address}" ವನ್ನು ಅಳಿಸಲಾಗಿದೆ.\` };
  },

  async updateCircleMetadata(currentCircleName, { newName, taluk, district, circle_in_charge, contact_no }) {
    await ensureDBReady();
    if (!currentCircleName) return { success: false, message: 'ಸರ್ಕಲ್ ಹೆಸರು ಅಗತ್ಯವಿದೆ' };

    const cKey = currentCircleName.trim().toLowerCase().normalize('NFC');
    const finalName = newName ? newName.trim().normalize('NFC') : currentCircleName;

    let updatedCount = 0;
    mockCircleDirectory.forEach(item => {
      if ((item.circle_name || '').trim().toLowerCase().normalize('NFC') === cKey) {
        item.circle_name = finalName;
        if (taluk !== undefined) item.taluk = (taluk || '').trim().normalize('NFC');
        if (district !== undefined) item.district = (district || 'ವಿಜಯಪುರ').trim().normalize('NFC');
        if (circle_in_charge !== undefined) item.circle_in_charge = (circle_in_charge || '').trim().normalize('NFC');
        if (contact_no !== undefined) item.contact_no = (contact_no || '').trim();
        updatedCount++;
      }
    });

    saveStoredData(STORAGE_KEY_CIRCLE_DIR, mockCircleDirectory);
    await saveCircleDirectoryToDB(mockCircleDirectory);
    _cachedFilterOptions = null;

    let shUpdated = false;
    for (let i = 0; i < mockShareholders.length; i++) {
      const s = mockShareholders[i];
      if ((s.circle || s.circle_name || '').trim().toLowerCase().normalize('NFC') === cKey) {
        s.circle = finalName;
        s.circle_name = finalName;
        if (taluk) s.taluk = taluk;
        if (district) s.district = district;
        shUpdated = true;
      }
    }
    if (shUpdated) {
      await saveToIndexedDB(mockShareholders);
    }

    return { success: true, updatedVillagesCount: updatedCount, message: \`ಸರ್ಕಲ್ "\${finalName}" ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!\` };
  },`;

if (api.includes(target) && !api.includes('addCircleDirectoryItem')) {
  api = api.replace(target, addition);
  fs.writeFileSync(apiPath, api, 'utf8');
  console.log('Successfully added Circle & Village Add/Update/Delete methods to api.js');
} else {
  console.log('Target not found or already added in api.js');
}

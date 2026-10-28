import { useState, useEffect } from 'react';
import { CloudDbService } from './cloudDb';

const STORAGE_KEY_COMPANY_LOGO = 'sugar_erp_company_logo';
const STORAGE_KEY_ORG_SETTINGS = 'sugar_erp_org_settings';
export const DEFAULT_LOGO_PATH = './id_assets/bsskn_logo.png';

// Helper to compress and optimize uploaded company logo image
export function compressLogoImage(file, maxWidth = 400, maxHeight = 400) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Get current company logo (prioritizes uploaded custom logo, falls back to default)
export function getCompanyLogo() {
  try {
    const custom = localStorage.getItem(STORAGE_KEY_COMPANY_LOGO);
    if (custom && custom.length > 20) return custom;
    const orgRaw = localStorage.getItem(STORAGE_KEY_ORG_SETTINGS);
    if (orgRaw) {
      const org = JSON.parse(orgRaw);
      if (org && org.logo && org.logo.length > 20) return org.logo;
    }
  } catch (e) {}
  return DEFAULT_LOGO_PATH;
}

// Save company logo globally (localStorage + Supabase Cloud DB + broadcast event)
export async function saveCompanyLogo(dataUrl) {
  try {
    if (dataUrl) {
      localStorage.setItem(STORAGE_KEY_COMPANY_LOGO, dataUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_COMPANY_LOGO);
    }

    // Also update org settings
    const orgRaw = localStorage.getItem(STORAGE_KEY_ORG_SETTINGS);
    const org = orgRaw ? JSON.parse(orgRaw) : {};
    org.logo = dataUrl || '';
    localStorage.setItem(STORAGE_KEY_ORG_SETTINGS, JSON.stringify(org));

    // Also update ID card custom settings so ID cards adopt it immediately
    const idKey = 'sugar_erp_id_card_custom_settings_v1';
    const idRaw = localStorage.getItem(idKey);
    const idSettings = idRaw ? JSON.parse(idRaw) : {};
    idSettings.customLogo = dataUrl || '';
    localStorage.setItem(idKey, JSON.stringify(idSettings));

    // Broadcast update events locally to all mounted components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('company_logo_updated', { detail: dataUrl || DEFAULT_LOGO_PATH }));
      window.dispatchEvent(new Event('id_card_settings_updated'));
    }

    // Sync to Supabase Cloud DB across all browsers worldwide
    await CloudDbService.saveCollectionItem('organization_settings', 'company_logo', {
      logo: dataUrl || '',
      updated_at: new Date().toISOString()
    }).catch(err => console.warn('Cloud save company_logo failed:', err));

    await CloudDbService.saveCollectionItem('id_card_settings', 'global_config', {
      ...idSettings,
      updated_at: new Date().toISOString()
    }).catch(err => console.warn('Cloud sync id_card_settings failed:', err));

    return true;
  } catch (err) {
    console.error('saveCompanyLogo error:', err);
    return false;
  }
}

// Reset company logo to default
export async function resetCompanyLogo() {
  return saveCompanyLogo('');
}

// Sync company logo from Supabase Cloud DB across all browsers
export async function syncCompanyLogoFromCloud() {
  try {
    const records = await CloudDbService.getCollection('organization_settings');
    const cloudItem = records && records.length > 0
      ? records.find(r => r.record_id === 'company_logo' || r.id === 'company_logo' || r.logo !== undefined) || records[0]
      : null;
    const local = localStorage.getItem(STORAGE_KEY_COMPANY_LOGO) || '';

    if (cloudItem && cloudItem.logo) {
      if (cloudItem.logo !== local) {
        localStorage.setItem(STORAGE_KEY_COMPANY_LOGO, cloudItem.logo);
        const orgRaw = localStorage.getItem(STORAGE_KEY_ORG_SETTINGS);
        const org = orgRaw ? JSON.parse(orgRaw) : {};
        org.logo = cloudItem.logo;
        localStorage.setItem(STORAGE_KEY_ORG_SETTINGS, JSON.stringify(org));

        const idKey = 'sugar_erp_id_card_custom_settings_v1';
        const idRaw = localStorage.getItem(idKey);
        const idSettings = idRaw ? JSON.parse(idRaw) : {};
        idSettings.customLogo = cloudItem.logo;
        localStorage.setItem(idKey, JSON.stringify(idSettings));

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('company_logo_updated', { detail: cloudItem.logo }));
          window.dispatchEvent(new Event('id_card_settings_updated'));
        }
      }
      return cloudItem.logo;
    } else if (local && local.length > 50) {
      // Local has a logo that cloud doesn't have yet -> push to cloud
      await CloudDbService.saveCollectionItem('organization_settings', 'company_logo', {
        logo: local,
        updated_at: new Date().toISOString()
      });
      return local;
    }
  } catch (err) {
    console.warn('syncCompanyLogoFromCloud failed:', err);
  }
  return getCompanyLogo();
}

// React Hook to subscribe to real-time company logo updates anywhere in the UI
export function useCompanyLogo() {
  const [logo, setLogo] = useState(() => getCompanyLogo());

  useEffect(() => {
    const handleUpdate = (e) => {
      setLogo(e?.detail || getCompanyLogo());
    };
    window.addEventListener('company_logo_updated', handleUpdate);
    window.addEventListener('id_card_settings_updated', () => setLogo(getCompanyLogo()));

    // Initial background cloud sync
    syncCompanyLogoFromCloud().then(cloudLogo => {
      if (cloudLogo) setLogo(cloudLogo);
    });

    return () => {
      window.removeEventListener('company_logo_updated', handleUpdate);
      window.removeEventListener('id_card_settings_updated', () => setLogo(getCompanyLogo()));
    };
  }, []);

  return logo;
}

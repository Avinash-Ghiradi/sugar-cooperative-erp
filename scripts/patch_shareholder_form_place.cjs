const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../client/src/components/Shareholders/ShareholderForm.jsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add state in ShareholderForm
const targetState = "  const [villages, setVillages] = useState([]);";
const newState = `  const [villages, setVillages] = useState([]);
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const placeDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (placeDropdownRef.current && !placeDropdownRef.current.contains(e.target)) {
        setShowPlaceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVillages = useMemo(() => {
    const q = (formData.place || '').trim().toLowerCase();
    if (!q) return villages.slice(0, 20);
    return villages.filter(v => {
      const name = (v.name || '').toLowerCase();
      const taluk = (v.taluk || '').toLowerCase();
      return name.includes(q) || taluk.includes(q);
    });
  }, [formData.place, villages]);

  const handleSelectVillage = (v) => {
    const placeName = typeof v === 'string' ? v : v.name;
    handlePlaceChange(placeName);
    setShowPlaceDropdown(false);
  };`;

if (content.includes(targetState)) {
  content = content.replace(targetState, newState);
}

// 2. Ensure useMemo and useRef are imported
if (!content.includes('useMemo')) {
  content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef, useMemo } from 'react';");
}

// 3. Update the place input in Section 3
const oldPlaceInput = `              <div>
                <label className="block text-slate-400 mb-1 font-medium">Place (ಗ್ರಾಮ / ಸ್ಥಳ) *</label>
                <input
                  type="text"
                  required
                  list="sh-form-places-list"
                  placeholder="e.g. ಬಳ್ಳೊಳ್ಳಿ, ಜೇವೂರ, ಚಡಚಣ, ಅಥರ್ಗಾ..."
                  value={formData.place}
                  onChange={(e) => handlePlaceChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-bold outline-none focus:border-emerald-500"
                />
                <datalist id="sh-form-places-list">
                  {villages.map(v => (
                    <option key={v.village_id || v.name} value={v.name}>
                      {v.name} {v.taluk ? \`(\${v.taluk})\` : ''}
                    </option>
                  ))}
                </datalist>
              </div>`;

const newPlaceInput = `              <div className="relative" ref={placeDropdownRef}>
                <label className="block text-slate-400 mb-1 font-medium flex items-center justify-between">
                  <span>Place (ಗ್ರಾಮ / ಸ್ಥಳ) *</span>
                  {formData.place && (
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {formData.circle || ''}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  list="sh-form-places-list"
                  autoComplete="off"
                  placeholder="e.g. ಬಳ್ಳೊಳ್ಳಿ, ಜೇವೂರ, ಚಡಚಣ, ಅಥರ್ಗಾ..."
                  value={formData.place}
                  onFocus={() => setShowPlaceDropdown(true)}
                  onChange={(e) => {
                    handlePlaceChange(e.target.value);
                    setShowPlaceDropdown(true);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-bold outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                />
                <datalist id="sh-form-places-list">
                  {villages.map(v => (
                    <option key={v.village_id || v.name} value={v.name}>
                      {v.name} {v.taluk ? \`(\${v.taluk})\` : ''}
                    </option>
                  ))}
                </datalist>

                {/* Dropdown suggestions while typing */}
                {showPlaceDropdown && filteredVillages.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 py-1 divide-y divide-slate-800/60 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[10px] text-slate-400 font-bold bg-slate-950/80 sticky top-0 flex items-center justify-between">
                      <span>ಸೂಚಿಸಿದ ಗ್ರಾಮಗಳು ({filteredVillages.length})</span>
                      <span className="text-[9px] text-slate-500">ಕ್ಲಿಕ್ ಮಾಡಿ ಆಯ್ಕೆಮಾಡಿ</span>
                    </div>
                    {filteredVillages.slice(0, 30).map((v, i) => {
                      const vName = v.name || v;
                      const taluk = v.taluk || '';
                      const circleRes = ApiService.resolveCircleForPlace ? ApiService.resolveCircleForPlace(vName) : null;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectVillage(v)}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-950/60 hover:text-emerald-300 transition-colors flex items-center justify-between group cursor-pointer text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-200 group-hover:text-emerald-300">
                              {vName}
                            </span>
                            {taluk && (
                              <span className="text-[10px] text-slate-400 ml-1.5">
                                (ತಾ: {taluk})
                              </span>
                            )}
                          </div>
                          {(v.circle_name || circleRes?.circle_name) && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 group-hover:bg-emerald-900/50 text-slate-300 group-hover:text-emerald-200 font-mono">
                              {v.circle_name || circleRes?.circle_name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>`;

if (content.includes(oldPlaceInput)) {
  content = content.replace(oldPlaceInput, newPlaceInput);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] ShareholderForm.jsx updated successfully with place autocomplete while typing');
} else {
  console.error('[FAIL] ShareholderForm.jsx place input target not found');
  process.exit(1);
}

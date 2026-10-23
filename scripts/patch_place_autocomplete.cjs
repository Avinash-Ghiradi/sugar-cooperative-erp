const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../client/src/components/Enrollment/NewShareholderModal.jsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add useRef to react imports if not present, and declare state
const importLine = "import React, { useState, useEffect } from 'react';";
const newImportLine = "import React, { useState, useEffect, useRef, useMemo } from 'react';";
if (content.includes(importLine)) {
  content = content.replace(importLine, newImportLine);
}

// 2. Add showPlaceDropdown state and placeDropdownRef
const stateMarker = "const [villageSuggestions, setVillageSuggestions] = useState([]);";
const newStateBlock = `const [villageSuggestions, setVillageSuggestions] = useState([]);
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
    if (!q) return villageSuggestions.slice(0, 20);
    return villageSuggestions.filter(v => {
      const name = (v.name || '').toLowerCase();
      const taluk = (v.taluk || '').toLowerCase();
      return name.includes(q) || taluk.includes(q);
    });
  }, [formData.place, villageSuggestions]);

  const handleSelectVillage = (v) => {
    const placeName = typeof v === 'string' ? v : v.name;
    const circleRes = ApiService.resolveCircleForPlace(placeName);
    setFormData(prev => ({
      ...prev,
      place: placeName,
      taluk: v.taluk || circleRes?.taluk || prev.taluk,
      dist: v.district || circleRes?.district || prev.dist
    }));
    setShowPlaceDropdown(false);
  };`;

if (content.includes(stateMarker)) {
  content = content.replace(stateMarker, newStateBlock);
}

// 3. Replace the Place / Village input JSX
const oldPlaceJsx = `                  {/* Place / Village (with Suggestions) */}
                  <div className="relative">
                    <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Place (ಸ್ಥಳ / ಗ್ರಾಮ) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.place}
                      onChange={(e) => handlePlaceChange(e.target.value)}
                      placeholder="ಗ್ರಾಮದ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    />
                    {villageSuggestions.length > 0 && formData.place.trim() && (
                      <datalist id="village-list">
                        {villageSuggestions.map((v, i) => (
                          <option key={i} value={v.name} />
                        ))}
                      </datalist>
                    )}
                  </div>`;

const newPlaceJsx = `                  {/* Place / Village (with Rich Interactive Suggestions while typing) */}
                  <div className="relative" ref={placeDropdownRef}>
                    <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Place (ಸ್ಥಳ / ಗ್ರಾಮ) *
                      </span>
                      {formData.place && (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          {ApiService.resolveCircleForPlace(formData.place)?.circle_name || ''}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      list="village-list"
                      autoComplete="off"
                      value={formData.place}
                      onFocus={() => setShowPlaceDropdown(true)}
                      onChange={(e) => {
                        handlePlaceChange(e.target.value);
                        setShowPlaceDropdown(true);
                      }}
                      placeholder="ಗ್ರಾಮದ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-slate-100 outline-none transition-all placeholder:text-slate-500"
                    />

                    {/* Datalist fallback */}
                    <datalist id="village-list">
                      {villageSuggestions.map((v, i) => (
                        <option key={i} value={v.name} />
                      ))}
                    </datalist>

                    {/* Rich Dropdown Suggestions while typing */}
                    {showPlaceDropdown && filteredVillages.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 py-1 divide-y divide-slate-800/60 animate-fadeIn">
                        <div className="px-3 py-1.5 text-[10px] text-slate-400 font-bold bg-slate-950/80 sticky top-0 flex items-center justify-between">
                          <span>ಸೂಚಿಸಿದ ಗ್ರಾಮಗಳು ({filteredVillages.length})</span>
                          <span className="text-[9px] text-slate-500">ಕ್ಲಿಕ್ ಮಾಡಿ ಆಯ್ಕೆಮಾಡಿ</span>
                        </div>
                        {filteredVillages.slice(0, 30).map((v, i) => {
                          const vName = v.name || v;
                          const taluk = v.taluk || '';
                          const circleRes = ApiService.resolveCircleForPlace(vName);
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
                              {circleRes?.circle_name && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 group-hover:bg-emerald-900/50 text-slate-300 group-hover:text-emerald-200 font-mono">
                                  {circleRes.circle_name}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>`;

if (content.includes(oldPlaceJsx)) {
  content = content.replace(oldPlaceJsx, newPlaceJsx);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] NewShareholderModal.jsx updated successfully with place autocomplete while typing');
} else {
  console.error('[FAIL] NewShareholderModal.jsx place JSX target not found');
  process.exit(1);
}

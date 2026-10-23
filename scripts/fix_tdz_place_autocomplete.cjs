const fs = require('fs');
const path = require('path');

// 1. Fix NewShareholderModal.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Enrollment/NewShareholderModal.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  // Find and remove the misplaced block before formData
  const misplacedBlock = `  const [villageSuggestions, setVillageSuggestions] = useState([]);
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

  const cleanTopBlock = `  const [villageSuggestions, setVillageSuggestions] = useState([]);
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
  }, []);`;

  if (content.includes(misplacedBlock)) {
    content = content.replace(misplacedBlock, cleanTopBlock);
  }

  // Insert filteredVillages and handleSelectVillage after handlePlaceChange
  const afterPlaceChangeMarker = `    if (val.trim().length >= 2) {
      const circleRes = ApiService.resolveCircleForPlace(val);
      if (circleRes && circleRes.circle_name !== 'ಇತರೆ (Other)') {
        setFormData(prev => ({
          ...prev,
          place: val,
          taluk: circleRes.taluk || prev.taluk,
          dist: circleRes.district || prev.dist
        }));
      }
    }
  };`;

  const addition = `    if (val.trim().length >= 2) {
      const circleRes = ApiService.resolveCircleForPlace(val);
      if (circleRes && circleRes.circle_name !== 'ಇತರೆ (Other)') {
        setFormData(prev => ({
          ...prev,
          place: val,
          taluk: circleRes.taluk || prev.taluk,
          dist: circleRes.district || prev.dist
        }));
      }
    }
  };

  const filteredVillages = useMemo(() => {
    const q = (formData?.place || '').trim().toLowerCase();
    if (!q) return villageSuggestions.slice(0, 20);
    return villageSuggestions.filter(v => {
      const name = (v.name || '').toLowerCase();
      const taluk = (v.taluk || '').toLowerCase();
      return name.includes(q) || taluk.includes(q);
    });
  }, [formData?.place, villageSuggestions]);

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

  if (content.includes(afterPlaceChangeMarker)) {
    content = content.replace(afterPlaceChangeMarker, addition);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[PASS] NewShareholderModal.jsx TDZ issue resolved');
  } else {
    console.error('[FAIL] NewShareholderModal.jsx afterPlaceChangeMarker not found');
  }
}

// 2. Fix ShareholderForm.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Shareholders/ShareholderForm.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  const misplacedBlock = `  const [villages, setVillages] = useState([]);
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

  const cleanTopBlock = `  const [villages, setVillages] = useState([]);
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
  }, []);`;

  if (content.includes(misplacedBlock)) {
    content = content.replace(misplacedBlock, cleanTopBlock);
  }

  // Insert filteredVillages and handleSelectVillage after handlePlaceChange
  const afterPlaceChangeMarker = `    setFormData(prev => ({
      ...prev,
      place: placeName,
      taluk: (circleInfo?.taluk) || (matchedV ? matchedV.taluk : prev.taluk),
      circle: (circleInfo?.circle_name && circleInfo.circle_name !== 'ಇತರೆ (Other)') ? circleInfo.circle_name : (matchedV ? matchedV.circle_name : prev.circle),
      pin_code: (circleInfo?.pincode) || (matchedV ? matchedV.pin_code : prev.pin_code),
      district: (circleInfo?.district) || prev.district
    }));
  };`;

  const addition = `    setFormData(prev => ({
      ...prev,
      place: placeName,
      taluk: (circleInfo?.taluk) || (matchedV ? matchedV.taluk : prev.taluk),
      circle: (circleInfo?.circle_name && circleInfo.circle_name !== 'ಇತರೆ (Other)') ? circleInfo.circle_name : (matchedV ? matchedV.circle_name : prev.circle),
      pin_code: (circleInfo?.pincode) || (matchedV ? matchedV.pin_code : prev.pin_code),
      district: (circleInfo?.district) || prev.district
    }));
  };

  const filteredVillages = useMemo(() => {
    const q = (formData?.place || '').trim().toLowerCase();
    if (!q) return villages.slice(0, 20);
    return villages.filter(v => {
      const name = (v.name || '').toLowerCase();
      const taluk = (v.taluk || '').toLowerCase();
      return name.includes(q) || taluk.includes(q);
    });
  }, [formData?.place, villages]);

  const handleSelectVillage = (v) => {
    const placeName = typeof v === 'string' ? v : v.name;
    handlePlaceChange(placeName);
    setShowPlaceDropdown(false);
  };`;

  if (content.includes(afterPlaceChangeMarker)) {
    content = content.replace(afterPlaceChangeMarker, addition);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[PASS] ShareholderForm.jsx TDZ issue resolved');
  } else {
    console.error('[FAIL] ShareholderForm.jsx afterPlaceChangeMarker not found');
  }
}

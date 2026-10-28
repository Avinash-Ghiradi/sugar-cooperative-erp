const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../client/src/components/Vargavane/VargavanePrintModal.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Change activeTab default
content = content.replace(
  "const [activeTab, setActiveTab] = useState('all'); // 'all', 'p1'...'p5'",
  "const [activeTab, setActiveTab] = useState('all'); // 'all', 'p1'...'p10'"
);

// Define Page 6 to Page 10 functions
const pages6to10 = `  // =========================================================================
  // PAGE 6: ID Card & Dual Specimen Signatures (Cane Development Officer Endorsement)
  // =========================================================================
  const renderPage6 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {/* Top Header Row with Highlight Badges */}
        <div className="flex justify-between items-center mb-1">
          <div className="border border-black bg-lime-300 px-3 py-0.5 text-xs font-bold font-mono text-black">
            From ID No: {transferorAadhaar || shareNo}
          </div>
          <div className="border border-black bg-lime-300 px-3 py-0.5 text-xs font-bold font-mono text-black">
            Transfer - {transferId}
          </div>
        </div>

        {/* Centered Factory Name */}
        <div className="text-center text-sm font-bold text-green-950 font-serif my-1">
          ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ, ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪುರ
        </div>
        <div className="border-b-[2px] border-black mb-4"></div>

        {/* Top Grid: Account No, Signatures and Photo */}
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="flex-1 space-y-4">
            <div className="text-xs font-bold">
              ಕಾರ್ಖಾನೆಯ “<strong>{cleanCategory}</strong>” / “ಡ” ವರ್ಗದ ಶೇರು ಸದಸ್ಯರ ಖಾತೆ ನಂ: <span className="font-mono underline underline-offset-4 font-bold text-sm">#{shareNo}</span>
            </div>

            {/* Specimen Signature 1 */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold whitespace-nowrap">ಸದಸ್ಯರ ಮಾದರಿ ಸಹಿ 1)</span>
              <div className="border-[1.5px] border-black rounded-sm h-16 w-72 bg-white flex items-end justify-center pb-1 text-[10px] text-slate-400">
                (ಮಾದರಿ ಸಹಿ - 1)
              </div>
            </div>

            {/* Specimen Signature 2 */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold whitespace-nowrap pl-14">2)</span>
              <div className="border-[1.5px] border-black rounded-sm h-16 w-72 bg-white flex items-end justify-center pb-1 text-[10px] text-slate-400">
                (ಮಾದರಿ ಸಹಿ - 2)
              </div>
            </div>
          </div>

          {/* Right: Transferee Photo Frame */}
          <div className="border-[2px] border-black rounded-2xl w-32 h-40 flex flex-col items-center justify-center overflow-hidden bg-slate-50 text-center p-1 shadow-sm shrink-0">
            {transfereePhoto ? (
              <img src={transfereePhoto} alt="Transferee" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-slate-400">
                <div className="w-10 h-10 rounded-full border border-dashed border-slate-400 flex items-center justify-center mb-1 text-slate-500 font-bold">
                  Photo
                </div>
                <span className="text-[9.5px] font-bold text-slate-600 leading-tight">
                  ಭಾವಚಿತ್ರ ಅಂಟಿಸಿ<br />(Passport Photo)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Resolution & Certificate Issue Endorsement */}
        <div className="text-[12px] leading-[1.85] text-justify text-black mt-6 px-1">
          <p className="indent-6">
            ಶ್ರೀ <strong className="underline underline-offset-2">{transfereeName}</strong> ಸಾ: <strong className="underline underline-offset-2">{transfereePlace}</strong> ತಾಲೂಕ: <strong className="underline underline-offset-2">{transfereeTaluk}</strong> ಜಿಲ್ಲಾ: <strong className="underline underline-offset-2">{transfereeDistrict}</strong> ಇವರ ಅರ್ಜಿ ಮೇಲಿರುವ ಸಹಿ ಹಾಗೂ ಮಾದರಿಯ ಸಹಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ದಿನಾಂಕ:- <span className="underline underline-offset-2 font-mono font-bold">{receiptDate || applicationDate}</span> ರಂದು ಜರುಗಿದ ಕಾರ್ಖಾನೆಯ ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯ ಠರಾವು ನಂ:- <span className="underline underline-offset-2 font-mono font-bold">{receiptNo || '816'}</span> ರನ್ವಯ ಸದರಿಯವರ ನಾಮಿನಲ್ ಸದಸ್ಯತ್ವಕ್ಕೆ ಅನುಮತಿಸಿದ್ದು, ಹಾಗೂ ದಿನಾಂಕ:- <span className="underline underline-offset-2 font-mono font-bold">{receiptDate || applicationDate}</span> ರಂದು ಜರುಗಿದ ಕಾರ್ಖಾನೆಯ ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯ ಠರಾವು ನಂ:- <span className="underline underline-offset-2 font-mono font-bold">{receiptNo || '816'}</span> ರ ಪ್ರಕಾರ ವರ್ಗಾವಣೆ ಮಾಡಲು ನಿರ್ಣಯಿಸಿದ್ದರನ್ವಯ, ಸದರಿಯವರಿಗೆ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್(Certificate) ಹಾಗೂ ಗುರುತಿನ ಕಾರ್ಡ(ID card) ವಿತರಿಸಲಾಗಿದೆ.
          </p>
        </div>

        {/* Bottom Signatures */}
        <div className="flex justify-between items-end pt-16 px-2 text-xs font-bold text-black">
          <div>
            ದಿನಾಂಕ: <span className="font-mono">{receiptDate || applicationDate}</span>
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-black pt-1">ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">6</div>
    </div>
  );

  // =========================================================================
  // PAGE 7: No Dues Request Letter to Managing Director & Cane Accountant Clearance
  // =========================================================================
  const renderPage7 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {/* Recipient Header */}
        <div className="text-xs leading-relaxed font-bold mb-4">
          <div>ಗೆ,</div>
          <div>ಮೆ: ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
          <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</div>
          <div>ಮರಗೂರ, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ</div>
        </div>

        {/* Subject */}
        <div className="text-xs font-bold mb-2">ಮಾನ್ಯರೇ,</div>
        <div className="text-xs font-bold text-center my-3 underline decoration-black underline-offset-4 tracking-wide">
          ವಿಷಯ:- “ನನ್ನ ಹೆಸರಿನಲ್ಲಿ ಯಾವುದೇ ತರಹದ ಬಾಕಿ ಇದ್ದ ಬಗ್ಗೆ ವಿವರ ನೀಡುವ ಕುರಿತು.”
        </div>

        {/* Body Paragraphs */}
        <div className="text-[12px] leading-[1.85] text-justify space-y-3 mb-6">
          <p className="indent-6">
            ಮೇಲ್ಕಾಣಿಸಿದ ವಿಷಯದನ್ವಯ, ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದ ನಾನು ಶ್ರೀ <strong className="underline underline-offset-2">{transferorName}</strong> ಸಾ: <strong className="underline underline-offset-2">{transferorPlace}</strong> ತಾಲೂಕ: <strong className="underline underline-offset-2">{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong className="underline underline-offset-2">{transferorDistrict}</strong> ಈ ಮೂಲಕ ತಮ್ಮಲ್ಲಿ ವಿನಂತಿಸಿಕೊಳ್ಳುವುದೇನೆಂದರೆ-
          </p>
          <p className="indent-6">
            ನಾನು ತಮ್ಮ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ‘<strong>{cleanCategory}</strong>’ ವರ್ಗದ ಶೇರು ಸದಸ್ಯತ್ವ ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ:- <strong className="font-mono font-bold underline underline-offset-2">#{shareNo}</strong> ಇರುತ್ತದೆ. ಈಗ ನನ್ನ ಕೌಟುಂಬಿಕ ಅಡಚಣೆ ಸಲುವಾಗಿ ಸದರ ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಯಾವುದೇ ಒತ್ತಾಯವಿಲ್ಲದೇ ವಾರಸುದಾರರ ಒಪ್ಪಿಗೆಯೊಂದಿಗೆ ವರ್ಗಾವಣೆ(ಮಾರಾಟ) ಮಾಡಲು ಅರ್ಜಿ ಸಲ್ಲಿಸಿರುತ್ತೇನೆ.
          </p>
          <p className="indent-6">
            ಕಾರಣ, ತಮ್ಮ ಸಂಸ್ಥೆ ಹಾಗು ಇತರೇ ಅಂಗ ಸಂಸ್ಥೆಗಳಲ್ಲಿ ನನ್ನಿಂದ ಯಾವುದೇ ತರಹದ ಬಾಕಿ ಇದ್ದ ಬಗ್ಗೆ ವಿವರ ನೀಡಬೇಕೆಂದು ಮೆ:ರವರಲ್ಲಿ ಈ ಮೂಲಕ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
          </p>
        </div>

        {/* Closing & Signature */}
        <div className="flex justify-between items-start text-xs pt-2 mb-6">
          <div>ವಂದನೆಗಳೊಂದಿಗೆ,</div>
          <div className="text-center font-bold space-y-6">
            <div>ತಮ್ಮ ವಿಶ್ವಾಸಿ,</div>
            <div>
              ( <span className="underline underline-offset-2">{transferorName}</span> )<br />
              <span className="text-[11px] font-normal">ಮೂಲ ಶೇರುದಾರರ ಸಹಿ</span>
            </div>
          </div>
        </div>

        {/* Dotted Divider */}
        <div className="border-t border-dashed border-black my-4"></div>

        {/* Section 1: Cane Accountant Dues Report */}
        <div className="space-y-4 pt-1">
          <div className="text-xs font-bold">1) ಕಬ್ಬು ಲೇಖಪಾಲರ ವರದಿ :</div>
          <div className="text-xs leading-loose pl-4">
            ಸದರಿಯವರಿಂದ ಬಾಕಿ ರೂ. <strong className="font-mono underline underline-offset-4 px-3">0.00 (ಬಾಕಿ ಇರುವುದಿಲ್ಲ - Nil)</strong> ಗಳಷ್ಟು ಇರುತ್ತದೆ / ಇರುವುದಿಲ್ಲ.
          </div>
          <div className="flex justify-end pt-8 text-xs font-bold">
            <div className="text-center w-36 border-t border-black pt-1">ಕಬ್ಬು ಲೇಖಪಾಲರು</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">7</div>
    </div>
  );

  // =========================================================================
  // PAGE 8: Member Identity Card Application Form & Govt ID Checklist
  // =========================================================================
  const renderPage8 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {/* Top Header */}
        <div className="text-center text-sm font-bold pb-1 text-green-950 font-serif">
          ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ, ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪುರ
        </div>
        <div className="border-b-[2px] border-black mb-2"></div>

        {/* Title Box */}
        <div className="border-[2px] border-black p-1 text-center bg-white my-2 shadow-sm">
          <div className="border border-black py-1 px-4 font-bold text-xs tracking-wide text-black inline-block">
            -:: ಸದಸ್ಯರು ಗುರುತಿನ ಚೀಟಿ ಪಡೆಯಲು ತುಂಬುವ ಅರ್ಜಿ ನಮೂನೆ ::-
          </div>
        </div>

        {/* Member Details Table */}
        <table className="w-full border-[1.5px] border-black text-[11px] mb-2 font-sans">
          <tbody>
            <tr className="border-b border-black">
              <td className="w-8 p-1.5 border-r border-black font-bold text-center">1</td>
              <td className="w-44 p-1.5 border-r border-black font-bold">ಸದಸ್ಯತ್ವ ‘{cleanCategory}’ ವರ್ಗ</td>
              <td className="p-1.5 font-bold font-mono">ಶೇರು ಖಾತೆ ನಂ: #{shareNo}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-bold text-center">2</td>
              <td className="p-1.5 border-r border-black font-bold">ಸದಸ್ಯರ ಪೂರ್ಣ ಹೆಸರು :</td>
              <td className="p-1.5 font-bold">ಶ್ರೀ/ಶ್ರೀಮತಿ {transfereeName}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-bold text-center align-top">3</td>
              <td className="p-1.5 border-r border-black font-bold align-top">ಖಾಯಂ ವಿಳಾಸ :</td>
              <td className="p-1.5 space-y-1">
                <div className="flex justify-between">
                  <span>ಮುಕ್ಕಾಂ :- <strong>{transfereePlace}</strong></span>
                  <span>ಪೋಷ್ಟ :- <strong>{transfereePlace}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>ತಾಲೂಕು :- <strong>{transfereeTaluk}</strong></span>
                  <span>ತಾಲೂಕು :- <strong>{transfereeTaluk}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>ಜಿಲ್ಲೆ :- <strong>{transfereeDistrict}</strong></span>
                  <span>ಜಿಲ್ಲೆ :- <strong>{transfereeDistrict}</strong></span>
                </div>
                <div className="flex justify-between">
                  <span>ಮೊಬೈಲ್ ನಂಬರ:- <strong className="font-mono">{transfereeMobile || '—'}</strong></span>
                  <span>ಮೊಬೈಲ್ ನಂಬರ:- <strong className="font-mono">{transfereeMobile || '—'}</strong></span>
                </div>
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-bold text-center">4</td>
              <td className="p-1.5 border-r border-black font-bold">ಲಿಂಗ :</td>
              <td className="p-1.5 flex justify-between items-center">
                <span><strong>ಗಂಡು</strong> / ಹೆಣ್ಣು</span>
                <span>ಜನ್ಮ ದಿನಾಂಕ : <span className="font-mono">___/___/____</span></span>
                <span>ವಯಸ್ಸು : <span className="font-mono">____</span></span>
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-bold text-center">5</td>
              <td className="p-1.5 border-r border-black font-bold">ಗುರುತಿನ ಚೀಟಿ ಮಾಡಲು ಕಾರಣ:</td>
              <td className="p-1.5 font-bold">ಶೇರ ವರ್ಗಾವಣೆ ಇರುವದು.</td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-black font-bold text-center">6</td>
              <td className="p-1.5 border-r border-black font-bold">ಮೂಲ ಶೇರ ಸರ್ಟಿಫಿಕೇಟ ಪ್ರತಿ:</td>
              <td className="p-1.5">ಮೂಲ ಶೇರ ಸರ್ಟಿಫಿಕೇಟ ಝರಾಕ್ಸ್ ಪ್ರತಿ ಕಡ್ಡಾಯವಾಗಿ ಲಗತ್ತಿಸುವದು.</td>
            </tr>
          </tbody>
        </table>

        {/* Documents Subtitle */}
        <div className="text-[11px] font-bold text-center my-1.5 leading-snug">
          ಸದಸ್ಯರು ತಮ್ಮ ಹೆಸರಿನ ಹಾಗು ವಿಳಾಸಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಫೋಟೋ ಸಹಿತ ಇರುವ ಈ ಕೆಳಕಾಣಿಸಿದ ಸರ್ಕಾರಿ ಗುರುತಿನ ದಾಖಲೆಗಳ ಪೈಕಿ ಒಂದನ್ನಾದರೂ ಪೂರೈಸತಕ್ಕದ್ದು.
        </div>

        {/* Govt ID Documents Table */}
        <table className="w-full border-[1.5px] border-black text-[10px] text-center mb-2 font-sans">
          <thead>
            <tr className="border-b border-black font-bold bg-slate-100">
              <th className="p-1 border-r border-black w-10">ಅ. ನಂ.</th>
              <th className="p-1 border-r border-black">ಲಗತ್ತಿಸುವ ಸರ್ಕಾರಿ ದಾಖಲೆಗಳ ವಿವರ</th>
              <th className="p-1 border-r border-black w-28">ಕಾರ್ಡ ಸಂಖ್ಯೆ</th>
              <th className="p-1 border-r border-black">ದಾಖಲೆ ವಿತರಿಸಿದ ಅಧಿಕಾರಿ ವಿವರ</th>
              <th className="p-1 w-24">ಮತಕ್ಷೇತ್ರದ ಸ್ಥಳ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-bold">1)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ಚುನಾವಣಾಧಿಕಾರಿಗಳ ಗುರುತಿನ ಚೀಟಿ</td>
              <td className="p-1 border-r border-black font-mono">—</td>
              <td className="p-1 border-r border-black">Electrol Registration Officer</td>
              <td className="p-1">{transfereeTaluk}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-bold">2)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ಆಧಾರ್ ಕಾರ್ಡ</td>
              <td className="p-1 border-r border-black font-mono font-bold">{transfereeAadhaar || '—'}</td>
              <td className="p-1 border-r border-black">Govt. of Inida</td>
              <td className="p-1">Govt. of Inida</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-bold">3)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ಪಡಿತರ ಚೀಟಿ (ರೇಶನ್ ಕಾರ್ಡ)</td>
              <td className="p-1 border-r border-black font-mono">—</td>
              <td className="p-1 border-r border-black">Food & Civil Supplies Dept.</td>
              <td className="p-1">{transfereeTaluk}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-bold">4)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆಯ ಪ್ಯಾನ್ ಕಾರ್ಡ</td>
              <td className="p-1 border-r border-black font-mono">—</td>
              <td className="p-1 border-r border-black">Income Tax Department</td>
              <td className="p-1">—</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-bold">5)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ಪಾಸ್‌ಪೋರ್ಟ</td>
              <td className="p-1 border-r border-black font-mono">—</td>
              <td className="p-1 border-r border-black">Ministry of External Affairs</td>
              <td className="p-1">—</td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black font-bold">6)</td>
              <td className="p-1 border-r border-black text-left font-semibold">ವಾಹನ ಚಾಲನಾ ಪರವಾನಿಗೆ ಪತ್ರ</td>
              <td className="p-1 border-r border-black font-mono">—</td>
              <td className="p-1 border-r border-black">RTO Office</td>
              <td className="p-1">{transfereeDistrict}</td>
            </tr>
          </tbody>
        </table>

        {/* Declaration */}
        <div className="text-[11px] font-bold my-1.5 text-center">
          ಮೇಲ್ಕಾಣಿಸಿದ ಮಾಹಿತಿಗಳು ಹಾಗು ದಾಖಲೆಗಳು ಸತ್ಯ ಮತ್ತು ನೈಜವಾಗಿವೆ ಎಂದು ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸುತ್ತೇನೆ.
        </div>

        {/* Footer Line */}
        <div className="flex justify-between items-end text-xs pt-3 pb-2 font-bold">
          <div>
            <div>ಸ್ಥಳ :- {transfereePlace}</div>
            <div>ದಿನಾಂಕ: {receiptDate || applicationDate}</div>
          </div>
          <div className="text-center">
            <div className="w-36 border-t border-black pt-1">ಸದಸ್ಯರ ಸಹಿ</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-[9.5px] space-y-0.5 border-t border-black pt-1 leading-snug">
          <div><strong>ಸೂಚನೆ:-</strong> 1) ಹೆಸರು ಮತ್ತು ವಿಳಾಸದ ಸಮಂಜಸ ದಾಖಲೆಗಳ ಝರಾಕ್ಸ್ ಪ್ರತಿಗಳನ್ನು ಹಾಜರಪಡಿಸಬೇಕು.</div>
          <div>2) ಸದಸ್ಯರು ಹೆಬ್ಬೆಟ್ಟಿನ ಸಹಿ ಇದ್ದವರಿಗೆ ಕಾರ್ಖಾನೆಯ ಒಬ್ಬ ಸದಸ್ಯರಿಂದ ದೃಢೀಕರಣ ಪಡೆಯತಕ್ಕದ್ದು, ಅವರ ಹೆಸರು ಖಾತೆ ನಮೂದಿಸತಕ್ಕದ್ದು.</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">8</div>
    </div>
  );

  // =========================================================================
  // PAGE 9: Office Order to Field Assistant for Spot Inquiry (ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ಆದೇಶ)
  // =========================================================================
  const renderPage9 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {/* Top Right Department Badge */}
        <div className="flex justify-end mb-1">
          <div className="border border-black px-3 py-0.5 text-xs font-bold bg-white">
            ಶೇರು ವಿಭಾಗ
          </div>
        </div>

        {/* Centered Factory Name */}
        <div className="text-center text-sm font-bold pb-1 text-green-950 font-serif">
          ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ, ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪುರ
        </div>
        <div className="border-b-[2px] border-black mb-2"></div>

        {/* Reference Number & Date Row */}
        <div className="flex justify-between items-center text-[11px] font-bold mb-3">
          <span>
            ನಂ:ಸಂ.ದಿ.ಸ.ಕ.ನಿ/ಶೇರು ವರ್ಗಾವಣೆ/ಕುಟುಂಬ ಸದಸ್ಯರ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ/ <strong className="font-mono">{receiptNo || '816'}</strong> /2020-21
          </span>
          <span>
            ದಿನಾಂಕ:- <strong className="font-mono">{receiptDate || applicationDate}</strong>
          </span>
        </div>

        {/* Box Title */}
        <div className="border-[2px] border-black p-1 text-center bg-white my-2 shadow-sm">
          <div className="border border-black py-1 px-8 font-bold text-xs tracking-wide text-black inline-block">
            -:: ಕಛೇರಿ ಟಿಪ್ಪಣೆ ::-
          </div>
        </div>

        {/* Body Paragraph 1 */}
        <div className="text-[12px] leading-[1.85] text-justify space-y-4 mb-8">
          <p className="indent-6">
            ಕಾರ್ಖಾನೆಯ ‘<strong>{cleanCategory}</strong>’ವರ್ಗದ ಸದಸ್ಯರಾದ <strong>ಶ್ರೀ {transferorName}</strong> ಸಾ: <strong>{transferorPlace}</strong> ತಾಲೂಕ: <strong>{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transferorDistrict}</strong> ಇವರು <strong>{noOfShares}</strong> ಮೂಲ ಶೇರನ್ನು ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ:- <strong className="font-mono">#{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ತಮ್ಮ ಕೌಟುಂಬಿಕ ಅಡಚಣೆ ಸಲುವಾಗಿ ತಮ್ಮ ಶೇರನ್ನು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ವರ್ಗಾವಣೆ ಮಾಡಲು ಇಚ್ಛಿಸಿ, ಕಾರ್ಖಾನೆಯ ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಗ್ರಾಮದ ಖಾಯಂ ರಹವಾಸಿಯಾದ ಹಾಗು ಕಬ್ಬು ಬೆಳೆಗಾರರಾದ <strong>ಶ್ರೀ {transfereeName}</strong> ಸಾ: <strong>{transfereePlace}</strong> ತಾಲೂಕ: <strong>{transfereeTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transfereeDistrict}</strong> ಇವರಿಗೆ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಲು ತಮ್ಮ ಅರ್ಜಿ ದಿನಾಂಕ: <strong className="font-mono">{applicationDate}</strong> ರನ್ವಯ ವಿನಂತಿಸಿಕೊಂಡಿರುತ್ತಾರೆ.
          </p>
          <p className="indent-6">
            ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು(ಕೊಡುವವರು) <strong>ಶ್ರೀ {transferorName}</strong> ಸಾ: <strong>{transferorPlace}</strong> ತಾಲೂಕ: <strong>{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transferorDistrict}</strong> ಇವರು ಸಲ್ಲಿಸಿದ ಅರ್ಜಿ ಹಾಗು ಕಾಗದ ಪತ್ರಗಳೊಂದಿಗೆ ಸ್ವಗ್ರಾಮಕ್ಕೆ ಖುದ್ದಾಗಿ ಹೋಗಿ ಕೂಲಂಕೋಷವಾಗಿ ಪರಿಶೀಲಿಸಿ, ಶೇರು ವರ್ಗಾವಣೆಗೆ(ಮಾರಾಟ) ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರು ಸಂಪೂರ್ಣ ಒಪ್ಪಿಗೆ ಇರುವ ಬಗ್ಗೆ ಸಹಿ ಹಾಗು ಎಡಗೈ ಹೆಬ್ಬೆಟ್ಟಿನ ಗುರುತು(ಥಂಬ) ಪಡೆದುಕೊಂಡು ಸಾಕ್ಷಿದಾರರ ಸಮಕ್ಷಮ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ಮಾಡಿ, ತಮ್ಮ ವರದಿಯನ್ನು ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ ರವರ ಶರಾಡೊಂದಿಗೆ ಶೇರ ವಿಭಾಗಕ್ಕೆ ಪೂರೈಸಲು ಈ ಮೂಲಕ ಆದೇಶಿಸಲಾಗಿದೆ.
          </p>
        </div>

        {/* MD Signature */}
        <div className="flex justify-end pt-6 mb-8 text-xs font-bold">
          <div className="text-center w-40 border-t border-black pt-1">
            ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು
          </div>
        </div>

        {/* Field Assistant Dispatch Block */}
        <div className="text-xs leading-relaxed font-bold border-t border-slate-300 pt-3">
          <div>ಗೆ,</div>
          <div>ಶ್ರೀ ___________________________</div>
          <div>ಕ್ಷೇತ್ರ ಸಹಾಯಕರು</div>
          <div>___________________________ ಗ್ರಾಮಗಳು</div>
          <div className="pt-1 font-semibold text-[11px] text-slate-700">
            ತಮ್ಮ ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ವರದಿಯೊಂದಿಗೆ ಸಲ್ಲಿಸುವದು.
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">9</div>
    </div>
  );

  // =========================================================================
  // PAGE 10: SCHEDULE-‘A’ Form of Agreement by Producer Member
  // =========================================================================
  const renderPage10 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-serif box-border relative shadow-lg">
      <div>
        {/* Top Header */}
        <div className="text-center font-bold text-sm tracking-wide text-black uppercase pb-1">
          BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT, MARAGUR Dist || VIJAYAPUR
        </div>
        <div className="border-b-[2px] border-black mb-3"></div>

        {/* Schedule Box Title */}
        <div className="border-[2px] border-black p-0.5 text-center bg-white my-2 w-max mx-auto shadow-sm">
          <div className="border border-black py-1 px-8 font-bold text-sm tracking-wider text-black">
            SCHEDULE-‘A’
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center font-bold text-[11px] leading-snug px-4 mb-3 font-sans">
          Form of agreement to be executed by a producer member of Co-operative sugar Factory for retention and non alienation and charging of lands owned by him in the area of operation of the factory.
        </div>

        {/* Opening Agreement Paragraphs */}
        <div className="text-[10.5px] leading-[1.65] text-justify space-y-2 mb-3 font-sans">
          <p className="indent-6">
            And agreement made on this <strong className="underline underline-offset-2">{receiptDate || applicationDate}</strong> day between Shri/ Smt:- <strong className="underline underline-offset-2">{transfereeName}</strong> At:- <strong className="underline underline-offset-2">{transfereePlace}</strong> (here in after called the producer member which expression shall be deemed to include his/ her executors and assings) of the one part and The Bhimashankar Sahakari Sakkare Karkhane Niyamit, Maragur Taluk Chadachan Dist:- Vijayapur a Co-operative Society registered under section 7(1) of the Karnataka Co-operative Societies Act 1959 & having its Registered office at Maragur Taluk Chadachan Dist:- Vijayapur (herein after called the factory with expression shall include its assigns) on the other part.
          </p>
          <p className="indent-6">
            Where as the producer member is the owner of the land described in the schedule here to attached where as he/she is a member of the factory & the factory has allotted him/her <strong className="underline underline-offset-2">{noOfShares}</strong> ‘{cleanCategory}’ Class shares of the face value of Rs.2000/- each and where as the said producer member has agreed to be governed by the bye-laws of the factory.
          </p>
        </div>

        {/* Numbered Terms and Conditions */}
        <div className="text-[10px] leading-[1.6] space-y-1.5 mb-3 font-sans">
          <div className="font-bold">Now this agreement witness the are follows :-</div>
          <p>
            <strong>1.</strong> The producer member shall & will during the subsistence of this agreement at his own cost charges & expenses keep and maintain the said land in cultivable condition and shall supply sugar cane grown by him/ her to the factory in the manner prescribed in the bye-law No.6(A)
          </p>
          <p>
            <strong>2.</strong> That the producer member during the subsistence of this agreement shall and will retain his/ her own name & tital shall & will not alienate or create any charge or interest in the said lands specified below except such charges or interest in favour of any Co-operative society or of Government which he/ she may have created thereafter for securing finances for purpose of cultivation or improvements of the said land Neither shall be / she alienate the said lands in any other manner.
          </p>
          <p>
            <strong>3.</strong> That the provided for in the Bye laws of the factory the producer member in the even of his/ her committing any breach in due observance of this agreement at any time during the subsistence of this agreement will be liable to.
          </p>
          <div className="pl-4 space-y-0.5">
            <div><strong>a)</strong> Immediate cessation of all his/ her rights an previleges as the member including more specifically the rights or previlege of tendering to the factory sugar cane grown by him/ her.</div>
            <div><strong>b)</strong> Forfeiture of share held by him/ her in the society.</div>
            <div><strong>c)</strong> Expulsion from membership of the society and</div>
            <div><strong>d)</strong> Payment of penalty as may be decided by the Board.</div>
          </div>
        </div>

        {/* Execution Witness Block */}
        <div className="text-[10px] leading-relaxed text-justify mb-4 font-sans">
          In Witness where of the producer member has set his/ her hand and the common seal of the factory has been here to affixed and two members of the Board of Directors and the Managing Director of the factory have herewith set hands on the date aforementioned.
        </div>

        {/* Execution Signatures */}
        <div className="flex justify-between items-end pt-4 text-xs font-bold font-sans">
          <div className="text-center w-36 border-t border-black pt-1">Board of Directors</div>
          <div className="text-center w-40 border-t border-black pt-1">Managing Director</div>
          <div className="text-center w-40 border-t border-black pt-1">Producer Member Signature</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">10</div>
    </div>
  );
`;

// Insert pages 6 to 10 right after renderPage5
content = content.replace(
  '      <div className="text-right text-xs font-bold text-black pt-2">5</div>\n    </div>\n  );',
  '      <div className="text-right text-xs font-bold text-black pt-2">5</div>\n    </div>\n  );\n\n' + pages6to10
);

// Update title, subtitle, tabs, preview area and portal to 10 pages
content = content.replace(
  '<span>ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ (Vargavane 5-Page Complete Bundle)</span>',
  '<span>ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ (Vargavane 10-Page Complete Bundle)</span>'
);

content = content.replace(
  'ಕಾನೂನುಬದ್ಧ 5 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಪತ್ರಗಳು (A4 Format)',
  'ಕಾನೂನುಬದ್ಧ 10 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಪತ್ರಗಳು (A4 Format)'
);

content = content.replace(
  "{activeTab === 'all' ? 'ಎಲ್ಲಾ 5 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)",
  "{activeTab === 'all' ? 'ಎಲ್ಲಾ 10 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)"
);
// replace second occurrence too
content = content.replace(
  "{activeTab === 'all' ? 'ಎಲ್ಲಾ 5 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)",
  "{activeTab === 'all' ? 'ಎಲ್ಲಾ 10 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)"
);

// Update Tab Buttons
const oldTabsTarget = `<button
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
            </button>`;

const newTabs = `<button
              type="button"
              onClick={() => setActiveTab('all')}
              className={\`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'all'
                  ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              <Layers className="w-3.5 h-3.5" /> ಎಲ್ಲಾ 10 ಪುಟಗಳು (All 10 Pages)
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
            <button
              type="button"
              onClick={() => setActiveTab('p6')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p6' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 6: ID ಕಾರ್ಡ್ & ಸಹಿ ಪರಿಶೀಲನೆ (CDO)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p7')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p7' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 7: ಬಾಕಿ ರಹಿತ ವರದಿ ಅರ್ಜಿ (No Dues)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p8')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p8' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 8: ಗುರುತಿನ ಚೀಟಿ ಅರ್ಜಿ (ID Form)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p9')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p9' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 9: ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ಕಛೇರಿ ಆದೇಶ (Office Order)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p10')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p10' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 10: Schedule ‘A’ (Agreement)
            </button>`;

content = content.replace(oldTabsTarget, newTabs);

// Update Preview Area to render all 10 pages or individual
const oldPreviewTarget = `{activeTab === 'all' ? (
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
            )}`;

const newPreview = `{activeTab === 'all' ? (
              <div className="space-y-6 w-full max-w-[790px]">
                {renderPage1()}
                {renderPage2()}
                {renderPage3()}
                {renderPage4()}
                {renderPage5()}
                {renderPage6()}
                {renderPage7()}
                {renderPage8()}
                {renderPage9()}
                {renderPage10()}
              </div>
            ) : activeTab === 'p1' ? (
              <div className="w-full max-w-[790px]">{renderPage1()}</div>
            ) : activeTab === 'p2' ? (
              <div className="w-full max-w-[790px]">{renderPage2()}</div>
            ) : activeTab === 'p3' ? (
              <div className="w-full max-w-[790px]">{renderPage3()}</div>
            ) : activeTab === 'p4' ? (
              <div className="w-full max-w-[790px]">{renderPage4()}</div>
            ) : activeTab === 'p5' ? (
              <div className="w-full max-w-[790px]">{renderPage5()}</div>
            ) : activeTab === 'p6' ? (
              <div className="w-full max-w-[790px]">{renderPage6()}</div>
            ) : activeTab === 'p7' ? (
              <div className="w-full max-w-[790px]">{renderPage7()}</div>
            ) : activeTab === 'p8' ? (
              <div className="w-full max-w-[790px]">{renderPage8()}</div>
            ) : activeTab === 'p9' ? (
              <div className="w-full max-w-[790px]">{renderPage9()}</div>
            ) : (
              <div className="w-full max-w-[790px]">{renderPage10()}</div>
            )}`;

content = content.replace(oldPreviewTarget, newPreview);

// Update Portal rendering to 10 pages
const oldPortalTarget = `{activeTab === 'all' ? (
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
          )}`;

const newPortal = `{activeTab === 'all' ? (
            <>
              {renderPage1()}
              {renderPage2()}
              {renderPage3()}
              {renderPage4()}
              {renderPage5()}
              {renderPage6()}
              {renderPage7()}
              {renderPage8()}
              {renderPage9()}
              {renderPage10()}
            </>
          ) : activeTab === 'p1' ? (
            renderPage1()
          ) : activeTab === 'p2' ? (
            renderPage2()
          ) : activeTab === 'p3' ? (
            renderPage3()
          ) : activeTab === 'p4' ? (
            renderPage4()
          ) : activeTab === 'p5' ? (
            renderPage5()
          ) : activeTab === 'p6' ? (
            renderPage6()
          ) : activeTab === 'p7' ? (
            renderPage7()
          ) : activeTab === 'p8' ? (
            renderPage8()
          ) : activeTab === 'p9' ? (
            renderPage9()
          ) : (
            renderPage10()
          )}`;

content = content.replace(oldPortalTarget, newPortal);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated VargavanePrintModal.jsx with Pages 6 to 10');

// Update tooltip in VargavaneTransferModal.jsx and VargavaneTransferModule.jsx
const transferModalPath = path.resolve(__dirname, '../client/src/components/Vargavane/VargavaneTransferModal.jsx');
let tmContent = fs.readFileSync(transferModalPath, 'utf8');
tmContent = tmContent.replace(
  'title="5 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ಪ್ರಿವ್ಯೂ (5-Page Print Dossier Preview)"',
  'title="10 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ಪ್ರಿವ್ಯೂ (10-Page Print Dossier Preview)"'
);
fs.writeFileSync(transferModalPath, tmContent, 'utf8');
console.log('Updated VargavaneTransferModal.jsx preview tooltip');

const transferModulePath = path.resolve(__dirname, '../client/src/components/Vargavane/VargavaneTransferModule.jsx');
let tmodContent = fs.readFileSync(transferModulePath, 'utf8');
tmodContent = tmodContent.replace(
  'title="ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ ಮುದ್ರಣ (Vargavane 5-Page Complete Bundle Print)"',
  'title="ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ ಮುದ್ರಣ (Vargavane 10-Page Complete Bundle Print)"'
);
fs.writeFileSync(transferModulePath, tmodContent, 'utf8');
console.log('Updated VargavaneTransferModule.jsx printer tooltip');

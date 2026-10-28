const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../client/src/components/Vargavane/VargavanePrintModal.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// Update activeTab default comment
content = content.replace(
  "const [activeTab, setActiveTab] = useState('all'); // 'all', 'p1'...'p10'",
  "const [activeTab, setActiveTab] = useState('all'); // 'all', 'p1'...'p14'"
);

// Define Page 11 to Page 14 functions
const pages11to14 = `  // =========================================================================
  // PAGE 11: ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು (ಶೇರು ಮಾರಾಟಗಾರರ ಅಧಿಕೃತ ಅರ್ಜಿ)
  // =========================================================================
  const renderPage11 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {/* Top Header Row with Photo Frame */}
        <div className="flex justify-between items-start mb-2">
          {/* Title Box */}
          <div className="flex-1 text-center pr-2">
            <div className="border-[2px] border-black p-0.5 text-center bg-white my-1 inline-block shadow-sm">
              <div className="border border-black py-1 px-8 font-bold text-sm tracking-wide text-black leading-tight">
                <div>ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು</div>
                <div className="text-xs font-semibold">ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ವರ್ಗಾವಣೆ ಮಾಡುವ ಅರ್ಜಿ</div>
              </div>
            </div>
          </div>

          {/* Transferor Photo Frame */}
          <div className="border-[1.5px] border-black w-28 h-36 flex flex-col items-center justify-center p-1 text-center bg-slate-50 shrink-0">
            {transferorPhoto ? (
              <img src={transferorPhoto} alt="Transferor" className="w-full h-full object-cover rounded" />
            ) : (
              <div className="text-[10px] font-bold text-slate-600 leading-tight">
                ಶೇರು ಮಾರಾಟಗಾರರ<br />ಫೋಟೋ ಅಂಟಿಸುವುದು
              </div>
            )}
          </div>
        </div>

        {/* Recipient & Mobile */}
        <div className="flex justify-between items-end text-xs font-bold mb-2">
          <div className="leading-relaxed">
            <div>ಗೆ,</div>
            <div>ಮೆ: ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
            <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</div>
            <div>ಮರಗೂರ, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ</div>
          </div>
          <div className="font-mono">
            ಮೊಬೈಲ್ ನಂ: <span className="font-bold underline underline-offset-2">{transferorMobile || '____________________'}</span>
          </div>
        </div>

        {/* Salutation & Subject */}
        <div className="text-xs font-bold mb-1">ಮಾನ್ಯರೇ,</div>
        <div className="text-xs font-bold pl-6 mb-1.5">
          ವಿಷಯ : - “{cleanCategory}” ವರ್ಗದ ಶೇರು ಸದಸ್ಯತ್ವ ವರ್ಗಾವಣೆ ಮಾಡುವ ಕುರಿತು.
        </div>
        <div className="text-xs leading-relaxed pl-6 mb-2">
          ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದ ನಾನು ಶ್ರೀ/ಶ್ರೀಮತಿ <strong className="underline underline-offset-2">{transferorName}</strong><br />
          ಸಾ|| <strong className="underline underline-offset-2">{transferorPlace}</strong> ತಾ|| <strong className="underline underline-offset-2">{transferorTaluk}</strong> ಜಿ|| <strong className="underline underline-offset-2">{transferorDistrict}</strong> ಈ ಮೂಲಕ ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಬರೆದುಕೊಡುವ ವಿನಂತಿ ಅರ್ಜಿ ಏನೆಂದರೆ –
        </div>
        <div className="text-xs font-bold pl-6 mb-2">
          ತಮ್ಮ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ನಾನು “{cleanCategory}” ವರ್ಗದ ಶೇರು ಹೊಂದಿದ್ದು, ಶೇರು ವಿವರ ಈ ಕೆಳಗಿನಂತಿರುತ್ತದೆ.
        </div>

        {/* Transferor Share Table */}
        <table className="w-full border-[1.5px] border-black text-[11px] mb-2 font-sans">
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1.5 border-r border-black font-semibold">ಶೇರು ಖಾತೆ ನಂಬರ : <strong className="font-mono">#{shareNo}</strong></td>
              <td className="p-1.5 border-r border-black font-semibold">ಮೂಲ ಶೇರು ಸಂಖ್ಯೆ : <strong className="font-mono">#{shareNo}</strong></td>
              <td className="p-1.5 font-semibold">ಶೇರುಗಳ ಸಂಖ್ಯೆ : <strong className="font-mono">{noOfShares}</strong></td>
            </tr>
            <tr>
              <td className="p-1.5 border-r border-black font-semibold">ಶೇರು ಕ್ರಮಾಂಕ : <span className="font-mono">—</span></td>
              <td className="p-1.5 border-r border-black font-semibold" colSpan={2}>ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ನಂಬರ : <span className="font-mono">—</span></td>
            </tr>
          </tbody>
        </table>

        {/* Body Paragraph */}
        <p className="text-[11px] leading-[1.7] text-justify indent-6 mb-2">
          ಮೇಲ್ಕಂಡ ಕಾರ್ಖಾನೆಯ ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ನನ್ನ ಕೌಟುಂಬಿಕ (ಪ್ರಪಂಚದ) ಅಡಚಣೆ ಸಲುವಾಗಿ, ವರ್ಗಾವಣೆ ಮಾಡಲು ಇಚ್ಛಿಸಿದ್ದು, ಈ ವಿಷಯವನ್ನು ಕುಟುಂಬದ ಸದಸ್ಯರ ಗಮನಕ್ಕೆ ತಂದು ಎಲ್ಲರೂ ಒಪ್ಪಿಗೆ ಸೂಚಿಸಿದ್ದರಿಂದ, ಈ ಕೆಳಕಾಣಿಸಿದ ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಗ್ರಾಮದ ಕಬ್ಬು ಬೆಳೆಗಾರ ರೈತರಿಗೆ ನನ್ನ ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ವರ್ಗಾವಣೆ ಮಾಡಬೇಕೆಂದು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಪ್ರಾರ್ಥಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
        </p>

        {/* Transferee Section Heading */}
        <div className="text-xs font-bold text-center my-1 underline underline-offset-2">
          ಶೇರು ತೆಗೆದುಕೊಳ್ಳುವವರ ವಿವರ
        </div>

        {/* Transferee Table */}
        <table className="w-full border-[1.5px] border-black text-[10.5px] mb-2 font-sans">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold text-center">
              <th className="p-1 border-r border-black w-10">ಅ.ನಂ.</th>
              <th className="p-1 border-r border-black w-36">ವಿವರಣೆ</th>
              <th className="p-1 text-center">ಮಾಹಿತಿ ವಿವರಗಳು</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">1</td>
              <td className="p-1 border-r border-black font-semibold">ಕಬ್ಬು ಬೆಳೆಗಾರರ ಪೂರ್ಣ ಹೆಸರು</td>
              <td className="p-1 font-bold">ಶ್ರೀ/ಶ್ರೀಮತಿ : {transfereeName}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">2</td>
              <td className="p-1 border-r border-black font-semibold">ಖಾಯಂ ವಿಳಾಸ</td>
              <td className="p-1">ಗ್ರಾಮ: <strong>{transfereePlace}</strong> | ತಾಲೂಕ : <strong>{transfereeTaluk}</strong> | ಜಿಲ್ಲೆ: <strong>{transfereeDistrict}</strong></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">3</td>
              <td className="p-1 border-r border-black font-semibold">ಆಧಾರ ನಂಬರ</td>
              <td className="p-1 font-mono"><strong>{transfereeAadhaar || '—'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; ಮೊಬೈಲ್ ನಂಬರ: <strong>{transfereeMobile || '—'}</strong></td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black text-center font-bold align-top">4</td>
              <td className="p-1 border-r border-black font-semibold align-top">ಕಬ್ಬು ಬೆಳೆಯುವ ಜಮೀನು ಕ್ಷೇತ್ರದ ವಿವರ</td>
              <td className="p-1 space-y-1">
                <div className="flex justify-between">
                  <span>ಸರ್ವೇ ನಂಬರ : <strong>—</strong></span>
                  <span>ಹಿಸ್ಸಾ: <strong>—</strong></span>
                  <span>ಹೋಬಳಿ : <strong>{transfereeTaluk}</strong></span>
                  <span>ಗ್ರಾಮ : <strong>{transfereePlace}</strong></span>
                  <span>ಕ್ಷೇತ್ರ : <strong>—</strong></span>
                </div>
                <div className="border-t border-slate-300 pt-0.5">
                  ಜಮೀನಿಗೆ ನೀರಾವರಿ ಮೂಲ ವಿವರ : <strong>ಕೊಳವೆ ಬಾವಿ / ಬಾವಿ / ಕೆನಾಲ್ / ನದಿ ನೀರು</strong>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Declaration */}
        <p className="text-[10px] leading-relaxed text-justify mb-2">
          ಕಾರ್ಖಾನೆಯ ಕಾಲಕಾಲಕ್ಕೆ ನೀಡುವ ಸೂಚನೆಗಳಿಗೆ ಬದ್ಧನಾಗಿದ್ದು, ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆ 1959 ಕಲಂ 23ರನ್ವಯ ಮತ್ತು ಕಾರ್ಖಾನೆಯ ಉಪ ನಿಯಮ 19(7)ರ ಪ್ರಕಾರ ನನ್ನ ಶೇರು ಸದಸ್ಯತ್ವ ಕಡಿಮೆ ಮಾಡಿ ಮೇಲ್ಕಾಣಿಸಿದ ಖರೀದಿದಾರರಿಗೆ ವರ್ಗಾವಣೆ ಮಾಡಬೇಕೆಂದು ಈ ಮೂಲಕ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
        </p>

        {/* Signatures */}
        <div className="flex justify-between items-end text-xs font-bold pt-1 mb-2">
          <div>
            <div>ಸ್ಥಳ : {transferorPlace}</div>
            <div>ದಿನಾಂಕ : {receiptDate || applicationDate}</div>
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-black pt-1">ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರ ಸಹಿ</div>
          </div>
        </div>

        {/* Attachments List */}
        <div className="text-[9.5px] border-t border-black pt-1 space-y-0.5 leading-snug">
          <div><strong>ಲಗತ್ತಿಸುವ ದಾಖಲೆಗಳು:</strong></div>
          <div>1. ಕಾರ್ಖಾನೆಯ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ಹಾಗೂ ಗುರುತಿನ ಪತ್ರದ ನಕಲು ಪ್ರತಿ</div>
          <div>2. ಶೇರು ಕೊಡುವವರ ಹೆಸರಿನಲ್ಲಿ ಕಾರ್ಖಾನೆಯಲ್ಲಿ ಹಾಗೂ ಅಂಗ ಸಂಸ್ಥೆಗಳಲ್ಲಿ ಯಾವುದೇ ಬಾಕಿ ಇಲ್ಲದಿರುವ ಬಗ್ಗೆ, ಬೇ ಬಾಕಿ ಪ್ರಮಾಣ ಪತ್ರ</div>
          <div>3. ಶೇರು ಕೊಡುವವರ ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರ, ವಾರಸುದಾರರ ಒಪ್ಪಿಗೆಯ ಪತ್ರ</div>
          <div>4. ರಹವಾಸಿ ಪತ್ರ:- ಆಧಾರ ಕಾರ್ಡ ಝರಾಕ್ಸ್ ಪ್ರತಿಗೆ ಅಟೆಸ್ಟೆಡ್ ಮಾಡಿಸಿ ಲಗತ್ತಿಸುವದು.</div>
          <div className="pt-0.5"><strong>ಸೂಚನೆ: -</strong> ಶೇರು ವರ್ಗಾವಣೆಗಾಗಿ ಕಾರ್ಖಾನೆಯಿಂದ ನಾಮಿನಲ್ ಮೆಂಬರ್ ಸದಸ್ಯತ್ವಕ್ಕೆ ಅನುಮತಿ ಪಡೆದ ನಂತರ, ನಿಯಮಾನುಸಾರ</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-1">11</div>
    </div>
  );

  // =========================================================================
  // PAGE 12: ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು (ಖರೀದಿದಾರರ ಅಧಿಕೃತ ಅರ್ಜಿ)
  // =========================================================================
  const renderPage12 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-5 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {/* Top Header Row with Photo Frame */}
        <div className="flex justify-between items-start mb-2">
          {/* Title Box */}
          <div className="flex-1 text-center pr-2">
            <div className="border-[2px] border-black p-0.5 text-center bg-white my-1 inline-block shadow-sm">
              <div className="border border-black py-1 px-8 font-bold text-sm tracking-wide text-black leading-tight">
                <div>ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು</div>
                <div className="text-xs font-semibold">ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ಮಾಡಿಕೊಳ್ಳುವ ಅರ್ಜಿ</div>
              </div>
            </div>
          </div>

          {/* Transferee Photo Frame */}
          <div className="border-[1.5px] border-black w-28 h-36 flex flex-col items-center justify-center p-1 text-center bg-slate-50 shrink-0">
            {transfereePhoto ? (
              <img src={transfereePhoto} alt="Transferee" className="w-full h-full object-cover rounded" />
            ) : (
              <div className="text-[10px] font-bold text-slate-600 leading-tight">
                ಶೇರು ಖರೀದಿಸುವವರ<br />ಫೋಟೋ ಅಂಟಿಸುವುದು
              </div>
            )}
          </div>
        </div>

        {/* Recipient & Mobile */}
        <div className="flex justify-between items-end text-xs font-bold mb-2">
          <div className="leading-relaxed">
            <div>ಗೆ,</div>
            <div>ಮೆ: ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು</div>
            <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ.</div>
            <div>ಮರಗೂರ, ತಾ|| ಚಡಚಣ, ಜಿ|| ವಿಜಯಪುರ</div>
          </div>
          <div className="font-mono">
            ಮೊಬೈಲ್ ನಂ: <span className="font-bold underline underline-offset-2">{transfereeMobile || '____________________'}</span>
          </div>
        </div>

        {/* Salutation & Subject */}
        <div className="text-xs font-bold mb-1">ಮಾನ್ಯರೇ,</div>
        <div className="text-xs font-bold pl-6 mb-1.5">
          ವಿಷಯ : - “{cleanCategory}” ವರ್ಗದ ಶೇರು ಸದಸ್ಯತ್ವ ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವ ಕುರಿತು.
        </div>
        <div className="text-xs leading-relaxed pl-6 mb-2">
          ಈ ಕೆಳಗೆ ಸಹಿ ಮಾಡಿದ ನಾನು ಶ್ರೀ/ಶ್ರೀಮತಿ <strong className="underline underline-offset-2">{transfereeName}</strong><br />
          ಸಾ|| <strong className="underline underline-offset-2">{transfereePlace}</strong> ತಾ|| <strong className="underline underline-offset-2">{transfereeTaluk}</strong> ಜಿ|| <strong className="underline underline-offset-2">{transfereeDistrict}</strong> ಈ ಮೂಲಕ ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ಬರೆದುಕೊಡುವ ವಿನಂತಿ ಅರ್ಜಿ ಏನೆಂದರೆ – ನಾನು ತಮ್ಮ ಕಾರ್ಖಾನೆಯ ಕಾರ್ಯವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಬರುವ ಈ ಕೆಳಕಾಣಿಸಿದ ಗ್ರಾಮದಲ್ಲಿ ಕಬ್ಬು ಬೆಳೆಯುವ ನೀರಾವರಿ ಕ್ಷೇತ್ರದ ಜಮೀನು ಹೊಂದಿದ್ದು, ಹಾಗು ಖಾಯಂ ರಹವಾಸಿಯಾಗಿರುತ್ತೇನೆ.
        </div>

        {/* Land & Nominal Fee Table */}
        <table className="w-full border-[1.5px] border-black text-[10.5px] mb-2 font-sans">
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black w-8 text-center font-bold">1</td>
              <td className="p-1 border-r border-black w-24 font-bold">ಗ್ರಾಮ :</td>
              <td className="p-1" colSpan={4}>ಕಬ್ಬು ಬೆಳೆಯುವ ಜಮೀನು ಕ್ಷೇತ್ರದ ವಿವರ | ಗ್ರಾಮ : <strong>{transfereePlace}</strong> | ತಾಲೂಕ: <strong>{transfereeTaluk}</strong></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold align-top">2</td>
              <td className="p-1 border-r border-black font-bold align-top">ಕಬ್ಬು ಬೆಳೆಯುವ ಜಮೀನು ಕ್ಷೇತ್ರದ ವಿವರ</td>
              <td className="p-1 space-y-1" colSpan={4}>
                <div className="flex justify-between">
                  <span>ಸರ್ವೇ ನಂಬರ : <strong>—</strong></span>
                  <span>ಹಿಸ್ಸಾ: <strong>—</strong></span>
                  <span>ಹೋಬಳಿ : <strong>{transfereeTaluk}</strong></span>
                  <span>ಗ್ರಾಮ: <strong>{transfereePlace}</strong></span>
                  <span>ಕ್ಷೇತ್ರ : <strong>—</strong></span>
                </div>
                <div className="border-t border-slate-300 pt-0.5">
                  ಜಮೀನಿಗೆ ನೀರಾವರಿ ಮೂಲ ವಿವರ : <strong>ಕೊಳವೆ ಬಾವಿ / ಬಾವಿ / ಕೆನಾಲ್ / ನದಿ ನೀರು</strong>
                </div>
              </td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black text-center font-bold">3</td>
              <td className="p-1 border-r border-black font-bold">ನಾಮಿನಲ್ ಮೆಂಬರ್ ಫೀ</td>
              <td className="p-1" colSpan={4}>ರೂ. 500/- ಭರಣಾ ಮಾಡಿದ ರಶೀದಿ ನಂಬರ್ : <strong className="font-mono">#{receiptNo || '816'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; ದಿನಾಂಕ : <strong className="font-mono">{receiptDate || applicationDate}</strong></td>
            </tr>
          </tbody>
        </table>

        {/* Body Paragraph */}
        <p className="text-[11px] leading-[1.7] text-justify indent-6 mb-2">
          ಮೇಲ್ಕಾಣಿಸಿದ ವಿವರದ ಪ್ರಕಾರ ನಾನು ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಕಬ್ಬು ಬೆಳೆಗಾರನಾಗಿದ್ದು, ಕಾರ್ಖಾನೆಯ ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ಪಡೆಯಲು ಇಚ್ಛಿಸಿ, ಈ ಕೆಳಕಾಣಿಸಿದ ಕಾರ್ಖಾನೆಯ ಶೇರು ಹೊಂದಿದ ಸದಸ್ಯರು ತಮ್ಮ ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರ ಒಪ್ಪಿಗೆ ಪಡೆದುಕೊಂಡು ತಮ್ಮ ಶೇರು ಸದಸ್ಯತ್ವವನ್ನು ನನಗೆ ವರ್ಗಾವಣೆಗೆ ಮಾಡಲು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ರುಜು ಮಾಡಿ ಒಪ್ಪಿಗೆ ನೀಡಿದ್ದರನ್ವಯ, ಸದರ ಶೇರನ್ನು ನನ್ನ ಹೆಸರಿಗೆ ವರ್ಗಾವಣೆ ಮಾಡಬೇಕೆಂದು ಈ ಮೂಲಕ ಪ್ರಾರ್ಥಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
        </p>

        {/* From Whom Purchased Table */}
        <table className="w-full border-[1.5px] border-black text-[10.5px] mb-2 font-sans">
          <tbody>
            <tr className="border-b border-black bg-slate-100">
              <td className="p-1 border-r border-black font-bold" colSpan={3}>
                ಶ್ರೀ/ಶ್ರೀಮತಿ : <span className="text-black">{transferorName}</span>
              </td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black w-44 font-semibold">ಶೇರು ಸದಸ್ಯರ ಪೂರ್ಣ ಹೆಸರು ಹಾಗೂ ವಿಳಾಸ</td>
              <td className="p-1" colSpan={2}>ಗ್ರಾಮ: <strong>{transferorPlace}</strong> | ತಾಲೂಕ : <strong>{transferorTaluk}</strong> | ಜಿಲ್ಲೆ: <strong>{transferorDistrict}</strong></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-semibold">ಆಧಾರ ನಂಬರ</td>
              <td className="p-1 font-mono" colSpan={2}><strong>{transferorAadhaar || '—'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; ಮೊಬೈಲ್ ನಂಬರ: <strong>{transferorMobile || '—'}</strong></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-semibold">ಶೇರು ಖಾತೆ ನಂಬರ : <strong className="font-mono">#{shareNo}</strong></td>
              <td className="p-1 border-r border-black font-semibold">ಮೂಲ ಶೇರುಗಳ ಸಂಖ್ಯೆ : <strong className="font-mono">{noOfShares}</strong></td>
              <td className="p-1 font-semibold">ಶೇರುಗಳ ಸಂಖ್ಯೆ : <strong className="font-mono">{noOfShares}</strong></td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black font-semibold">ಶೇರು ಕ್ರಮಾಂಕ : <span className="font-mono">—</span></td>
              <td className="p-1 font-semibold" colSpan={2}>ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ನಂಬರ : <span className="font-mono">—</span></td>
            </tr>
          </tbody>
        </table>

        {/* Declaration */}
        <p className="text-[10px] leading-relaxed text-justify mb-2">
          ಕಾರ್ಖಾನೆಯ ಕಾಲಕಾಲಕ್ಕೆ ನೀಡುವ ಸೂಚನೆಗಳಿಗೆ ಬದ್ಧನಾಗಿದ್ದು, ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆ 1959 ಕಲಂ 23ರನ್ವಯ ಮತ್ತು ಕಾರ್ಖಾನೆಯ ಉಪ ನಿಯಮ 19(7)ರ ಪ್ರಕಾರ ಮೇಲ್ಕಂಡ ಶೇರುದಾರರ ಹೆಸರನ್ನು ಕಡಿಮೆಗೊಳಿಸಿ, ಸದರಿಯವರ ಸದಸ್ಯತ್ವವನ್ನು ನನಗೆ ವರ್ಗಾವಣೆ ಮಾಡಬೇಕೆಂದು ಈ ಮೂಲಕ ವಿನಂತಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.
        </p>

        {/* Signatures */}
        <div className="flex justify-between items-end text-xs font-bold pt-1 mb-2">
          <div>
            <div>ಸ್ಥಳ : {transfereePlace}</div>
            <div>ದಿನಾಂಕ : {receiptDate || applicationDate}</div>
          </div>
          <div className="text-center">
            <div className="w-52 border-t border-black pt-1">ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರ ಸಹಿ</div>
          </div>
        </div>

        {/* Attachments List */}
        <div className="text-[9.5px] border-t border-black pt-1 space-y-0.5 leading-snug">
          <div><strong>ಲಗತ್ತಿಸುವ ದಾಖಲೆಗಳು:</strong></div>
          <div>1. ಕಾರ್ಖಾನೆಯ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ಹಾಗೂ ಗುರುತಿನ ಪತ್ರದ ನಕಲು ಪ್ರತಿ</div>
          <div>2. ಕಾರ್ಖಾನೆಯಲ್ಲಿ ನಾಮಿನಲ್ ಮೆಂಬರ್ ಫೀ ರೂ. 500/- ಭರಣಾ ಮಾಡಿರುವ ರಶೀದಿ ಮೂಲ ಪ್ರತಿ</div>
          <div>3. ಕಾರ್ಖಾನೆಯ ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಗ್ರಾಮದಲ್ಲಿ ಕನಿಷ್ಠ ಒಂದು ಎಕರೆ ನೀರಾವರಿ ಇರುವ ಕಬ್ಬು ಬೆಳೆಯುವ ಜಮೀನಿನ ಉತಾರೆ ಲಗತ್ತಿಸುವುದು</div>
          <div>4. ರಹವಾಸಿ ಪತ್ರ:- ಆಧಾರ ಕಾರ್ಡ ಝರಾಕ್ಸ್ ಪ್ರತಿಗೆ ಅಟೆಸ್ಟೆಡ್ ಮಾಡಿಸಿ ಲಗತ್ತಿಸುವದು.</div>
          <div className="pt-0.5"><strong>ಸೂಚನೆ: -</strong> ಶೇರು ವರ್ಗಾವಣೆಗಾಗಿ ಕಾರ್ಖಾನೆಯಿಂದ ನಾಮಿನಲ್ ಮೆಂಬರ್ ಸದಸ್ಯತ್ವಕ್ಕೆ ಅನುಮತಿ ಪಡೆದ ನಂತರ, ನಿಯಮಾನುಸಾರ ಕಾರ್ಖಾನೆಯವರು ಸೂಚಿಸುವ ಎಲ್ಲ ಕಾಗದ ಪತ್ರಗಳನ್ನು ಪೂರೈಸುವದು.</div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-1">12</div>
    </div>
  );

  // =========================================================================
  // PAGE 13: ಸದಸ್ಯತ್ವ ವರ್ಗಾವಣೆ ಮಾಡುವ ಶೇರುದಾರರ ಕುಟುಂಬದ ಸದಸ್ಯರ ಪೂರ್ಣ ವಿವರ (Consent Table)
  // =========================================================================
  const renderPage13 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {/* Title Box */}
        <div className="border-[2px] border-black p-1 text-center bg-white my-1 shadow-sm">
          <div className="border border-black py-1 px-4 font-bold text-xs tracking-wide text-black inline-block">
            -:: ಸದಸ್ಯತ್ವ ವರ್ಗಾವಣೆ(ಮಾರಾಟ) ಮಾಡುವ ಶೇರುದಾರರ ಕುಟುಂಬದ ಸದಸ್ಯರ ಪೂರ್ಣ ವಿವರ ::-
          </div>
        </div>

        {/* Date Row */}
        <div className="flex justify-end text-xs font-bold mb-2">
          <div>ದಿನಾಂಕ:- <span className="font-mono">{receiptDate || applicationDate}</span></div>
        </div>

        {/* Recipient */}
        <div className="text-xs leading-relaxed font-bold mb-2">
          <div>ಗೆ,</div>
          <div>ಮೆ: ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು,</div>
          <div>ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ,</div>
          <div>ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪುರ</div>
        </div>

        {/* Salutation & Subject */}
        <div className="text-xs font-bold mb-1">ಮಾನ್ಯರೇ,</div>
        <div className="border border-black rounded-lg p-2 my-2 text-center text-xs font-bold bg-slate-50">
          ವಿಷಯ:- “ಕಾರ್ಖಾನೆಯ ಶೇರು ವರ್ಗಾವಣೆಗೆ ಕುಟುಂಬ ಸದಸ್ಯರು ಒಪ್ಪಿಗೆ ನೀಡಿರುವ ಕುರಿತು.”
        </div>

        {/* Declaration */}
        <p className="text-[11.5px] leading-[1.75] text-justify mb-2">
          ನಾನು ಶ್ರೀ <strong className="underline underline-offset-2">{transferorName}</strong> ಸಾ: <strong className="underline underline-offset-2">{transferorPlace}</strong> ತಾಲೂಕ: <strong className="underline underline-offset-2">{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong className="underline underline-offset-2">{transferorDistrict}</strong> ತಮ್ಮ ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿಯಮಿತ, ಮರಗೂರ, ತಾ|| ಇಂಡಿ ಜಿ|| ವಿಜಯಪುರ ಇದರಲ್ಲಿ ಈ ಕೆಳಗಿನಂತೆ “{cleanCategory}”/“ಡ” ವರ್ಗದ ಒಂದು ಶೇರನ್ನು ಹೊಂದಿರುತ್ತೇನೆ.
        </p>

        {/* Share Mini Table */}
        <table className="w-full border-[1.5px] border-black text-[11px] mb-2 font-sans">
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black font-semibold">ಶೇರು ಖಾತೆ ನಂಬರ: <strong className="font-mono">#{shareNo}</strong></td>
              <td className="p-1 border-r border-black font-semibold">ಮೂಲ ಶೇರುಗಳ ಸಂಖ್ಯೆ : <strong className="font-mono">{noOfShares}</strong></td>
              <td className="p-1 font-semibold">NRD ಶೇರುಗಳ ಸಂಖ್ಯೆ : <strong>Nil</strong></td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black font-semibold">ಶೇರುಕ್ರಮಾಂಕ : <span className="font-mono">—</span></td>
              <td className="p-1 border-r border-black font-semibold">ಶೇರು ಸರ್ಟಿಫಿಕೇಟ್ ನಂಬರ: <span className="font-mono">—</span></td>
              <td className="p-1 font-semibold">===================</td>
            </tr>
          </tbody>
        </table>

        {/* Purpose */}
        <p className="text-[11px] leading-[1.75] text-justify mb-3">
          ಮೇಲ್ಕಂಡ ಶೇರನ್ನು ಕೌಟುಂಬಿಕ(ಪ್ರಾಪಂಚಿಕ) ಅಡಚಣೆ ಸಲುವಾಗಿ ಶ್ರೀ <strong className="underline underline-offset-2">{transfereeName}</strong> ಸಾ: <strong className="underline underline-offset-2">{transfereePlace}</strong> ತಾಲೂಕ: <strong className="underline underline-offset-2">{transfereeTaluk}</strong> ಜಿಲ್ಲಾ: <strong className="underline underline-offset-2">{transfereeDistrict}</strong> ಇವರ ಹೆಸರಿಗೆ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಲು ಇಚ್ಛಿಸಿದ್ದು, ಈ ಬಗ್ಗೆ ಪಂಚರ(ಹಿರಿಯರ) ಸಮಕ್ಷಮದಲ್ಲಿ ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರು ಕೂಡಿಕೊಂಡು ಸಮಾಲೋಚಿಸಿ, ಕಾರ್ಖಾನೆಯ ಅಧಿಕಾರಿಗಳು ಸ್ಥಾನಿಕ ಚೌಕಾಸಿಗೆ ಬಂದಾಗ ಶೇರು ವರ್ಗಾವಣೆಗೆ ರುಜು ಮಾಡುವುದಕ್ಕೆ ಒಪ್ಪಿಕೊಂಡಿರುತ್ತಾರೆ.
        </p>

        {/* Family Members Consent Table (8 rows) */}
        <table className="w-full border-[1.5px] border-black text-[10.5px] mb-3 font-sans">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold text-center">
              <th className="p-1.5 border-r border-black w-12">ಅ.ನಂ.</th>
              <th className="p-1.5 border-r border-black">ಕುಟುಂಬ ಸದಸ್ಯರ ಪೂರ್ಣ ಹೆಸರು</th>
              <th className="p-1.5 border-r border-black w-24">ಸಂಬಂಧ</th>
              <th className="p-1.5 border-r border-black w-20">ವಯಸ್ಸು</th>
              <th className="p-1.5 w-28">ಉದ್ಯೋಗ</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <tr key={num} className="border-b border-black h-7">
                <td className="p-1 border-r border-black text-center font-bold">{num})</td>
                <td className="p-1 border-r border-black"></td>
                <td className="p-1 border-r border-black text-center"></td>
                <td className="p-1 border-r border-black text-center"></td>
                <td className="p-1 text-center"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Count Declaration */}
        <p className="text-[11px] leading-relaxed mb-4">
          ಮೇಲ್ಕಾಣಿಸಿದ ಪ್ರಕಾರ ನನ್ನ ಕುಟುಂಬದಲ್ಲಿ ಹೆಂಡತಿ / ಗಂಡ ಹಾಗು ಮಕ್ಕಳು ಒಳಗೊಂಡು ಒಟ್ಟು:- <strong className="font-mono underline underline-offset-2 px-2">4</strong> ಜನ ಜೀವಂತ ಸದಸ್ಯರು (ವಾರಸುದಾರರು) ಇರುತ್ತಾರೆ ಅಂತಾ ಈ ಮೂಲಕ ಪ್ರಮಾಣೀಕರಿಸುತ್ತೇನೆ.
        </p>

        {/* Footer Signatures */}
        <div className="flex justify-between items-end text-xs font-bold pt-6">
          <div>
            <div>ಸ್ಥಳ : {transferorPlace}</div>
            <div>ದಿನಾಂಕ: {receiptDate || applicationDate}</div>
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-black pt-1">ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರ ಸಹಿ</div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-2">13</div>
    </div>
  );

  // =========================================================================
  // PAGE 14: Legal Opinion (ಕಾನೂನು ಸಲಹೆಗಾರರ ವರದಿ & ಪರಿಶೀಲನಾ ಪಟ್ಟಿ)
  // =========================================================================
  const renderPage14 = () => (
    <div className="vargavane-a4-page bg-white text-black border-[2px] border-black w-full min-h-[272mm] p-6 flex flex-col justify-between font-['Anek_Kannada','Noto_Sans_Kannada',sans-serif] box-border relative shadow-lg">
      <div>
        {/* Top Header Row */}
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-xs">
            ಸಲ್ಲಿಸಲಾಗಿದೆ :-
          </div>
          <div className="border-[2px] border-black p-0.5">
            <div className="border border-black px-6 py-0.5 font-bold font-serif text-sm">
              Legal opinion
            </div>
          </div>
          <div className="border border-black px-3 py-0.5 text-xs font-bold">
            :: ಶೇರು ವಿಭಾಗ ::
          </div>
        </div>

        {/* Salutation & Subject */}
        <div className="text-xs font-bold mb-1">ಮಾನ್ಯರೇ,</div>
        <div className="text-[11.5px] font-bold text-center my-2 leading-relaxed">
          ವಿಷಯ:- ಕಾರ್ಖಾನೆಯ ಶೇರು ವರ್ಗಾವಣೆ(ಮಾರಾಟ) ಮಾಡುವುದಕ್ಕೆ ಸಂಬಂಧಿಸಿದಂತೆ, ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು ಹಾಗೂ ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು ಪೂರೈಸಿದ ಕಾಗದ ಪತ್ರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಕಾನೂನು ಸಲಹೆ ನೀಡುವ ಕುರಿತು
        </div>

        {/* Introduction */}
        <p className="text-[11px] leading-[1.7] text-justify indent-6 mb-2">
          ಕಾರ್ಖಾನೆಯ ‘<strong>{cleanCategory}</strong>’ವರ್ಗದ ಸದಸ್ಯರಾದ <strong>ಶ್ರೀ {transferorName}</strong> ಸಾ: <strong>{transferorPlace}</strong> ತಾಲೂಕ: <strong>{transferorTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transferorDistrict}</strong> ಇವರು <strong>{noOfShares}</strong> ಶೇರ ಹೊಂದಿದ್ದು, ಶೇರ ಖಾತೆ ನಂ:- <strong className="font-mono">#{shareNo}</strong> ಇರುತ್ತದೆ. ಸದರಿಯವರು ತಮ್ಮ ಕೌಟುಂಬಿಕ ಅಡಚಣೆ ಸಲುವಾಗಿ ತಮ್ಮ ಶೇರನ್ನು ಸ್ವ-ಇಚ್ಛೆಯಿಂದ ವರ್ಗಾವಣೆ ಮಾಡಲು ಇಚ್ಛಿಸಿ, ಕಾರ್ಖಾನೆಯ ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಗ್ರಾಮದ ಕಬ್ಬು ಬೆಳೆಗಾರ ರೈತರಾದ <strong>ಶ್ರೀ {transfereeName}</strong> ಸಾ: <strong>{transfereePlace}</strong> ತಾಲೂಕ: <strong>{transfereeTaluk}</strong> ಜಿಲ್ಲಾ: <strong>{transfereeDistrict}</strong> ಇವರಿಗೆ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಲು ವಿನಂತಿಸಿಕೊಂಡಿದ್ದರನ್ವಯ, ಶೇರು ತೆಗೆದುಕೊಳ್ಳುವವರು ಈಗಾಗಲೇ ದಿನಾಂಕ: <strong className="font-mono">{receiptDate || applicationDate}</strong> ರಂದು ಜರುಗಿದ ಆಡಳಿತ ಮಂಡಳಿ ಸಭೆಯ ಠರಾವು ನಂ: <strong className="font-mono">{receiptNo || '816'}</strong> ರನ್ವಯ ನಾಮಿನಲ್ ಸದಸ್ಯತ್ವವನ್ನು ಪಡೆದಿರುವರು. ಆದಕಾರಣ, ಸದರಿ ರೈತರುಗಳು ಕಾರ್ಖಾನೆಯ ನಿಯಮಾನುಸಾರ ಅವಶ್ಯಕವಿರುವ ಈ ಕೆಳಕಂಡ ದಾಖಲಾತಿಗಳನ್ನು ಪೂರೈಸಿರುತ್ತಾರೆ.
        </p>

        {/* Comparative 8-Row Checklist Table */}
        <table className="w-full border-[1.5px] border-black text-[9.5px] mb-2 font-sans">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold text-center">
              <th className="p-1 border-r border-black w-8">ಅ ಸಂ.</th>
              <th className="p-1 border-r border-black w-1/2">ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರ ದಾಖಲಾತಿಗಳು</th>
              <th className="p-1 border-r border-black w-8">ಅ ಸಂ.</th>
              <th className="p-1">ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರ ದಾಖಲಾತಿಗಳು</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">1</td>
              <td className="p-1 border-r border-black">ದಿನಾಂಕ : <span className="font-mono">{applicationDate}</span> ರನ್ವಯ ಶೇರು ವರ್ಗಾವಣೆ ವಿನಂತಿ ಅರ್ಜಿ</td>
              <td className="p-1 border-r border-black text-center font-bold">1</td>
              <td className="p-1">ದಿನಾಂಕ : <span className="font-mono">{applicationDate}</span> ರನ್ವಯ ಶೇರು ಖರೀದಿಯ ವಿನಂತಿ ಅರ್ಜಿ</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">2</td>
              <td className="p-1 border-r border-black">ಕಾರ್ಖಾನೆಯ ಶೇರು ಸರ್ಟಿಫಿಕೇಟ & ಗುರುತಿನ ಪತ್ರ (ID Card)</td>
              <td className="p-1 border-r border-black text-center font-bold">2</td>
              <td className="p-1">ರಶೀದಿ ಸಂಖ್ಯೆ : #{receiptNo || '816'} ದಿನಾಂಕ : {receiptDate} ರನ್ವಯ ಶೇರು ಫೀ & ಪ್ರವೇಶ ಫೀ ಹಾಗೂ ನಾಮಿನಲ್ ಮೆಂಬರ್ ಫೀ ಸೇರಿ ಒಟ್ಟು ರೂ. {fees}/- ಭರಣಾ ಮಾಡಿದ ಮೂಲ ಪ್ರತಿ (Fee Receipt)</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">3</td>
              <td className="p-1 border-r border-black">ಬೇ ಬಾಕಿ ಪ್ರಮಾಣ ಪತ್ರ (No Dues Certificate)</td>
              <td className="p-1 border-r border-black text-center font-bold">3</td>
              <td className="p-1">ರೂ. 500/- ಬಾಂಡ ಮೇಲೆ ನಷ್ಟ ಭರಣಾ ಮುಚ್ಚಳಿಕೆ ಪತ್ರ ನೋಟ್ರಿ ರ.ನಂ. : — ದಿನಾಂಕ : {receiptDate} (Indemnity Bond)</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">4</td>
              <td className="p-1 border-r border-black">ರೂ. 500/- ಬಾಂಡ ಮೇಲೆ ಒಪ್ಪಿಗೆ ಪತ್ರ ನೋಟ್ರಿ ರ.ನಂ.: — ದಿನಾಂಕ : {receiptDate} (Personal Kabuli letter)</td>
              <td className="p-1 border-r border-black text-center font-bold">4</td>
              <td className="p-1">ರಹವಾಸಿ :- ಆಧಾರ್ ಗುರುತಿನ ಪತ್ರ ಸಂಖ್ಯೆ : <span className="font-mono">{transfereeAadhaar || '—'}</span></td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">5</td>
              <td className="p-1 border-r border-black">ರೂ. 100/- ಬಾಂಡ ಮೇಲೆ ಅಫಿಟಿವಿಟ್ ಒಪ್ಪಿಗೆ ಪತ್ರ ನೋಟ್ರಿ ರ.ನಂ.: — ದಿನಾಂಕ : {receiptDate}</td>
              <td className="p-1 border-r border-black text-center font-bold">5</td>
              <td className="p-1">ಶೆಡ್ಯೂಲ್ ‘ಎ’ ಫಾರ್ಮ</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">6</td>
              <td className="p-1 border-r border-black">ರೂ. 100/- ಬಾಂಡ ಮೇಲೆ ಪದ್ಧತಿಯ ಒಪ್ಪಿಗೆ ಪತ್ರ ನೋಟ್ರಿ ರ.ನಂ.: — ದಿನಾಂಕ : {receiptDate}</td>
              <td className="p-1 border-r border-black text-center font-bold">6</td>
              <td className="p-1">ಕಾರ್ಯವ್ಯಾಪ್ತಿಯ ಗ್ರಾಮದಲ್ಲಿ ಕಬ್ಬು ಬೆಳೆಯುವ ನೀರಾವರಿ ಕ್ಷೇತ್ರದ ಜಮೀನಿನ ಉತಾರೆ.</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1 border-r border-black text-center font-bold">7</td>
              <td className="p-1 border-r border-black">ರಹವಾಸಿ :- ಆಧಾರ್ ಗುರುತಿನ ಪತ್ರ ಸಂಖ್ಯೆ : <span className="font-mono">{transferorAadhaar || '—'}</span></td>
              <td className="p-1 border-r border-black text-center font-bold">7</td>
              <td className="p-1">ಹೊಸ ಶೇರು ಖಾತೆ ಸಂಖ್ಯೆ : <span className="font-mono">#{shareNo}</span></td>
            </tr>
            <tr>
              <td className="p-1 border-r border-black text-center font-bold">8</td>
              <td className="p-1 border-r border-black">ಕಾರ್ಖಾನೆಯ ಕ್ಷೇತ್ರ ಸಿಬ್ಬಂದಿಯ (FA) ಸ್ಥಾನಿಕ ಚೌಕಾಸಿ ವರದಿ</td>
              <td className="p-1 border-r border-black text-center font-bold"></td>
              <td className="p-1"></td>
            </tr>
          </tbody>
        </table>

        {/* Submission Paragraph */}
        <p className="text-[10.5px] leading-relaxed text-justify mb-2">
          ಮೇಲ್ಕಾಣಿಸಿದ ವಿವರದ ಪ್ರಕಾರ ಶೇರು ವರ್ಗಾವಣೆ (ಮಾರಾಟ) ಮಾಡುವವರು ಹಾಗೂ ಶೇರು ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು ಸಲ್ಲಿಸಿರುವ ದಾಖಲಾತಿಗಳನ್ನು ಇದರೊಂದಿಗೆ ಲಗತ್ತಿಸಲಾಗಿದ್ದು, ಸದರ ಕಾಗದಪತ್ರಗಳನ್ನು ಕೂಲಂಕೂಷವಾಗಿ ಪರಿಶೀಲನೆ ಮಾಡಿ, ವರದಿ ನೀಡಲು ತಮ್ಮಲ್ಲಿ ಈ ಮೂಲಕ ವಿನಂತಿಸಲಾಗಿದೆ.
        </p>

        {/* Office Signatures */}
        <div className="flex justify-between items-center text-xs font-bold pt-1 mb-2">
          <div>ಗುಮಾಸ್ತರು</div>
          <div>ಶೇರು ಇನ್-ಚಾರ್ಜ</div>
        </div>

        {/* Divider */}
        <div className="border-t border-black my-1"></div>

        {/* Section 2: Legal Advisor Report */}
        <div className="pt-1 text-xs">
          <div className="flex justify-between items-center font-bold mb-1">
            <span>2) ಕಾನೂನು ಸಲಹೆಗಾರರ ವರದಿ:-</span>
            <span>ದಿನಾಂಕ : <span className="font-mono">{receiptDate || applicationDate}</span></span>
          </div>
          <p className="text-[11px] leading-relaxed text-justify mb-4">
            ಮೇಲ್ಕಂಡ ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರು ಹಾಗೂ ವರ್ಗಾಯಿಸಿಕೊಳ್ಳುವವರು ಪೂರೈಸಿದ ಕಾಗದ ಪತ್ರಗಳು ಕರ್ನಾಟಕ ಸಹಕಾರ ಸಂಘಗಳ ಕಾಯ್ದೆ 1959 ಕಲಂ 23ರ ಪ್ರಕಾರ ನಿಯಮಾನುಸಾರ ಪರಿಶೀಲಿಸಲಾಗಿ ಸರಿ ಇರುತ್ತವೆ.
          </p>
          <div className="flex justify-end text-xs font-bold text-center">
            <div>
              (ಶ್ರೀ ಸುನೀಲ್ ಕುಲಕರ್ಣಿ)<br />
              <span className="text-[10px] font-normal">ವಕೀಲರು ಹಾಗೂ ಕಾನೂನು ಸಲಹೆಗಾರರು, ಇಂಡಿ</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-right text-xs font-bold text-black pt-1">14</div>
    </div>
  );
`;

// Insert pages 11 to 14 right after renderPage10
const page10EndMarker = '      <div className="text-right text-xs font-bold text-black pt-2">10</div>\n    </div>\n  );';

if (content.includes(page10EndMarker)) {
  content = content.replace(page10EndMarker, page10EndMarker + '\n\n' + pages11to14);
  console.log('Inserted renderPage11 to renderPage14');
} else {
  console.error('page10EndMarker NOT found!');
}

// Update title, subtitle, print buttons to 14 pages
content = content.replace(
  '<span>ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ (Vargavane 10-Page Complete Bundle)</span>',
  '<span>ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ (Vargavane 14-Page Complete Bundle)</span>'
);

content = content.replace(
  'ಕಾನೂನುಬದ್ಧ 10 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಪತ್ರಗಳು (A4 Format)',
  'ಕಾನೂನುಬದ್ಧ 14 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಪತ್ರಗಳು (A4 Format)'
);

// Replace button texts
content = content.replaceAll(
  "{activeTab === 'all' ? 'ಎಲ್ಲಾ 10 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)",
  "{activeTab === 'all' ? 'ಎಲ್ಲಾ 14 ಪುಟ ಮುದ್ರಿಸಿ' : 'ಈ ಪುಟ ಮುದ್ರಿಸಿ'} (Print)"
);

// 2. Replace Tab Buttons
const oldTabsSection = `            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={\`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'all'
                  ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              <Layers className="w-3.5 h-3.5" /> ಎಲ್ಲಾ 10 ಪುಟಗಳು (All 10 Pages)
            </button>`;

const newTabsHeader = `            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={\`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'all'
                  ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              <Layers className="w-3.5 h-3.5" /> ಎಲ್ಲಾ 14 ಪುಟಗಳು (All 14 Pages)
            </button>`;

content = content.replace(oldTabsSection, newTabsHeader);

// Add Tab 11 to 14 right after Tab 10
const tab10End = `            <button
              type="button"
              onClick={() => setActiveTab('p10')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p10' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 10: Schedule ‘A’ (Agreement)
            </button>`;

const tabs11to14 = `            <button
              type="button"
              onClick={() => setActiveTab('p10')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p10' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 10: Schedule ‘A’ (Agreement)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p11')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p11' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 11: ಶೇರು ಮಾರಾಟಗಾರರ ವರ್ಗಾವಣೆ ಅರ್ಜಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p12')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p12' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 12: ಶೇರು ಖರೀದಿದಾರರ ವರ್ಗಾವಣೆ ಅರ್ಜಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p13')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p13' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 13: ಕುಟುಂಬ ಸದಸ್ಯರ ಒಪ್ಪಿಗೆ ಪಟ್ಟಿ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('p14')}
              className={\`py-2 px-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap \${
                activeTab === 'p14' ? 'border-purple-500 text-purple-300 font-bold bg-slate-900 rounded-t-xl' : 'border-transparent text-slate-400 hover:text-slate-200'
              }\`}
            >
              ಪುಟ 14: Legal Opinion (ಕಾನೂನು ಸಲಹೆಗಾರರ ವರದಿ)
            </button>`;

content = content.replace(tab10End, tabs11to14);

// 3. Replace Modal Preview Area
const oldPreviewAll = `                {renderPage9()}
                {renderPage10()}`;

const newPreviewAll = `                {renderPage9()}
                {renderPage10()}
                {renderPage11()}
                {renderPage12()}
                {renderPage13()}
                {renderPage14()}`;

content = content.replace(oldPreviewAll, newPreviewAll);

const oldPreviewSwitch = `            ) : activeTab === 'p9' ? (
              <div className="w-full max-w-[790px]">{renderPage9()}</div>
            ) : (
              <div className="w-full max-w-[790px]">{renderPage10()}</div>
            )}`;

const newPreviewSwitch = `            ) : activeTab === 'p9' ? (
              <div className="w-full max-w-[790px]">{renderPage9()}</div>
            ) : activeTab === 'p10' ? (
              <div className="w-full max-w-[790px]">{renderPage10()}</div>
            ) : activeTab === 'p11' ? (
              <div className="w-full max-w-[790px]">{renderPage11()}</div>
            ) : activeTab === 'p12' ? (
              <div className="w-full max-w-[790px]">{renderPage12()}</div>
            ) : activeTab === 'p13' ? (
              <div className="w-full max-w-[790px]">{renderPage13()}</div>
            ) : (
              <div className="w-full max-w-[790px]">{renderPage14()}</div>
            )}`;

content = content.replace(oldPreviewSwitch, newPreviewSwitch);

// 4. Replace Standalone Print Portal
const oldPortalAll = `              {renderPage9()}
              {renderPage10()}`;

const newPortalAll = `              {renderPage9()}
              {renderPage10()}
              {renderPage11()}
              {renderPage12()}
              {renderPage13()}
              {renderPage14()}`;

content = content.replace(oldPortalAll, newPortalAll);

const oldPortalSwitch = `          ) : activeTab === 'p9' ? (
            renderPage9()
          ) : (
            renderPage10()
          )}`;

const newPortalSwitch = `          ) : activeTab === 'p9' ? (
            renderPage9()
          ) : activeTab === 'p10' ? (
            renderPage10()
          ) : activeTab === 'p11' ? (
            renderPage11()
          ) : activeTab === 'p12' ? (
            renderPage12()
          ) : activeTab === 'p13' ? (
            renderPage13()
          ) : (
            renderPage14()
          )}`;

content = content.replace(oldPortalSwitch, newPortalSwitch);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated VargavanePrintModal.jsx with Pages 11 to 14!');

// Update tooltips in VargavaneTransferModal.jsx and VargavaneTransferModule.jsx
const transferModalPath = path.resolve(__dirname, '../client/src/components/Vargavane/VargavaneTransferModal.jsx');
let tmContent = fs.readFileSync(transferModalPath, 'utf8').replace(/\r\n/g, '\n');
tmContent = tmContent.replace(
  'title="10 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ಪ್ರಿವ್ಯೂ (10-Page Print Dossier Preview)"',
  'title="14 ಪುಟಗಳ ಅಧಿಕೃತ ಶೇರು ವರ್ಗಾವಣೆ ಅರ್ಜಿ ಪ್ರಿವ್ಯೂ (14-Page Print Dossier Preview)"'
);
fs.writeFileSync(transferModalPath, tmContent, 'utf8');
console.log('Updated VargavaneTransferModal.jsx preview tooltip to 14 pages');

const transferModulePath = path.resolve(__dirname, '../client/src/components/Vargavane/VargavaneTransferModule.jsx');
let tmodContent = fs.readFileSync(transferModulePath, 'utf8').replace(/\r\n/g, '\n');
tmodContent = tmodContent.replace(
  'title="ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ ಮುದ್ರಣ (Vargavane 10-Page Complete Bundle Print)"',
  'title="ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ ಮುದ್ರಣ (Vargavane 14-Page Complete Bundle Print)"'
);
fs.writeFileSync(transferModulePath, tmodContent, 'utf8');
console.log('Updated VargavaneTransferModule.jsx printer tooltip to 14 pages');

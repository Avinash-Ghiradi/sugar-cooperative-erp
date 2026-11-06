const fs = require('fs');
const path = require('path');

function patchFile(relPath, transforms) {
  const fullPath = path.join(__dirname, '../client/src', relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  for (const t of transforms) {
    if (typeof t === 'function') {
      content = t(content);
    } else if (t.search && t.replace) {
      if (content.includes(t.search)) {
        content = content.replace(t.search, t.replace);
      } else {
        console.warn(`[WARN] String match not found in ${relPath}: ${t.search.substring(0, 40)}...`);
      }
    }
  }

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`[SUCCESS] Patched ${relPath}`);
  } else {
    console.log(`[NO CHANGE] ${relPath}`);
  }
}

function ensureImport(content, importStatement) {
  if (content.includes('LoadingAnimation')) return content;
  return importStatement + '\n' + content;
}

// 1. Dashboard.jsx
patchFile('components/Dashboard.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from './Common/LoadingAnimation';"),
  (c) => c.replace(
    /if\s*\(\s*loading\s*\)\s*\{[\s\S]*?return\s*\([\s\S]*?Loading Cooperative Dashboard Analytics\.\.\.[\s\S]*?\);\s*\}/,
    `if (loading) {
    return (
      <LoadingAnimation
        variant="page"
        message="ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅಂಕಿಅಂಶಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
        subMessage="Loading Cooperative Dashboard Analytics & Real-Time Stats..."
      />
    );
  }`
  )
]);

// 2. ShareholderList.jsx
patchFile('components/Shareholders/ShareholderList.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">[\s\S]*?Searching statutory cooperative ledger index\.\.\.[\s\S]*?<\/div>\s*\)\s*:\s*shareholders\.length === 0/,
    `{loading ? (
          <LoadingAnimation
            variant="card"
            message="38 ಕಾಲಂಗಳ ಅಧಿಕೃತ ಶಾಸನಬದ್ಧ ಷೇರು ವಹಿಯನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
            subMessage="Searching Official 38-Column Statutory Cooperative Ledger Index..."
          />
        ) : shareholders.length === 0`
  )
]);

// 3. ShareholderProfile.jsx
patchFile('components/Shareholders/ShareholderProfile.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /if\s*\(\s*loading\s*\|\|\s*!profile\s*\)\s*\{[\s\S]*?Loading statutory shareholder profile\.\.\.[\s\S]*?\);\s*\}/,
    `if (loading || !profile) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <LoadingAnimation
            variant="card"
            message="ಶೇರುದಾರರ ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
            subMessage="Loading Statutory Shareholder Profile & History..."
          />
        </div>
      </div>
    );
  }`
  )
]);

// 4. TransactionsModule.jsx
patchFile('components/Transactions/TransactionsModule.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<div className="p-12 text-center text-slate-400">Loading ledger records\.\.\.<\/div>\s*\)\s*:\s*\(/,
    `{loading ? (
          <LoadingAnimation
            variant="card"
            message="ಹಣಕಾಸು ವಹಿವಾಟು ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
            subMessage="Loading Financial Transactions & Ledger Records..."
          />
        ) : (`
  )
]);

// 5. AttendanceModule.jsx
patchFile('components/Attendance/AttendanceModule.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<div className="p-12 text-center text-slate-400">Loading daily attendance register\.\.\.<\/div>\s*\)\s*:\s*filteredList\.length === 0/,
    `{loading ? (
          <LoadingAnimation
            variant="card"
            message="ಹಾಜರಾತಿ ವಹಿಯನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
            subMessage="Loading Daily Attendance & AGM Register..."
          />
        ) : filteredList.length === 0`
  )
]);

// 6. SugarAllotmentModule.jsx
patchFile('components/SugarAllotment/SugarAllotmentModule.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center gap-3">[\s\S]*?ಶೇರುದಾರರ ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ\.\.\.[\s\S]*?<\/div>\s*\)\s*:\s*processedShareholders\.length === 0/,
    `{loading ? (
          <LoadingAnimation
            variant="card"
            message="ಸಕ್ಕರೆ ಕೋಟಾ ಮತ್ತು ಶೇರುದಾರರ ಮಾಹಿತಿ ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
            subMessage="Loading Sugar Allotment Quotas & Shareholder Eligibility..."
          />
        ) : processedShareholders.length === 0`
  )
]);

// 7. VarasaTransferModule.jsx
patchFile('components/Varasa/VarasaTransferModule.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<div className="p-16 text-center text-slate-400 flex items-center justify-center gap-2">[\s\S]*?Loading Varasa legal-heir records\.\.\.[\s\S]*?<\/div>\s*\)\s*:\s*filteredTransfers\.length === 0/,
    `{loading ? (
          <LoadingAnimation
            variant="card"
            message="ವಾರಸುದಾರರ ವರ್ಗಾವಣೆ ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
            subMessage="Loading Varasa Legal-Heir Succession Records & Approvals..."
          />
        ) : filteredTransfers.length === 0`
  )
]);

// 8. VargavaneTransferModule.jsx
patchFile('components/Vargavane/VargavaneTransferModule.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<div className="p-16 text-center text-slate-400 flex items-center justify-center gap-2">[\s\S]*?Loading Vargavane share transfer records\.\.\.[\s\S]*?<\/div>\s*\)\s*:\s*filteredTransfers\.length === 0/,
    `{loading ? (
          <LoadingAnimation
            variant="card"
            message="ಸಾಮಾನ್ಯ ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
            subMessage="Loading Vargavane General Share Transfer Records & Certificates..."
          />
        ) : filteredTransfers.length === 0`
  )
]);

// 9. IDCardGenerator.jsx
patchFile('components/IDCards/IDCardGenerator.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<div className="p-12 text-center text-slate-400 space-y-2">[\s\S]*?Loading shareholder records for ID card generation\.\.\.[\s\S]*?<\/div>\s*\)\s*:\s*shareholders\.length === 0/,
    `{loading ? (
          <LoadingAnimation
            variant="card"
            message="ಗುರುತಿನ ಚೀಟಿ (ID Card) ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
            subMessage="Loading Shareholder ID Cards & Statutory Layout Preview..."
          />
        ) : shareholders.length === 0`
  )
]);

// 10. EmployeeManagement.jsx
patchFile('components/Employees/EmployeeManagement.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<tr>\s*<td colSpan="10" className="py-8 text-center text-slate-400">[\s\S]*?ಸಿಬ್ಬಂದಿ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ\.\.\.[\s\S]*?<\/td>\s*<\/tr>\s*\)\s*:\s*filteredEmployees\.length === 0/,
    `{loading ? (
                <tr>
                  <td colSpan="10" className="py-12">
                    <LoadingAnimation
                      variant="card"
                      message="ಸಿಬ್ಬಂದಿ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
                      subMessage="Loading Employee Roster & Department Records..."
                    />
                  </td>
                </tr>
              ) : filteredEmployees.length === 0`
  )
]);

// 11. UserManagement.jsx
patchFile('components/Admin/UserManagement.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<tr>\s*<td colSpan="7" className="py-6 text-center text-slate-400">[\s\S]*?ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಖಾತೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ\.\.\.[\s\S]*?<\/td>\s*<\/tr>\s*\)\s*:\s*employees\.length === 0/,
    `{loading ? (
                <tr>
                  <td colSpan="7" className="py-12">
                    <LoadingAnimation
                      variant="card"
                      message="ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ ಖಾತೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
                      subMessage="Loading Staff Login Accounts & Access Matrix..."
                    />
                  </td>
                </tr>
              ) : employees.length === 0`
  )
]);

// 12. AuditLogs.jsx
patchFile('components/Admin/AuditLogs.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<tr>\s*<td colSpan=\{6\} className="py-12 text-center text-slate-400">[\s\S]*?ಆಡಿಟ್ ಲಾಗ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ\.\.\.[\s\S]*?<\/td>\s*<\/tr>\s*\)\s*:\s*filteredLogs\.length === 0/,
    `{loading ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <LoadingAnimation
                      variant="card"
                      message="ಆಡಿಟ್ ಲಾಗ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
                      subMessage="Loading Immutable Audit Trail & System Events..."
                    />
                  </td>
                </tr>
              ) : filteredLogs.length === 0`
  )
]);

// 13. CircleMaster.jsx
patchFile('components/Master/CircleMaster.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">[\s\S]*?Loading administrative circles\.\.\.[\s\S]*?<\/div>\s*\)\s*:\s*activeTab === 'circle-wise'/,
    `{loading ? (
        <LoadingAnimation
          variant="card"
          message="ವಲಯ ಮತ್ತು ಗ್ರಾಮಗಳ ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
          subMessage="Loading Administrative Circles & Official Village Directory..."
        />
      ) : activeTab === 'circle-wise'`
  )
]);

// 14. VillageMaster.jsx
patchFile('components/Master/VillageMaster.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">[\s\S]*?Loading all registered places\.\.\.[\s\S]*?<\/div>\s*\)\s*:\s*\(/,
    `{loading ? (
        <LoadingAnimation
          variant="card"
          message="ಗ್ರಾಮಗಳ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
          subMessage="Loading Registered Places & 357 Villages Directory..."
        />
      ) : (`
  )
]);

// 15. ReportsModule.jsx
patchFile('components/Reports/ReportsModule.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<div className="p-12 text-center text-slate-400">ದಾಖಲೆಗಳನ್ನು ಸಂಕಲಿಸಲಾಗುತ್ತಿದೆ\.\.\.<\/div>\s*\)\s*:\s*\(/,
    `{loading ? (
            <LoadingAnimation
              variant="card"
              message="ವರದಿಗಳನ್ನು ಸಂಕಲಿಸಲಾಗುತ್ತಿದೆ..."
              subMessage="Compiling Statutory Cooperative Summary Reports..."
            />
          ) : (`
  )
]);

// 16. ShareholderReports.jsx
patchFile('components/Reports/ShareholderReports.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<div className="p-16 text-center text-slate-400 space-y-3">[\s\S]*?ಶೇರುದಾರರ ಅಂಕಿಅಂಶಗಳನ್ನು ಸಂಕಲಿಸಲಾಗುತ್ತಿದೆ\.\.\.[\s\S]*?<\/div>\s*\)\s*:\s*filteredShareholders\.length === 0/,
    `{loading ? (
          <LoadingAnimation
            variant="card"
            message="ಶೇರುದಾರರ ಅಂಕಿಅಂಶಗಳನ್ನು ಸಂಕಲಿಸಲಾಗುತ್ತಿದೆ..."
            subMessage="Compiling 17,000+ Shareholder Demographic & Financial Analytics..."
          />
        ) : filteredShareholders.length === 0`
  )
]);

// 17. ShareholderPortal.jsx
patchFile('components/Shareholders/ShareholderPortal.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /if\s*\(\s*loading\s*\)\s*\{[\s\S]*?Loading official shareholder portal & history\.\.\.[\s\S]*?\);\s*\}/,
    `if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <LoadingAnimation
          variant="page"
          message="ಷೇರುದಾರರ ಸದಸ್ಯರ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
          subMessage="Loading Official Shareholder Portal & Records..."
        />
      </div>
    );
  }`
  )
]);

// 18. NewShareholderModule.jsx
patchFile('components/Enrollment/NewShareholderModule.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loading\s*\?\s*\(\s*<tr>\s*<td colSpan="18" className="py-12 text-center text-slate-400">[\s\S]*?ಲೋಡ್ ಆಗುತ್ತಿದೆ\.\.\.[\s\S]*?<\/td>\s*<\/tr>\s*\)\s*:\s*enrollments\.length === 0/,
    `{loading ? (
                <tr>
                  <td colSpan="18" className="py-12">
                    <LoadingAnimation
                      variant="card"
                      message="ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
                      subMessage="Loading New Shareholder Enrollment Roster..."
                    />
                  </td>
                </tr>
              ) : enrollments.length === 0`
  )
]);

// 19. MergeSharesModal.jsx
patchFile('components/Shareholders/MergeSharesModal.jsx', [
  (c) => ensureImport(c, "import LoadingAnimation from '../Common/LoadingAnimation';"),
  (c) => c.replace(
    /\{loadingRequests\s*\?\s*\(\s*<div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">[\s\S]*?ಅನುಮೋದನೆ ವಿನಂತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ\.\.\.[\s\S]*?<\/div>\s*\)\s*:\s*filteredRequests\.length === 0/,
    `{loadingRequests ? (
                <LoadingAnimation
                  variant="card"
                  size="sm"
                  message="ಅನುಮೋದನೆ ವಿನಂತಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ..."
                  subMessage="Verifying Share Merging Approval Requests..."
                />
              ) : filteredRequests.length === 0`
  ),
  (c) => c.replace(
    /\{loadingAuto\s*\?\s*\(\s*<div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">[\s\S]*?ಬಹು-ಮೊತ್ತಗಳು ಮತ್ತು ಶೇರುಗಳ ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತಿದೆ\.\.\.[\s\S]*?<\/div>\s*\)\s*:\s*filteredAutoCandidates\.length === 0/,
    `{loadingAuto ? (
                <LoadingAnimation
                  variant="card"
                  size="sm"
                  message="ಬಹು-ಮೊತ್ತಗಳು ಮತ್ತು ಶೇರುಗಳ ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತಿದೆ..."
                  subMessage="Scanning Multi-Holding Consolidation Candidates..."
                />
              ) : filteredAutoCandidates.length === 0`
  )
]);

console.log('Finished updating all modules with LoadingAnimation!');

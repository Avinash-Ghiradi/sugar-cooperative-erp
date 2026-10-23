const fs = require('fs');
const path = require('path');

// 1. Patch ShareholderList.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Shareholders/ShareholderList.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  if (!content.includes('TableScrollerContainer')) {
    content = "import TableScrollerContainer from '../Common/TableScrollerContainer';\n" + content;
  }

  const targetOpen = '<div className="overflow-x-auto max-h-[72vh]">';
  const replacementOpen = '<TableScrollerContainer label="38 ಕಾಲಂಗಳ ಷೇರು ನಮೂನೆ ವಹಿ (Scroll Ledger):" maxHeight="max-h-[72vh]">';

  const targetClose = `            </table>
          </div>
        )}

        {/* Server Side Pagination Bar */}`;

  const replacementClose = `            </table>
          </TableScrollerContainer>
        )}

        {/* Server Side Pagination Bar */}`;

  if (content.includes(targetOpen) && content.includes(targetClose)) {
    content = content.replace(targetOpen, replacementOpen);
    content = content.replace(targetClose, replacementClose);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[PASS] ShareholderList.jsx updated with TableScrollerContainer');
  } else {
    console.error('[FAIL] ShareholderList.jsx table targets not found');
  }
}

// 2. Patch NewShareholderModule.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Enrollment/NewShareholderModule.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  if (!content.includes('TableScrollerContainer')) {
    content = "import TableScrollerContainer from '../Common/TableScrollerContainer';\n" + content;
  }

  const targetOpen = `      {/* 15-Column Statutory Register Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">`;

  const replacementOpen = `      {/* 15-Column Statutory Register Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <TableScrollerContainer label="15 ಕಾಲಂಗಳ ನೋಂದಣಿ ವಹಿ (Scroll Register):">`;

  const targetClose = `            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}`;

  const replacementClose = `            </tbody>
          </table>
        </TableScrollerContainer>

        {/* Pagination Bar */}`;

  if (content.includes(targetOpen) && content.includes(targetClose)) {
    content = content.replace(targetOpen, replacementOpen);
    content = content.replace(targetClose, replacementClose);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[PASS] NewShareholderModule.jsx updated with TableScrollerContainer');
  } else {
    console.error('[FAIL] NewShareholderModule.jsx table targets not found');
  }
}

// 3. Patch VarasaTransferModule.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Varasa/VarasaTransferModule.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  if (!content.includes('TableScrollerContainer')) {
    content = "import TableScrollerContainer from '../Common/TableScrollerContainer';\n" + content;
  }

  const targetOpen = `        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">`;

  const replacementOpen = `        ) : (
          <TableScrollerContainer label="22 ಕಾಲಂಗಳ ವಾರಸುದಾರರ ಶೇರು ವರ್ಗಾವಣೆ ವಹಿ (Scroll Varasa):">
            <table className="w-full text-left text-xs whitespace-nowrap">`;

  const targetClose = `              </tbody>
            </table>
          </div>
        )}`;

  const replacementClose = `              </tbody>
            </table>
          </TableScrollerContainer>
        )}`;

  if (content.includes(targetOpen) && content.includes(targetClose)) {
    content = content.replace(targetOpen, replacementOpen);
    content = content.replace(targetClose, replacementClose);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[PASS] VarasaTransferModule.jsx updated with TableScrollerContainer');
  } else {
    console.error('[FAIL] VarasaTransferModule.jsx table targets not found');
  }
}

// 4. Patch VargavaneTransferModule.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Vargavane/VargavaneTransferModule.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  if (!content.includes('TableScrollerContainer')) {
    content = "import TableScrollerContainer from '../Common/TableScrollerContainer';\n" + content;
  }

  const targetOpen = `        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">`;

  const replacementOpen = `        ) : (
          <TableScrollerContainer label="22 ಕಾಲಂಗಳ ವರ್ಗಾವಣೆ ಶೇರು ವರ್ಗಾವಣೆ ವಹಿ (Scroll Vargavane):">
            <table className="w-full text-left text-xs whitespace-nowrap">`;

  const targetClose = `              </tbody>
            </table>
          </div>
        )}`;

  const replacementClose = `              </tbody>
            </table>
          </TableScrollerContainer>
        )}`;

  if (content.includes(targetOpen) && content.includes(targetClose)) {
    content = content.replace(targetOpen, replacementOpen);
    content = content.replace(targetClose, replacementClose);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[PASS] VargavaneTransferModule.jsx updated with TableScrollerContainer');
  } else {
    console.error('[FAIL] VargavaneTransferModule.jsx table targets not found');
  }
}

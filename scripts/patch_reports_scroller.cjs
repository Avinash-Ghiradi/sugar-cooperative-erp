const fs = require('fs');
const path = require('path');

// Patch ShareholderReports.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Reports/ShareholderReports.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  if (!content.includes('TableScrollerContainer')) {
    content = "import TableScrollerContainer from '../Common/TableScrollerContainer';\n" + content;
  }

  // Replace each of the 6 tables' wrapper
  // 1. Placewise
  content = content.replace(
    '<div className="overflow-x-auto">\n                  <table className="w-full text-left text-xs border-collapse">',
    '<TableScrollerContainer label="ಗ್ರಾಮವಾರು ಸಾರಾಂಶ (Scroll Places):">\n                  <table className="w-full text-left text-xs border-collapse">'
  );

  // 2. Categorywise
  content = content.replace(
    '<div className="overflow-x-auto">\n                  <table className="w-full text-left text-xs border-collapse">',
    '<TableScrollerContainer label="ವರ್ಗವಾರು ಸಾರಾಂಶ (Scroll Categories):">\n                  <table className="w-full text-left text-xs border-collapse">'
  );

  // 3. Circlewise
  content = content.replace(
    '<div className="overflow-x-auto">\n                  <table className="w-full text-left text-xs border-collapse">',
    '<TableScrollerContainer label="ವಲಯವಾರು ಸಾರಾಂಶ (Scroll Circles):">\n                  <table className="w-full text-left text-xs border-collapse">'
  );

  // 4. Shareswise
  content = content.replace(
    '<div className="overflow-x-auto">\n                  <table className="w-full text-left text-xs border-collapse">',
    '<TableScrollerContainer label="ಶೇರುವಾರು ಸಾರಾಂಶ (Scroll Shares):">\n                  <table className="w-full text-left text-xs border-collapse">'
  );

  // 5. Amountwise
  content = content.replace(
    '<div className="overflow-x-auto">\n                  <table className="w-full text-left text-xs border-collapse">',
    '<TableScrollerContainer label="ಮೊತ್ತವಾರು ಸಾರಾಂಶ (Scroll Amount):">\n                  <table className="w-full text-left text-xs border-collapse">'
  );

  // 6. Member-wise details
  content = content.replace(
    '<div className="overflow-x-auto">\n                  <table className="w-full text-left text-xs border-collapse">',
    '<TableScrollerContainer label="ಸದಸ್ಯರ ಸಂಪೂರ್ಣ ವಿವರ ವರದಿ (Scroll Members):">\n                  <table className="w-full text-left text-xs border-collapse">'
  );

  // Close tags for the 6 tables
  // We can replace the closing </div> of each table:
  content = content.split('                  </table>\n                </div>').join('                  </table>\n                </TableScrollerContainer>');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] ShareholderReports.jsx updated with TableScrollerContainer');
}

// Patch CircleMaster.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Master/CircleMaster.jsx');
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  if (!content.includes('TableScrollerContainer')) {
    content = "import TableScrollerContainer from '../Common/TableScrollerContainer';\n" + content;
  }

  content = content.replace(
    '<div className="overflow-x-auto">\n              <table className="w-full text-left border-collapse text-xs">',
    '<TableScrollerContainer label="ಸರ್ಕಲ್ & ಗ್ರಾಮಗಳ ವಹಿ (Scroll Directory):">\n              <table className="w-full text-left border-collapse text-xs">'
  );
  content = content.replace(
    '              </table>\n            </div>\n          </div>',
    '              </table>\n            </TableScrollerContainer>\n          </div>'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] CircleMaster.jsx updated with TableScrollerContainer');
}

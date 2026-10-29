import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  VerticalAlign,
  BorderStyle,
  PageOrientation
} from 'docx';

// Thin crisp solid black border for statutory register grid
const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '000000'
};

const cellBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder
};

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const noTableBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
  insideHorizontal: noBorder,
  insideVertical: noBorder
};
const noCellBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder
};
const noBorders = noTableBorders;

// Date formatter to DD/MM/YYYY
export function formatDocxDate(dateStr) {
  if (!dateStr) {
    const d = new Date();
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }
  const clean = String(dateStr).trim();
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return parts[2].padStart(2, '0') + '/' + parts[1].padStart(2, '0') + '/' + parts[0];
    }
    return parts[0].padStart(2, '0') + '/' + parts[1].padStart(2, '0') + '/' + parts[2];
  }
  return clean;
}

// Normalize category to Kannada class format (e.g. "ಅ ವರ್ಗ", "ಡ ವರ್ಗ")
export function normalizeCategory(cat) {
  if (!cat) return 'ಅ ವರ್ಗ';
  const c = String(cat).trim();
  if (c.includes('ಅ') || c.toLowerCase().includes('class a')) return 'ಅ ವರ್ಗ';
  if (c.includes('ಬ') || c.toLowerCase().includes('class b')) return 'ಬ ವರ್ಗ';
  if (c.includes('ಕ') || c.toLowerCase().includes('class c')) return 'ಕ ವರ್ಗ';
  if (c.includes('ಡ') || c.toLowerCase().includes('class d')) return 'ಡ ವರ್ಗ';
  if (c.endsWith('ವರ್ಗ')) return c;
  return c + ' ವರ್ಗ';
}

/**
 * Builds the Word Document (.docx) matching the statutory 7-column layout:
 * "ಹೊಸ ಶೇರುದಾರರ ಅರ್ಜಿ ಯಾದಿ 2025 – 26 [07/03/2026]"
 * Using Google Anek Kannada font with executive landscape layout and statutory signatures.
 */
export function buildEnrollmentDocx({
  records = [],
  season = '2025 – 26',
  listDate = '',
  societyNameKn = 'ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ',
  societyNameEn = 'SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR',
  taluk = 'ಚಡಚಣ',
  dist = 'ವಿಜಯಪೂರ'
} = {}) {
  // Official Google Anek Kannada font definition
  const KANNADA_FONT = {
    name: 'Anek Kannada',
    cs: 'Anek Kannada',
    ascii: 'Anek Kannada',
    hAnsi: 'Anek Kannada'
  };

  const effectiveDate = listDate ? formatDocxDate(listDate) : formatDocxDate();

  let totalSharesCount = 0;

  // Construct Data Rows
  const dataRows = records.map((record, index) => {
    const slNo = String(index + 1).padStart(2, '0');
    const name = String(record.full_name || record.shareholder_name || record.name || '').trim();
    const place = String(record.place || record.village_name || '').trim();
    const recTaluk = String(record.taluk || taluk).trim();
    const recDist = String(record.dist || record.district || dist).trim();

    const villageLine = place ? (place.startsWith('ಸಾ||') || place.startsWith('ಸಾ॥') ? place : 'ಸಾ॥ ' + place) : '';
    const talukText = recTaluk.startsWith('ತಾ||') || recTaluk.startsWith('ತಾ॥') ? recTaluk : 'ತಾ॥ ' + recTaluk;
    const distText = recDist.startsWith('ಜಿ||') || recDist.startsWith('ಜಿ॥') ? recDist : 'ಜಿ॥ ' + recDist;
    const talukDistLine = talukText + '      ' + distText;

    const appDate = formatDocxDate(record.date || record.application_date || record.tharava_date);
    const receiptNo = String(record.receipt_no || record.receipt || '').trim();
    const rawAmt = record.share_amount || record.total_amount || ((record.no_shares || 1) * 24000);
    const formattedAmt = rawAmt ? Math.round(Number(rawAmt)) : 24000;
    const receiptAndAmt = receiptNo ? receiptNo + ' (' + formattedAmt + ')' : '(' + formattedAmt + ')';

    const cat = normalizeCategory(record.category);
    const sharesNum = parseInt(record.no_shares || record.number_of_shares || 1, 10) || 1;
    totalSharesCount += sharesNum;
    const shares = String(sharesNum);
    const remarks = String(record.remarks || '');

    return new TableRow({
      cantSplit: true,
      children: [
        // Col 1: ಅ ನಂ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: slNo, size: 20, font: KANNADA_FONT, noProof: true })]
            })
          ]
        }),
        // Col 2: ಹೊಸ ಶೇರು ಅರ್ಜಿ ಮಾಡುವವರ ಸದಸ್ಯರ ಹೆಸರು ಹಾಗೂ ವಿಳಾಸ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 120, right: 100 },
          children: [
            new Paragraph({
              spacing: { before: 20, after: 10, line: 240 },
              children: [new TextRun({ text: name, bold: true, size: 21, font: KANNADA_FONT, noProof: true })]
            }),
            villageLine ? new Paragraph({
              spacing: { before: 0, after: 10, line: 240 },
              children: [new TextRun({ text: villageLine, size: 19, font: KANNADA_FONT, noProof: true })]
            }) : new Paragraph({ spacing: { before: 0, after: 0 } }),
            talukDistLine ? new Paragraph({
              spacing: { before: 0, after: 20, line: 240 },
              children: [new TextRun({ text: talukDistLine, size: 19, font: KANNADA_FONT, noProof: true })]
            }) : new Paragraph({ spacing: { before: 0, after: 0 } })
          ]
        }),
        // Col 3: ಅರ್ಜಿ ದಿನಾಂಕ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: appDate, size: 19, font: KANNADA_FONT, noProof: true })]
            })
          ]
        }),
        // Col 4: ರಶೀದಿ & ಮೊಬಲೆ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: receiptAndAmt, size: 19, font: KANNADA_FONT, noProof: true })]
            })
          ]
        }),
        // Col 5: ವರ್ಗ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: cat, size: 20, font: KANNADA_FONT, noProof: true })]
            })
          ]
        }),
        // Col 6: ಶೇರು ಸಂಖ್ಯೆ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: shares, bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
            })
          ]
        }),
        // Col 7: ಷರಾ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: remarks, size: 19, font: KANNADA_FONT, noProof: true })]
            })
          ]
        })
      ]
    });
  });

  // Grand Total Summary Row
  const totalRow = new TableRow({
    cantSplit: true,
    children: [
      new TableCell({
        columnSpan: 5,
        borders: cellBorders,
        shading: { fill: 'F1F5F9' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'ಒಟ್ಟು (GRAND TOTAL) — ' + records.length + ' ಹೊಸ ಶೇರುದಾರರು',
                bold: true,
                size: 20,
                font: KANNADA_FONT, noProof: true
              })
            ]
          })
        ]
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: 'F1F5F9' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: String(totalSharesCount),
                bold: true,
                size: 20,
                font: KANNADA_FONT, noProof: true
              })
            ]
          })
        ]
      }),
      new TableCell({
        borders: cellBorders,
        shading: { fill: 'F1F5F9' },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ children: [] })]
      })
    ]
  });

  // 7-Column Official Table Header Row
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      new TableCell({
        width: { size: 6, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: 'E5E7EB' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಅ ನಂ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
          })
        ]
      }),
      new TableCell({
        width: { size: 42, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: 'E5E7EB' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 120, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'ಹೊಸ ಶೇರು ಅರ್ಜಿ ಮಾಡುವವರ ಸದಸ್ಯರ ಹೆಸರು ಹಾಗೂ ವಿಳಾಸ',
                bold: true,
                size: 20,
                font: KANNADA_FONT, noProof: true
              })
            ]
          })
        ]
      }),
      new TableCell({
        width: { size: 14, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: 'E5E7EB' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಅರ್ಜಿ ದಿನಾಂಕ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
          })
        ]
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: 'E5E7EB' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ರಶೀದಿ & ಮೊಬಲೆ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
          })
        ]
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: 'E5E7EB' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ವರ್ಗ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
          })
        ]
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: 'E5E7EB' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಶೇರು ಸಂಖ್ಯೆ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
          })
        ]
      }),
      new TableCell({
        width: { size: 7, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: 'E5E7EB' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಷರಾ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
          })
        ]
      })
    ]
  });

  // Statutory 4-Column Signature Block (No box borders, no vertical dividers, clean solid signature lines)
  const signatureBlock = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noTableBorders,
    rows: [
      new TableRow({
        children: [
          // 1. ತಯಾರಿಸಿದವರು
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: noCellBorders,
            margins: { top: 80, bottom: 60, left: 240, right: 240 },
            children: [
              new Paragraph({ spacing: { before: 450, after: 0 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 6 }
                },
                spacing: { before: 80, after: 30, line: 240 },
                children: [
                  new TextRun({ text: 'ತಯಾರಿಸಿದವರು', bold: true, size: 20, font: KANNADA_FONT, noProof: true })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40, line: 220 },
                children: [
                  new TextRun({ text: '(Prepared by / Clerk)', size: 16, font: KANNADA_FONT, color: '333333', noProof: true })
                ]
              })
            ]
          }),
          // 2. ಶೇರು ಶಾಖಾಧಿಕಾರಿ
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: noCellBorders,
            margins: { top: 80, bottom: 60, left: 240, right: 240 },
            children: [
              new Paragraph({ spacing: { before: 450, after: 0 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 6 }
                },
                spacing: { before: 80, after: 30, line: 240 },
                children: [
                  new TextRun({ text: 'ಶೇರು ಶಾಖಾಧಿಕಾರಿ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40, line: 220 },
                children: [
                  new TextRun({ text: '(Share Section Officer)', size: 16, font: KANNADA_FONT, color: '333333', noProof: true })
                ]
              })
            ]
          }),
          // 3. ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿ
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: noCellBorders,
            margins: { top: 80, bottom: 60, left: 240, right: 240 },
            children: [
              new Paragraph({ spacing: { before: 450, after: 0 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 6 }
                },
                spacing: { before: 80, after: 30, line: 240 },
                children: [
                  new TextRun({ text: 'ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40, line: 220 },
                children: [
                  new TextRun({ text: '(Chief Accounts Officer)', size: 16, font: KANNADA_FONT, color: '333333', noProof: true })
                ]
              })
            ]
          }),
          // 4. ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: noCellBorders,
            margins: { top: 80, bottom: 60, left: 240, right: 240 },
            children: [
              new Paragraph({ spacing: { before: 450, after: 0 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 6 }
                },
                spacing: { before: 80, after: 30, line: 240 },
                children: [
                  new TextRun({ text: 'ವ್ಯವಸ್ಥಾಪಕ ನಿರ್ದೇಶಕರು', bold: true, size: 20, font: KANNADA_FONT, noProof: true })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 40, line: 220 },
                children: [
                  new TextRun({ text: '(Managing Director)', size: 16, font: KANNADA_FONT, color: '333333', noProof: true })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Anek Kannada',
            size: 20
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 16838, // A4 Landscape
              height: 11906
            },
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720
            }
          }
        },
        children: [
          // Line 1: Kannada Company Name
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60, line: 260 },
            children: [
              new TextRun({
                text: societyNameKn,
                bold: true,
                size: 32,
                font: KANNADA_FONT, noProof: true
              })
            ]
          }),
          // Line 2: English Company Name
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 120, line: 240 },
            children: [
              new TextRun({
                text: societyNameEn,
                bold: true,
                size: 20,
                font: KANNADA_FONT, noProof: true
              })
            ]
          }),
          // Line 3: 3-column Sub-header (Taluk, Department, District)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: noBorders,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [
                          new TextRun({
                            text: 'ತಾಲೂಕ॥ ' + taluk,
                            bold: true,
                            size: 22,
                            font: KANNADA_FONT, noProof: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    borders: noBorders,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'ಶೇರು ವಿಭಾಗ',
                            bold: true,
                            size: 30,
                            font: KANNADA_FONT, noProof: true
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    borders: noBorders,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({
                            text: 'ಜಿಲ್ಲಾ॥ ' + dist,
                            bold: true,
                            size: 22,
                            font: KANNADA_FONT, noProof: true
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),
          // Line 4: List Title Banner with Season and Date
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 180 },
            children: [
              new TextRun({
                text: 'ಹೊಸ ಶೇರುದಾರರ ಅರ್ಜಿ ಯಾದಿ ' + season + ' [' + effectiveDate + ']',
                bold: true,
                size: 24,
                font: KANNADA_FONT, noProof: true
              })
            ]
          }),
          // Main 7-Column Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [headerRow, ...dataRows, totalRow]
          }),
          // Spacing before signatures
          new Paragraph({ text: '', spacing: { before: 400, after: 100 } }),
          // Signatures
          signatureBlock
        ]
      }
    ]
  });
}

/**
 * Generates and triggers browser download of the .docx file
 */
export async function downloadEnrollmentDocx(options = {}) {
  const doc = buildEnrollmentDocx(options);
  const blob = await Packer.toBlob(doc);

  const cleanSeason = (options.season || '2025-26').replace(/\s+/g, '_').replace(/–/g, '-');
  const cleanDate = (options.listDate ? formatDocxDate(options.listDate) : formatDocxDate()).replace(/\//g, '-');
  const filename = options.filename || 'Hosa_Sherudarara_Arji_Yadi_' + cleanSeason + '_' + cleanDate + '.docx';

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return true;
}

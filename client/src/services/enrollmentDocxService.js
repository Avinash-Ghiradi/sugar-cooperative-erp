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
  BorderStyle
} from 'docx';

// Thin solid black border for standard statutory register grid
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
const noBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder
};

// Date formatter to DD/MM/YYYY
export function formatDocxDate(dateStr) {
  if (!dateStr) {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  const clean = String(dateStr).trim();
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD/MM/YYYY
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    // DD-MM-YYYY or MM-DD-YYYY
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
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
  return `${c} ವರ್ಗ`;
}

/**
 * Builds the Word Document (.docx) matching the statutory 7-column layout:
 * "ಹೊಸ ಶೇರುದಾರರ ಅರ್ಜಿ ಯಾದಿ 2025 – 26 [07/03/2026]"
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
  const KANNADA_FONT = { name: 'Calibri', cs: 'Nirmala UI' };
  const effectiveDate = listDate ? formatDocxDate(listDate) : formatDocxDate();

  // Construct Data Rows
  const dataRows = records.map((record, index) => {
    const slNo = String(index + 1).padStart(2, '0');
    const name = String(record.full_name || record.shareholder_name || record.name || '').trim();
    const place = String(record.place || record.village_name || '').trim();
    const recTaluk = String(record.taluk || taluk).trim();
    const recDist = String(record.dist || record.district || dist).trim();

    const villageLine = place ? (place.startsWith('ಸಾ||') ? place : `ಸಾ||${place}`) : '';
    const talukText = recTaluk.startsWith('ತಾ||') ? recTaluk : `ತಾ||${recTaluk}`;
    const distText = recDist.startsWith('ಜಿ||') ? recDist : `ಜಿ||${recDist}`;
    const talukDistLine = `${talukText} ${distText}`;

    const appDate = formatDocxDate(record.date || record.application_date || record.tharava_date);
    const receiptNo = String(record.receipt_no || record.receipt || '').trim();
    const rawAmt = record.share_amount || record.total_amount || ((record.no_shares || 1) * 24000);
    const formattedAmt = rawAmt ? Math.round(Number(rawAmt)) : 24000;
    const receiptAndAmt = receiptNo ? `${receiptNo} (${formattedAmt})` : `(${formattedAmt})`;

    const cat = normalizeCategory(record.category);
    const shares = String(record.no_shares || record.number_of_shares || 1);
    const remarks = String(record.remarks || '');

    return new TableRow({
      cantSplit: true,
      children: [
        // Col 1: ಅ ನಂ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: slNo, size: 20, font: KANNADA_FONT })]
            })
          ]
        }),
        // Col 2: ಹೊಸ ಶೇರು ಅರ್ಜಿ ಮಾಡುವವರ ಸದಸ್ಯರ ಹೆಸರು ಹಾಗೂ ವಿಳಾಸ (3 lines)
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              spacing: { before: 20, after: 10, line: 240 },
              children: [new TextRun({ text: name, bold: true, size: 20, font: KANNADA_FONT })]
            }),
            villageLine ? new Paragraph({
              spacing: { before: 0, after: 10, line: 240 },
              children: [new TextRun({ text: villageLine, size: 19, font: KANNADA_FONT })]
            }) : null,
            new Paragraph({
              spacing: { before: 0, after: 20, line: 240 },
              children: [new TextRun({ text: talukDistLine, size: 19, font: KANNADA_FONT })]
            })
          ].filter(Boolean)
        }),
        // Col 3: ಅರ್ಜಿ ದಿನಾಂಕ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: appDate, size: 19, font: KANNADA_FONT })]
            })
          ]
        }),
        // Col 4: ರಶೀದಿ & ಮೊಬಲೆ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: receiptAndAmt, size: 19, font: KANNADA_FONT })]
            })
          ]
        }),
        // Col 5: ವರ್ಗ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: cat, size: 19, font: KANNADA_FONT })]
            })
          ]
        }),
        // Col 6: ಶೇರು ಸಂಖ್ಯೆ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: shares, size: 20, font: KANNADA_FONT })]
            })
          ]
        }),
        // Col 7: ಷರಾ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: remarks, size: 19, font: KANNADA_FONT })]
            })
          ]
        })
      ]
    });
  });

  // Header Row (repeats on each page)
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      new TableCell({
        width: { size: 7, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಅ ನಂ', bold: true, size: 20, font: KANNADA_FONT })]
          })
        ]
      }),
      new TableCell({
        width: { size: 41, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'ಹೊಸ ಶೇರು ಅರ್ಜಿ ಮಾಡುವವರ ಸದಸ್ಯರ ಹೆಸರು ಹಾಗೂ ವಿಳಾಸ',
                bold: true,
                size: 20,
                font: KANNADA_FONT
              })
            ]
          })
        ]
      }),
      new TableCell({
        width: { size: 14, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಅರ್ಜಿ ದಿನಾಂಕ', bold: true, size: 20, font: KANNADA_FONT })]
          })
        ]
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ರಶೀದಿ & ಮೊಬಲೆ', bold: true, size: 20, font: KANNADA_FONT })]
          })
        ]
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ವರ್ಗ', bold: true, size: 20, font: KANNADA_FONT })]
          })
        ]
      }),
      new TableCell({
        width: { size: 7, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಶೇರು ಸಂಖ್ಯೆ', bold: true, size: 20, font: KANNADA_FONT })]
          })
        ]
      }),
      new TableCell({
        width: { size: 7, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಷರಾ', bold: true, size: 20, font: KANNADA_FONT })]
          })
        ]
      })
    ]
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
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
                font: KANNADA_FONT
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
                font: KANNADA_FONT
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
                            text: `ತಾಲೂಕ॥ ${taluk}`,
                            bold: true,
                            size: 22,
                            font: KANNADA_FONT
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
                            font: KANNADA_FONT
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
                            text: `ಜಿಲ್ಲಾ॥ ${dist}`,
                            bold: true,
                            size: 22,
                            font: KANNADA_FONT
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
                text: `ಹೊಸ ಶೇರುದಾರರ ಅರ್ಜಿ ಯಾದಿ ${season} [${effectiveDate}]`,
                bold: true,
                size: 24,
                font: KANNADA_FONT
              })
            ]
          }),
          // Main 7-Column Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [headerRow, ...dataRows]
          })
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
  const filename = options.filename || `Hosa_Sherudarara_Arji_Yadi_${cleanSeason}_${cleanDate}.docx`;

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

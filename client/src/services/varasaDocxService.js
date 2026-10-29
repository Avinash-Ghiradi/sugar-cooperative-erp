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

// Extract class letter e.g. "ಅ", "ಬ", "ಕ", "ಡ"
export function getClassLetter(cat) {
  if (!cat) return 'ಅ';
  const c = String(cat).trim();
  if (c.includes('ಅ') || c.toLowerCase().includes('class a') || c.toLowerCase().includes('a')) return 'ಅ';
  if (c.includes('ಬ') || c.toLowerCase().includes('class b') || c.toLowerCase().includes('b')) return 'ಬ';
  if (c.includes('ಕ') || c.toLowerCase().includes('class c') || c.toLowerCase().includes('c')) return 'ಕ';
  if (c.includes('ಡ') || c.toLowerCase().includes('class d') || c.toLowerCase().includes('d')) return 'ಡ';
  return 'ಅ';
}

/**
 * Builds the Word Document (.docx) matching the statutory 7-column layout:
 * "ವಾರಸಾ ಯಾದಿ 2025 – 26 [14/10/2025]"
 */
export function buildVarasaDocx({
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

  const dataRows = records.map((record, index) => {
    const slNo = String(index + 1);

    // Deceased Details
    const shName = String(record.shareholder_name || record.existing_shareholder_name || '').trim();
    const shPlace = String(record.shareholder_place || '').trim();
    const shTaluk = String(record.shareholder_taluk || taluk).trim();
    const shDist = String(record.shareholder_district || dist).trim();
    const shVillageLine = shPlace ? (shPlace.startsWith('ಸಾ॥') || shPlace.startsWith('ಸಾ||') ? shPlace : `ಸಾ॥ ${shPlace}`) : '';
    const shTalukDistLine = `ತಾ॥ ${shTaluk.replace(/^ತಾ[॥|]/, '').trim()}      ಜಿ॥ ${shDist.replace(/^ಜಿ[॥|]/, '').trim()}`;

    // Date of Death
    const dod = formatDocxDate(record.dod || record.date_of_death || '');

    // Heir Transferee Details
    const heirName = String(record.varasa_member || record.heir_name || '').trim();
    const heirPlace = String(record.heir_place || '').trim();
    const heirTaluk = String(record.heir_taluk || taluk).trim();
    const heirDist = String(record.heir_district || dist).trim();
    const heirVillageLine = heirPlace ? (heirPlace.startsWith('ಸಾ॥') || heirPlace.startsWith('ಸಾ||') ? heirPlace : `ಸಾ॥ ${heirPlace}`) : '';
    const heirTalukDistLine = `ತಾ॥ ${heirTaluk.replace(/^ತಾ[॥|]/, '').trim()}      ಜಿ॥ ${heirDist.replace(/^ಜಿ[॥|]/, '').trim()}`;

    // Relationship
    const rel = String(record.heir_relationship || record.relationship || 'ಮಗ').trim();

    // Share Number
    const shareNo = String(record.share_no || record.existing_share_number || '').trim().replace(/^#/, '');

    // Class & Share Count: e.g. "ಅ" - 1
    const classLetter = getClassLetter(record.category);
    const shares = String(record.no_of_shares || record.existing_shares || record.shares || 1);
    const classAndShares = `"${classLetter}" - ${shares}`;

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
        // Col 2: ಮೃತ ಸದಸ್ಯರ ಹೆಸರು ಹಾಗೂ ವಿಳಾಸ (3 lines)
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              spacing: { before: 20, after: 10, line: 240 },
              children: [new TextRun({ text: shName, bold: true, size: 20, font: KANNADA_FONT })]
            }),
            shVillageLine ? new Paragraph({
              spacing: { before: 0, after: 10, line: 240 },
              children: [new TextRun({ text: shVillageLine, size: 19, font: KANNADA_FONT })]
            }) : null,
            new Paragraph({
              spacing: { before: 0, after: 20, line: 240 },
              children: [new TextRun({ text: shTalukDistLine, size: 19, font: KANNADA_FONT })]
            })
          ].filter(Boolean)
        }),
        // Col 3: ಮೃತ ದಿನಾಂಕ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: dod, size: 19, font: KANNADA_FONT })]
            })
          ]
        }),
        // Col 4: ಶೇರು ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳುವವರ ಹೆಸರು & ವಿಳಾಸ (3 lines)
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              spacing: { before: 20, after: 10, line: 240 },
              children: [new TextRun({ text: heirName, bold: true, size: 20, font: KANNADA_FONT })]
            }),
            heirVillageLine ? new Paragraph({
              spacing: { before: 0, after: 10, line: 240 },
              children: [new TextRun({ text: heirVillageLine, size: 19, font: KANNADA_FONT })]
            }) : null,
            new Paragraph({
              spacing: { before: 0, after: 20, line: 240 },
              children: [new TextRun({ text: heirTalukDistLine, size: 19, font: KANNADA_FONT })]
            })
          ].filter(Boolean)
        }),
        // Col 5: ಸೇರ ಸಂಬಂಧ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: rel, size: 20, font: KANNADA_FONT })]
            })
          ]
        }),
        // Col 6: ಶೇರು ಖಾತೆ ನಂ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: shareNo, bold: true, size: 20, font: KANNADA_FONT })]
            })
          ]
        }),
        // Col 7: ವರ್ಗ ಹಾಗೂ ಶೇರು ಸಂಖ್ಯೆ (e.g. "ಅ" - 1)
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: classAndShares, bold: true, size: 20, font: KANNADA_FONT })]
            })
          ]
        })
      ]
    });
  });

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      new TableCell({
        width: { size: 6, type: WidthType.PERCENTAGE },
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
        width: { size: 27, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಮೃತ ಸದಸ್ಯರ ಹೆಸರು ಹಾಗೂ ವಿಳಾಸ', bold: true, size: 20, font: KANNADA_FONT })]
          })
        ]
      }),
      new TableCell({
        width: { size: 13, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಮೃತ ದಿನಾಂಕ', bold: true, size: 20, font: KANNADA_FONT })]
          })
        ]
      }),
      new TableCell({
        width: { size: 27, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಶೇರು ವಾರಸಾ ಮಾಡಿಕೊಳ್ಳುವವರ ಹೆಸರು & ವಿಳಾಸ', bold: true, size: 20, font: KANNADA_FONT })]
          })
        ]
      }),
      new TableCell({
        width: { size: 9, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಸೇರ ಸಂಬಂಧ', bold: true, size: 20, font: KANNADA_FONT })]
          })
        ]
      }),
      new TableCell({
        width: { size: 9, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಶೇರು ಖಾತೆ ನಂ', bold: true, size: 20, font: KANNADA_FONT })]
          })
        ]
      }),
      new TableCell({
        width: { size: 9, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ವರ್ಗ ಹಾಗೂ ಶೇರು ಸಂಖ್ಯೆ', bold: true, size: 20, font: KANNADA_FONT })]
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
          // Line 4: List Title Banner with Season and Date: "ವಾರಸಾ ಯಾದಿ 2025 – 26 [14/10/2025]"
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 180 },
            children: [
              new TextRun({
                text: `ವಾರಸಾ ಯಾದಿ ${season} [${effectiveDate}]`,
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
 * Generates and triggers browser download of the Varasa .docx file
 */
export async function downloadVarasaDocx(options = {}) {
  const doc = buildVarasaDocx(options);
  const blob = await Packer.toBlob(doc);

  const cleanSeason = (options.season || '2025-26').replace(/\s+/g, '_').replace(/–/g, '-');
  const cleanDate = (options.listDate ? formatDocxDate(options.listDate) : formatDocxDate()).replace(/\//g, '-');
  const filename = options.filename || `Varasa_Yadi_${cleanSeason}_${cleanDate}.docx`;

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

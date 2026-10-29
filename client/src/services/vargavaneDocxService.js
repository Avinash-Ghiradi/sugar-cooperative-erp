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

// Helper to normalize Class/Category letter (e.g. "ಅ", "ಬ")
export function getClassLetter(cat) {
  if (!cat) return 'ಅ';
  const c = String(cat).trim();
  if (c.includes('ಅ') || c.toLowerCase().includes('class a') || c.toLowerCase().includes('a')) return 'ಅ';
  if (c.includes('ಬ') || c.toLowerCase().includes('class b') || c.toLowerCase().includes('b')) return 'ಬ';
  if (c.includes('ಕ') || c.toLowerCase().includes('class c') || c.toLowerCase().includes('c')) return 'ಕ';
  if (c.includes('ಡ') || c.toLowerCase().includes('class d') || c.toLowerCase().includes('d')) return 'ಡ';
  return c.charAt(0);
}

/**
 * Builds the Word Document (.docx) matching the statutory 7-column layout:
 * "ವರ್ಗಾವಣೆ ಯಾದಿ 2024 – 25 [23/10/2024]"
 * Using Google Anek Kannada font with executive landscape layout and statutory signatures.
 */
export function buildVargavaneDocx({
  records = [],
  season = '2024 – 25',
  listDate = '',
  societyNameKn = 'ಶ್ರೀ ಭೀಮಾಶಂಕರ ಸಹಕಾರಿ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ನಿ, ಮರಗೂರ',
  societyNameEn = 'SRI BHIMASHANKAR SAHAKARI SAKKARE KARKHANE NIYAMIT MARGUR',
  taluk = 'ಚಡಚಣ',
  dist = 'ವಿಜಯಪೂರ'
} = {}) {
  const KANNADA_FONT = {
    name: 'Anek Kannada',
    cs: 'Anek Kannada',
    ascii: 'Anek Kannada',
    hAnsi: 'Anek Kannada'
  };

  const effectiveDate = listDate ? formatDocxDate(listDate) : formatDocxDate();

  let totalSharesCount = 0;

  const dataRows = records.map((record, index) => {
    const slNo = String(index + 1);

    // Transferor Details (Person transferring the share)
    const transferorName = String(record.transferor_name || record.shareholder_name || '').trim();
    const transferorPlace = String(record.transferor_place || record.shareholder_place || '').trim();
    const transferorTaluk = String(record.transferor_taluk || record.shareholder_taluk || taluk).trim();
    const transferorDist = String(record.transferor_district || record.shareholder_district || dist).trim();
    const transferorVillageLine = transferorPlace ? (transferorPlace.startsWith('ಸಾ॥') || transferorPlace.startsWith('ಸಾ||') ? transferorPlace : 'ಸಾ॥ ' + transferorPlace) : '';
    const transferorTalukDistLine = 'ತಾ॥ ' + transferorTaluk.replace(/^ತಾ[॥|]/, '').trim() + '      ಜಿ॥ ' + transferorDist.replace(/^ಜಿ[॥|]/, '').trim();

    // Application / Transfer Date
    const appDate = formatDocxDate(record.application_date || record.receipt_date || record.date || '');

    // Transferee Details (Person receiving the share)
    const transfereeName = String(record.transferee_name || record.heir_name || '').trim();
    const transfereePlace = String(record.transferee_place || '').trim();
    const transfereeTaluk = String(record.transferee_taluk || taluk).trim();
    const transfereeDist = String(record.transferee_district || dist).trim();
    const transfereeVillageLine = transfereePlace ? (transfereePlace.startsWith('ಸಾ॥') || transfereePlace.startsWith('ಸಾ||') ? transfereePlace : 'ಸಾ॥ ' + transfereePlace) : '';
    const transfereeTalukDistLine = 'ತಾ॥ ' + transfereeTaluk.replace(/^ತಾ[॥|]/, '').trim() + '      ಜಿ॥ ' + transfereeDist.replace(/^ಜಿ[॥|]/, '').trim();

    // Relationship
    const rel = String(record.transferee_relationship || record.relationship || 'ಮಗ').trim();

    // Share Number
    const shareNo = String(record.share_no || record.existing_share_number || '').trim().replace(/^#/, '');

    // Class & Share Count: e.g. "ಅ" - 2
    const classLetter = getClassLetter(record.category);
    const sharesNum = parseInt(record.no_of_shares || record.existing_shares || record.shares || 1, 10) || 1;
    totalSharesCount += sharesNum;
    const classAndShares = '"' + classLetter + '" - ' + sharesNum;

    return new TableRow({
      cantSplit: true,
      children: [
        // Col 1: ಅ ನಂ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: slNo, size: 20, font: KANNADA_FONT, noProof: true })]
            })
          ]
        }),
        // Col 2: ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರ ಸದಸ್ಯರ ಹೆಸರು ಹಾಗೂ ವಿಳಾಸ (3 lines)
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 120, right: 100 },
          children: [
            new Paragraph({
              spacing: { before: 20, after: 10, line: 240 },
              children: [new TextRun({ text: transferorName, bold: true, size: 21, font: KANNADA_FONT, noProof: true })]
            }),
            transferorVillageLine ? new Paragraph({
              spacing: { before: 0, after: 10, line: 240 },
              children: [new TextRun({ text: transferorVillageLine, size: 19, font: KANNADA_FONT, noProof: true })]
            }) : new Paragraph({ spacing: { before: 0, after: 0 } }),
            transferorTalukDistLine ? new Paragraph({
              spacing: { before: 0, after: 20, line: 240 },
              children: [new TextRun({ text: transferorTalukDistLine, size: 19, font: KANNADA_FONT, noProof: true })]
            }) : new Paragraph({ spacing: { before: 0, after: 0 } })
          ]
        }),
        // Col 3: ದಿನಾಂಕ
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
        // Col 4: ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಿಸಿಕೊಳ್ಳುವವರ ಹೆಸರು & ವಿಳಾಸ (3 lines)
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 120, right: 100 },
          children: [
            new Paragraph({
              spacing: { before: 20, after: 10, line: 240 },
              children: [new TextRun({ text: transfereeName, bold: true, size: 21, font: KANNADA_FONT, noProof: true })]
            }),
            transfereeVillageLine ? new Paragraph({
              spacing: { before: 0, after: 10, line: 240 },
              children: [new TextRun({ text: transfereeVillageLine, size: 19, font: KANNADA_FONT, noProof: true })]
            }) : new Paragraph({ spacing: { before: 0, after: 0 } }),
            transfereeTalukDistLine ? new Paragraph({
              spacing: { before: 0, after: 20, line: 240 },
              children: [new TextRun({ text: transfereeTalukDistLine, size: 19, font: KANNADA_FONT, noProof: true })]
            }) : new Paragraph({ spacing: { before: 0, after: 0 } })
          ]
        }),
        // Col 5: ಸೇರ ಸಂಬಂಧ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: rel, size: 20, font: KANNADA_FONT, noProof: true })]
            })
          ]
        }),
        // Col 6: ಶೇರು ಖಾತೆ ನಂ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: shareNo, bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
            })
          ]
        }),
        // Col 7: ವರ್ಗ ಹಾಗೂ ಶೇರು ಸಂಖ್ಯೆ
        new TableCell({
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: classAndShares, bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
            })
          ]
        })
      ]
    });
  });

  // Grand Total Row
  const totalRow = new TableRow({
    cantSplit: true,
    children: [
      new TableCell({
        columnSpan: 6,
        borders: cellBorders,
        shading: { fill: 'F1F5F9' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'ಒಟ್ಟು (GRAND TOTAL) — ' + records.length + ' ವರ್ಗಾವಣೆಗಳು',
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
                text: 'ಒಟ್ಟು ಶೇರು: ' + totalSharesCount,
                bold: true,
                size: 20,
                font: KANNADA_FONT, noProof: true
              })
            ]
          })
        ]
      })
    ]
  });

  // Header Row matching Image 1
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
        width: { size: 28, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: 'E5E7EB' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡುವವರ ಸದಸ್ಯರ ಹೆಸರು ಹಾಗೂ ವಿಳಾಸ',
                bold: true,
                size: 20,
                font: KANNADA_FONT, noProof: true
              })
            ]
          })
        ]
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: 'E5E7EB' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ದಿನಾಂಕ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
          })
        ]
      }),
      new TableCell({
        width: { size: 28, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: 'E5E7EB' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'ಶೇರು ವರ್ಗಾವಣೆ ಮಾಡಿಸಿಕೊಳ್ಳುವವರ ಹೆಸರು & ವಿಳಾಸ',
                bold: true,
                size: 20,
                font: KANNADA_FONT, noProof: true
              })
            ]
          })
        ]
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        shading: { fill: 'E5E7EB' },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'ಸೇರ ಸಂಬಂಧ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
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
            children: [new TextRun({ text: 'ಶೇರು ಖಾತೆ ನಂ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
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
            children: [new TextRun({ text: 'ವರ್ಗ ಹಾಗೂ ಶೇರು ಸಂಖ್ಯೆ', bold: true, size: 20, font: KANNADA_FONT, noProof: true })]
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
          // Line 4: List Title Banner with Season and Date: "ವರ್ಗಾವಣೆ ಯಾದಿ 2024 – 25 [23/10/2024]"
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 180 },
            children: [
              new TextRun({
                text: 'ವರ್ಗಾವಣೆ ಯಾದಿ ' + season + ' [' + effectiveDate + ']',
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
 * Generates and triggers browser download of the Vargavane .docx file
 */
export async function downloadVargavaneDocx(options = {}) {
  const doc = buildVargavaneDocx(options);
  const blob = await Packer.toBlob(doc);

  const cleanSeason = (options.season || '2024-25').replace(/\s+/g, '_').replace(/–/g, '-');
  const cleanDate = (options.listDate ? formatDocxDate(options.listDate) : formatDocxDate()).replace(/\//g, '-');
  const filename = options.filename || 'Vargavane_Yadi_' + cleanSeason + '_' + cleanDate + '.docx';

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

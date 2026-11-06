import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  PageBreak,
  Footer,
  PageNumber,
} from 'docx';
import { StudentInfo } from '../types/siwes';

// Helper to parse markdown inline bold/italic formatting into TextRun array
function parseInlineFormatting(
  text: string,
  options: {
    font?: string;
    size?: number;
    color?: string;
    bold?: boolean;
    italics?: boolean;
  } = {}
): TextRun[] {
  const font = options.font || 'Times New Roman';
  const size = options.size || 24; // 12pt (24 half-points)
  const color = options.color || '000000';
  const baseBold = options.bold || false;
  const baseItalics = options.italics || false;

  const runs: TextRun[] = [];
  // Regex to match **bold**, *italic*, and `code`
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|`[^`]+`)/g;

  const parts = text.split(tokenRegex);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          font,
          size,
          color,
          bold: true,
          italics: baseItalics,
        })
      );
    } else if (part.startsWith('__') && part.endsWith('__') && part.length > 4) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          font,
          size,
          color,
          bold: true,
          italics: baseItalics,
        })
      );
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      runs.push(
        new TextRun({
          text: part.slice(1, -1),
          font,
          size,
          color,
          bold: baseBold,
          italics: true,
        })
      );
    } else if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      runs.push(
        new TextRun({
          text: part.slice(1, -1),
          font,
          size,
          color,
          bold: baseBold,
          italics: true,
        })
      );
    } else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      runs.push(
        new TextRun({
          text: part.slice(1, -1),
          font: 'Courier New',
          size: Math.max(20, size - 2),
          color,
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          font,
          size,
          color,
          bold: baseBold,
          italics: baseItalics,
        })
      );
    }
  }

  if (!text || text.trim().length === 0) {
    return [new TextRun({ text: ' ', font, size, color, bold: baseBold, italics: baseItalics })];
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text: text || ' ', font, size, color, bold: baseBold, italics: baseItalics }));
  }

  return runs;
}

// Convert markdown table block into a native docx Table with exact 1pt borders and clean padding
function buildDocxTable(tableLines: string[]): Table | null {
  const rows: TableRow[] = [];
  const contentLines = tableLines.filter((l) => !l.match(/^\|?\s*[-:\s|]+\s*\|?$/));

  if (contentLines.length === 0) return null;

  for (let rowIndex = 0; rowIndex < contentLines.length; rowIndex++) {
    const rawLine = contentLines[rowIndex];
    // Split by pipe and trim
    const rawCells = rawLine
      .split('|')
      .map((c) => c.trim())
      .filter((_, idx, arr) => {
        // filter out empty leading/trailing elements from `| cell 1 | cell 2 |`
        if (idx === 0 && rawLine.startsWith('|')) return false;
        if (idx === arr.length - 1 && rawLine.endsWith('|')) return false;
        return true;
      });

    if (rawCells.length === 0) continue;

    const isHeader = rowIndex === 0;
    const colCount = Math.max(1, rawCells.length);
    const cellWidthPct = Math.max(8, Math.floor(100 / colCount));

    const tableCells: TableCell[] = rawCells.map((cellText) => {
      return new TableCell({
        width: { size: cellWidthPct, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: { before: 80, after: 80, line: 260 },
            children: parseInlineFormatting(cellText || ' ', {
              font: 'Times New Roman',
              size: 20, // 10pt
              bold: isHeader,
              color: '000000',
            }),
          }),
        ],
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
          left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
          right: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
        },
      });
    });

    rows.push(
      new TableRow({
        tableHeader: isHeader,
        cantSplit: true,
        children: tableCells,
      })
    );
  }

  if (rows.length === 0) return null;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    },
    rows,
  });
}

export async function exportStructuredDocx(
  studentInfo: StudentInfo,
  markdown: string
): Promise<void> {
  const elements: (Paragraph | Table)[] = [];

  // ==========================================
  // 1. OFFICIAL COVER PAGE (Structured & Plain)
  // ==========================================
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: (studentInfo.institution || 'HIGHER INSTITUTION').toUpperCase(),
          font: 'Times New Roman',
          size: 28, // 14pt
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 100 },
      children: [
        new TextRun({
          text: (studentInfo.faculty || 'FACULTY OF ENGINEERING & TECHNOLOGY / SCIENCES').toUpperCase(),
          font: 'Times New Roman',
          size: 22, // 11pt
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
      children: [
        new TextRun({
          text: `DEPARTMENT OF ${(studentInfo.department || 'TECHNICAL STUDIES').toUpperCase()}`,
          font: 'Times New Roman',
          size: 24, // 12pt
          bold: true,
          color: '000000',
        }),
      ],
    }),
    // Title Box / Divider
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
        bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      },
      children: [
        new TextRun({
          text: 'A TECHNICAL REPORT ON THE STUDENTS INDUSTRIAL WORK EXPERIENCE SCHEME (SIWES)',
          font: 'Times New Roman',
          size: 30, // 15pt
          bold: true,
          color: '000000',
        }),
      ],
    }),
    // Held At Section
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 60 },
      children: [
        new TextRun({
          text: 'HELD AT:',
          font: 'Times New Roman',
          size: 22, // 11pt
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: (studentInfo.hostOrg || 'HOST ESTABLISHMENT').toUpperCase(),
          font: 'Times New Roman',
          size: 26, // 13pt
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 360 },
      children: [
        new TextRun({
          text: studentInfo.hostAddress || 'NIGERIA',
          font: 'Times New Roman',
          size: 22, // 11pt
          color: '000000',
        }),
      ],
    }),
    // Submitted By Section
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({
          text: 'SUBMITTED BY:',
          font: 'Times New Roman',
          size: 22, // 11pt
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: (studentInfo.name || 'STUDENT NAME').toUpperCase(),
          font: 'Times New Roman',
          size: 26, // 13pt
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
      children: [
        new TextRun({
          text: `MATRIC NO: ${studentInfo.matricNo || 'N/A'}`,
          font: 'Times New Roman',
          size: 22, // 11pt
          bold: true,
          color: '000000',
        }),
      ],
    }),
    // Fulfillment statement
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: 'IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF ',
          font: 'Times New Roman',
          size: 20, // 10pt
          italics: true,
          color: '000000',
        }),
        new TextRun({
          text: `BACHELOR OF SCIENCE / ENGINEERING (${(studentInfo.department || 'B.Sc / B.Eng').toUpperCase()})`,
          font: 'Times New Roman',
          size: 20,
          bold: true,
          color: '000000',
        }),
      ],
    }),
    // Academic Year
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 0 },
      children: [
        new TextRun({
          text: studentInfo.academicYear
            ? (studentInfo.academicYear.toUpperCase().includes('SESSION')
                ? studentInfo.academicYear.toUpperCase()
                : `${studentInfo.academicYear.toUpperCase()} ACADEMIC SESSION`)
            : 'ACADEMIC SESSION',
          font: 'Times New Roman',
          size: 22,
          bold: true,
          color: '000000',
        }),
      ],
    }),
    // Page Break after Cover Page
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // ==========================================
  // 2. CERTIFICATION & APPROVAL SHEET
  // ==========================================
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300 },
      children: [
        new TextRun({
          text: 'CERTIFICATION & APPROVAL',
          font: 'Times New Roman',
          size: 28, // 14pt
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 0, after: 400, line: 360 }, // 1.5 line spacing
      indent: { firstLine: 720 }, // 0.5 inch indent
      children: [
        new TextRun({
          text: 'This is to certify that this SIWES Technical Report was compiled and prepared by ',
          font: 'Times New Roman',
          size: 24, // 12pt
          color: '000000',
        }),
        new TextRun({
          text: studentInfo.name || 'the student',
          font: 'Times New Roman',
          size: 24,
          bold: true,
          color: '000000',
        }),
        new TextRun({
          text: ` (Matriculation No: ${studentInfo.matricNo || 'N/A'}) of the Department of `,
          font: 'Times New Roman',
          size: 24,
          color: '000000',
        }),
        new TextRun({
          text: studentInfo.department || 'the Department',
          font: 'Times New Roman',
          size: 24,
          bold: true,
          color: '000000',
        }),
        new TextRun({
          text: `, ${studentInfo.institution || 'the Institution'}, in partial fulfillment of the requirements for the Students Industrial Work Experience Scheme (SIWES) conducted at `,
          font: 'Times New Roman',
          size: 24,
          color: '000000',
        }),
        new TextRun({
          text: studentInfo.hostOrg || 'the Host Establishment',
          font: 'Times New Roman',
          size: 24,
          bold: true,
          color: '000000',
        }),
        new TextRun({
          text: '.',
          font: 'Times New Roman',
          size: 24,
          color: '000000',
        }),
      ],
    }),
    // Signature Table (3 columns, cleanly spaced without scattering)
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            // Industry Supervisor
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  spacing: { before: 800, after: 60 },
                  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' } },
                  children: [new TextRun({ text: ' ' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 60, after: 30 },
                  children: [
                    new TextRun({
                      text: studentInfo.industrySupervisor || 'Industry Supervisor',
                      font: 'Times New Roman',
                      size: 20,
                      bold: true,
                      color: '000000',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Industry Supervisor (Sign & Date)',
                      font: 'Times New Roman',
                      size: 18,
                      color: '333333',
                    }),
                  ],
                }),
              ],
            }),
            // Academic Supervisor
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  spacing: { before: 800, after: 60 },
                  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' } },
                  children: [new TextRun({ text: ' ' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 60, after: 30 },
                  children: [
                    new TextRun({
                      text: studentInfo.academicSupervisor || 'Departmental Supervisor',
                      font: 'Times New Roman',
                      size: 20,
                      bold: true,
                      color: '000000',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Departmental Supervisor (Sign & Date)',
                      font: 'Times New Roman',
                      size: 18,
                      color: '333333',
                    }),
                  ],
                }),
              ],
            }),
            // Head of Department
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  spacing: { before: 800, after: 60 },
                  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' } },
                  children: [new TextRun({ text: ' ' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 60, after: 30 },
                  children: [
                    new TextRun({
                      text: studentInfo.headOfDepartment || 'Head of Department',
                      font: 'Times New Roman',
                      size: 20,
                      bold: true,
                      color: '000000',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Head of Department (Sign & Seal)',
                      font: 'Times New Roman',
                      size: 18,
                      color: '333333',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // ==========================================
  // 3. REPORT BODY CONTENT PARSER
  // ==========================================
  const rawLines = markdown.split(/\r?\n/);
  let inTable = false;
  let currentTableLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    // Detect markdown table lines: starts and contains pipes
    if (line.startsWith('|') && line.includes('|')) {
      inTable = true;
      currentTableLines.push(line);
      continue;
    } else if (inTable) {
      // Table ended, flush and build table
      const docxTable = buildDocxTable(currentTableLines);
      if (docxTable) {
        elements.push(docxTable);
        elements.push(new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }));
      }
      inTable = false;
      currentTableLines = [];
    }

    // Skip empty lines, page dividers, and redundant markdown horizontal rules
    if (!line || line.match(/^[-*_]{3,}$/)) {
      continue;
    }

    // Skip redundant duplicate title page / certification lines if LLM generated them
    if (
      line.match(/^(?:#+\s*)?(?:A\s+)?TECHNICAL\s+REPORT\s+ON\s+THE\s+STUDENTS\s+INDUSTRIAL/i) ||
      line.match(/^(?:#+\s*)?STUDENT\s+NAME[:\s]/i) ||
      line.match(/^(?:#+\s*)?MATRIC(?:ULATION)?\s+(?:NUMBER|NO)[:\s]/i) ||
      line.match(/^(?:#+\s*)?CERTIFICATION\s+(?:PAGE|SHEET|APPROVAL)/i) ||
      line.match(/^Industry-Based\s+Supervisor\s+Signature/i) ||
      line.match(/^Departmental\s+Supervisor\s+Signature/i) ||
      line.match(/^Head\s+of\s+Department\s+Signature/i) ||
      line.match(/^Student\s+Signature\s+and\s+Date/i)
    ) {
      continue;
    }

    // Heading 1 (# ... or CHAPTER ONE: ... or major section name)
    const chapterMatch = line.match(/^(?:#\s+)?(CHAPTER\s+[A-Z0-9]+[:\s].*)$/i);
    const majorSectionMatch = line.match(/^(?:#\s+)?(DEDICATION|ACKNOWLEDGEMENTS?|ABSTRACT(?:\s*\/\s*EXECUTIVE\s+SUMMARY)?|TABLE\s+OF\s+CONTENTS|REFERENCES|APPENDIX)\b(.*)$/i);

    if (line.startsWith('# ') || chapterMatch || majorSectionMatch) {
      let headingText = line.replace(/^#\s+/, '').trim();
      if (chapterMatch) headingText = chapterMatch[1].trim();
      if (majorSectionMatch) headingText = (majorSectionMatch[1] + (majorSectionMatch[2] || '')).trim();

      const isChapterOrMajor = /^(CHAPTER|DEDICATION|ACKNOWLEDGEMENT|ABSTRACT|TABLE OF CONTENTS|REFERENCES|APPENDIX)/i.test(headingText);

      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: isChapterOrMajor,
          spacing: { before: 360, after: 200 },
          children: [
            new TextRun({
              text: headingText.toUpperCase(),
              font: 'Times New Roman',
              size: 28, // 14pt
              bold: true,
              color: '000000',
            }),
          ],
        })
      );
      continue;
    }

    // Heading 2 (## ... or 1.1 ...)
    const h2Match = line.match(/^(?:##\s+)?(\d+\.\d+\s+.*)$/);
    if (line.startsWith('## ') || h2Match) {
      const headingText = (h2Match ? h2Match[1] : line.replace(/^##\s+/, '')).trim();
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.LEFT,
          spacing: { before: 280, after: 120 },
          children: parseInlineFormatting(headingText, {
            font: 'Times New Roman',
            size: 24, // 12pt
            bold: true,
            color: '000000',
          }),
        })
      );
      continue;
    }

    // Heading 3 (### ... or 1.1.1 ...)
    const h3Match = line.match(/^(?:###\s+)?(\d+\.\d+\.\d+\s+.*)$/);
    if (line.startsWith('### ') || h3Match) {
      const headingText = (h3Match ? h3Match[1] : line.replace(/^###\s+/, '')).trim();
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.LEFT,
          spacing: { before: 200, after: 100 },
          children: parseInlineFormatting(headingText, {
            font: 'Times New Roman',
            size: 22, // 11pt
            bold: true,
            color: '000000',
          }),
        })
      );
      continue;
    }

    // Bullet lists (- ... or * ...)
    if (line.match(/^[-*]\s+/)) {
      const itemText = line.replace(/^[-*]\s+/, '').trim();
      elements.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 60, after: 60, line: 360 },
          children: parseInlineFormatting(itemText, {
            font: 'Times New Roman',
            size: 24, // 12pt
            color: '000000',
          }),
        })
      );
      continue;
    }

    // Numbered lists (1. ... or 2. ...)
    if (line.match(/^\d+\.\s+/)) {
      const itemText = line.replace(/^\d+\.\s+/, '').trim();
      const prefixMatch = line.match(/^(\d+\.)\s+/);
      const prefix = prefixMatch ? prefixMatch[1] : '';

      elements.push(
        new Paragraph({
          spacing: { before: 60, after: 60, line: 360 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: `${prefix} `,
              font: 'Times New Roman',
              size: 24,
              bold: true,
              color: '000000',
            }),
            ...parseInlineFormatting(itemText, {
              font: 'Times New Roman',
              size: 24,
              color: '000000',
            }),
          ],
        })
      );
      continue;
    }

    // Blockquote (> ...)
    if (line.startsWith('>')) {
      const quoteText = line.replace(/^>\s*/, '').trim();
      elements.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 140, after: 140, line: 360 },
          indent: { left: 720, right: 360 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
          },
          children: parseInlineFormatting(quoteText, {
            font: 'Times New Roman',
            size: 22,
            italics: true,
            color: '000000',
          }),
        })
      );
      continue;
    }

    // Regular Paragraph
    elements.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 0, after: 140, line: 360 }, // 1.5 line spacing
        indent: { firstLine: 720 }, // Standard 0.5 inch paragraph indent
        children: parseInlineFormatting(line, {
          font: 'Times New Roman',
          size: 24, // 12pt
          color: '000000',
        }),
      })
    );
  }

  // If table was at the end of the markdown
  if (inTable && currentTableLines.length > 0) {
    const docxTable = buildDocxTable(currentTableLines);
    if (docxTable) {
      elements.push(docxTable);
    }
  }

  // Build the complete docx document with native A4 page size and binding margins
  const doc = new Document({
    title: `SIWES Technical Report - ${studentInfo.name || 'Student'}`,
    description: 'Defense-Ready SIWES Technical Report',
    creator: studentInfo.name || 'SIWES Student',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1.0 inch = 1440 twips
              bottom: 1440, // 1.0 inch
              right: 1440, // 1.0 inch
              left: 1800, // 1.25 inch binding gutter for spiral/hardcover physical submission
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    text: 'Page ',
                    font: 'Times New Roman',
                    size: 18,
                    color: '555555',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Times New Roman',
                    size: 18,
                    color: '555555',
                  }),
                  new TextRun({
                    text: ' of ',
                    font: 'Times New Roman',
                    size: 18,
                    color: '555555',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Times New Roman',
                    size: 18,
                    color: '555555',
                  }),
                ],
              }),
            ],
          }),
        },
        children: elements,
      },
    ],
  });

  // Pack as Blob and trigger immediate browser download
  const blob = await Packer.toBlob(doc);
  const docTitle = `SIWES_Technical_Report_${(studentInfo.name || 'Student').replace(/\s+/g, '_')}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${docTitle}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

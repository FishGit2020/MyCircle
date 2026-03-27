import { Document, Paragraph, TextRun, AlignmentType, BorderStyle, Packer, TabStopType, TabStopPosition } from 'docx';
import { saveAs } from 'file-saver';
import type { GeneratedResume } from '../hooks/useResumeGeneration';

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 18, font: 'Calibri', color: '555555' })],
    spacing: { before: 240, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
  });
}

function dateLine(left: string, right: string): Paragraph {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [
      new TextRun({ text: left, font: 'Calibri', size: 20 }),
      new TextRun({ text: '\t' }),
      new TextRun({ text: right, font: 'Calibri', size: 20, color: '666666' }),
    ],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Calibri', size: 20 })],
    bullet: { level: 0 },
    spacing: { after: 40 },
  });
}

export function buildResumeDocx(resume: GeneratedResume): Document {
  const children: Paragraph[] = [];

  // Contact header
  children.push(new Paragraph({
    children: [new TextRun({ text: resume.contact.name || '', bold: true, size: 32, font: 'Calibri' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }));

  const contactParts: string[] = [];
  if (resume.contact.email) contactParts.push(resume.contact.email);
  if (resume.contact.phone) contactParts.push(resume.contact.phone);
  if (resume.contact.location) contactParts.push(resume.contact.location);
  if (resume.contact.linkedin) contactParts.push(resume.contact.linkedin);
  if (resume.contact.github) contactParts.push(resume.contact.github);
  if (resume.contact.website) contactParts.push(resume.contact.website);

  if (contactParts.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: contactParts.join('  |  '), font: 'Calibri', size: 18, color: '666666' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }));
  }

  // Experience
  if (resume.experiences.length > 0) {
    children.push(sectionHeading('Experience'));
    for (const exp of resume.experiences) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.title || '', bold: true, font: 'Calibri', size: 20 }),
          new TextRun({ text: ` — ${exp.company}`, font: 'Calibri', size: 20 }),
          ...(exp.location ? [new TextRun({ text: `, ${exp.location}`, font: 'Calibri', size: 20, color: '666666' })] : []),
        ],
      }));
      if (exp.startDate || exp.endDate) {
        children.push(dateLine('', `${exp.startDate} – ${exp.endDate}`));
      }
      for (const b of exp.bullets) {
        children.push(bullet(b));
      }
      children.push(new Paragraph({ spacing: { after: 80 } }));
    }
  }

  // Education
  if (resume.education.length > 0) {
    children.push(sectionHeading('Education'));
    for (const edu of resume.education) {
      const left = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''} — ${edu.school}${edu.location ? `, ${edu.location}` : ''}`;
      const right = [edu.startDate, edu.endDate].filter(Boolean).join(' – ');
      children.push(dateLine(left, right));
    }
  }

  // Skills
  if (resume.skills.length > 0) {
    children.push(sectionHeading('Skills'));
    for (const skill of resume.skills) {
      children.push(new Paragraph({
        children: [new TextRun({ text: skill, font: 'Calibri', size: 20 })],
        spacing: { after: 20 },
      }));
    }
  }

  // Projects
  if (resume.projects.length > 0) {
    children.push(sectionHeading('Projects'));
    for (const proj of resume.projects) {
      const right = [proj.startDate, proj.endDate].filter(Boolean).join(' – ');
      children.push(dateLine(proj.name, right));
      for (const b of proj.bullets) {
        children.push(bullet(b));
      }
      children.push(new Paragraph({ spacing: { after: 80 } }));
    }
  }

  return new Document({
    sections: [{
      properties: {
        page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } }, // 0.5 inch margins
      },
      children,
    }],
  });
}

export async function downloadDocx(resume: GeneratedResume) {
  const doc = buildResumeDocx(resume);
  const blob = await Packer.toBlob(doc);
  const name = resume.contact.name?.replace(/\s+/g, '_') || 'Resume';
  saveAs(blob, `${name}_Resume.docx`);
}

export function downloadPdf() {
  window.print();
}

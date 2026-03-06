import { jsPDF } from 'jspdf';

export function generateCertificate(params: {
  blockTitle: string;
  learnerName: string;
  learnerEmail: string;
  filename?: string;
}): void {
  const { blockTitle, learnerName, learnerEmail, filename } = params;
  const doc = new jsPDF();
  const pageW = (doc as { internal: { pageSize: { getWidth(): number } } }).internal.pageSize.getWidth();
  const margin = 20;
  let y = 30;

  doc.setFontSize(24);
  doc.text('Certificate of Completion', pageW / 2, y, { align: 'center' });
  y += 20;

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('This certifies that', pageW / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(learnerName || 'the learner', pageW / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(learnerEmail, pageW / 2, y, { align: 'center' });
  y += 14;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('has completed with strong mastery', pageW / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.setTextColor(74, 144, 226);
  doc.text(blockTitle, pageW / 2, y, { align: 'center' });
  y += 16;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageW / 2, y, { align: 'center' });
  y += 20;

  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, pageW - margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.text('Authorized signature', margin, y);
  doc.text('Lumen Academy', pageW - margin, y, { align: 'right' });

  const safeTitle = blockTitle.replace(/[^a-z0-9-_]/gi, '-').slice(0, 40);
  const outFilename = filename ?? `${safeTitle}-certificate.pdf`;
  doc.save(outFilename);
}

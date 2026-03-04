import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportPDFOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}

export function exportPDF({ title, subtitle, headers, rows, filename }: ExportPDFOptions) {
  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? 'landscape' : 'portrait' });

  // Title
  doc.setFontSize(16);
  doc.setTextColor(31, 42, 55);
  doc.text(title, 14, 18);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(subtitle, 14, 26);
  }

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows.map((row) => row.map((cell) => String(cell))),
    startY: subtitle ? 32 : 26,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Nog — Gerado em ${new Date().toLocaleString('pt-BR')} — Pagina ${i}/${pageCount}`,
      14,
      doc.internal.pageSize.height - 8,
    );
  }

  doc.save(`${filename}.pdf`);
}

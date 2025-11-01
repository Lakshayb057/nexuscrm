const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

async function loadImageBuffer(url) {
  try {
    if (!url) return null;
    if (typeof fetch !== 'function') return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

exports.generatePDF = async (data, columns, title, layout) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const drawTable = () => {
        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();
        // Headers
        columns.forEach((column, idx) => {
          const isLast = idx === columns.length - 1;
          doc.fontSize(12).text(column.header, { continued: !isLast, width: 100 });
        });
        doc.moveDown();
        // Rows
        data.forEach(row => {
          columns.forEach((column, idx) => {
            const isLast = idx === columns.length - 1;
            doc.fontSize(10).text(row[column.accessor] || '', { continued: !isLast, width: 100 });
          });
          doc.moveDown();
        });
      };

      const render = async () => {
        const hdr = layout?.header;
        const ftr = layout?.footer;
        const terms = layout?.terms;
        const signUrl = layout?.signatureImageUrl;
        const stampUrl = layout?.orgStampUrl;

        const [signBuf, stampBuf] = await Promise.all([
          loadImageBuffer(signUrl),
          loadImageBuffer(stampUrl),
        ]);

        if (hdr) {
          doc.fontSize(12).text(hdr, { align: 'left' });
          doc.moveDown();
        }

        drawTable();

        doc.moveDown(2);
        if (signBuf || stampBuf) {
          const y = doc.y;
          if (signBuf) {
            try { doc.image(signBuf, { fit: [120, 60], align: 'left' }); } catch {}
          }
          if (stampBuf) {
            try {
              const x = doc.page.width - doc.page.margins.right - 120;
              doc.image(stampBuf, x, y, { fit: [120, 120] });
            } catch {}
          }
          doc.moveDown(4);
        }

        if (terms) {
          doc.fontSize(10).fillColor('#555').text(terms, { align: 'left' });
          doc.moveDown();
        }

        if (ftr) {
          // Footer at bottom
          const footerY = doc.page.height - doc.page.margins.bottom - 40;
          doc.fontSize(10).fillColor('#333').text(ftr, doc.page.margins.left, footerY, {
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
            align: 'center'
          });
        }

        doc.end();
      };

      // Run async renderer
      render();
    } catch (error) {
      reject(error);
    }
  });
};

exports.generateExcel = async (data, columns, title) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);
  
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.accessor,
    width: 20
  }));
  
  worksheet.addRows(data);
  
  return await workbook.xlsx.writeBuffer();
};

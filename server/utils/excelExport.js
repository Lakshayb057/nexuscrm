const ExcelJS = require('exceljs');

/**
 * Export data to Excel format
 * @param {Array} data - Array of objects to export
 * @param {Object} columns - Column definitions
 * @returns {Promise<Buffer>} - Excel file buffer
 */
const exportToExcel = async (data, columns) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Exported Data');

    // Set column headers
    worksheet.columns = Object.entries(columns).map(([key, value]) => ({
      header: value.header,
      key,
      width: value.width || 15,
    }));

    // Add data rows
    data.forEach((item) => {
      const row = {};
      Object.keys(columns).forEach((key) => {
        row[key] = item[key];
      });
      worksheet.addRow(row);
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

module.exports = { exportToExcel };

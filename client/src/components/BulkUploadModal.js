import React, { useState } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { donationsAPI, contactsAPI, organizationsAPI, agenciesAPI, channelsAPI, campaignsAPI } from '../services/api';

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.cardBg};
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.text};
`;

const Button = styled.button`
  padding: 8px 16px;
  background: ${({ theme, primary }) => primary ? theme.colors.primary : 'transparent'};
  color: ${({ primary }) => primary ? '#fff' : 'inherit'};
  border: 1px solid ${({ theme, primary }) => primary ? 'transparent' : theme.colors.border};
  border-radius: 6px;
  cursor: pointer;
  margin-right: 10px;
  margin-bottom: 10px;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const TableList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

const FileInput = styled.div`
  margin: 20px 0;
  padding: 20px;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  
  input[type="file"] {
    display: none;
  }
`;

const tableTemplates = {
  donations: {
    fileName: 'donations_template.xlsx',
    headers: [
      { 
        header: 'Donor ID', 
        key: 'donor', 
        required: true, 
        type: 'string',
        description: 'ID of the donor (must exist in the system)'
      },
      { 
        header: 'Amount', 
        key: 'amount', 
        required: true, 
        type: 'number',
        description: 'Donation amount (numbers only)'
      },
      { 
        header: 'Donation Date', 
        key: 'donationDate', 
        required: true, 
        type: 'date',
        description: 'Date of donation (YYYY-MM-DD format)'
      },
      { 
        header: 'Type', 
        key: 'type', 
        required: true, 
        type: 'string', 
        options: ['one-time', 'monthly'],
        defaultValue: 'one-time',
        description: 'Type of donation',
        validation: {
          type: 'list',
          allowBlank: false,
          showInputMessage: true,
          prompt: 'Select from the dropdown',
          error: 'Must be either "one-time" or "monthly"'
        }
      },
      { 
        header: 'Status', 
        key: 'status', 
        required: true, 
        type: 'string', 
        options: ['pending', 'completed', 'failed'],
        defaultValue: 'pending',
        description: 'Status of the donation',
        validation: {
          type: 'list',
          allowBlank: false,
          showInputMessage: true,
          prompt: 'Select from the dropdown',
          error: 'Must be one of: pending, completed, failed'
        }
      },
      { 
        header: 'Payment Method', 
        key: 'paymentMethod', 
        required: true, 
        type: 'string', 
        options: ['upi', 'card', 'netbanking', 'other'],
        defaultValue: 'upi',
        description: 'Method of payment',
        validation: {
          type: 'list',
          allowBlank: false,
          showInputMessage: true,
          prompt: 'Select from the dropdown',
          error: 'Must be one of: upi, card, netbanking, other'
        }
      },
      { 
        header: 'Payment Reference', 
        key: 'paymentReference', 
        required: false, 
        type: 'string',
        description: 'Reference number for the payment (if available)'
      },
      { 
        header: 'Organization ID', 
        key: 'organization', 
        required: true, 
        type: 'string',
        description: 'ID of the organization (must exist in the system)'
      },
      { 
        header: 'Agency ID', 
        key: 'agency', 
        required: false, 
        type: 'string',
        description: 'ID of the agency (if applicable)'
      },
      { 
        header: 'Channel ID', 
        key: 'channel', 
        required: false, 
        type: 'string',
        description: 'ID of the channel (if applicable)'
      },
      { 
        header: 'Campaign ID', 
        key: 'campaign', 
        required: false, 
        type: 'string',
        description: 'ID of the campaign (if applicable)'
      }
    ]
  },
  contacts: {
    fileName: 'contacts_template.xlsx',
    headers: [
      { header: 'First Name', key: 'firstName', required: true, type: 'string' },
      { header: 'Last Name', key: 'lastName', required: false, type: 'string' },
      { header: 'Email', key: 'email', required: true, type: 'string' },
      { header: 'Phone', key: 'phone', required: false, type: 'string' },
      { header: 'Address', key: 'address', required: false, type: 'string' },
      { header: 'City', key: 'city', required: false, type: 'string' },
      { header: 'State', key: 'state', required: false, type: 'string' },
      { header: 'Country', key: 'country', required: false, type: 'string' },
      { header: 'Postal Code', key: 'postalCode', required: false, type: 'string' },
      { header: 'Is Active Monthly Donor', key: 'isActiveMonthlyDonor', required: false, type: 'boolean' },
    ]
  },
  // Add more tables as needed
};

const BulkUploadModal = ({ isOpen, onClose }) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDownloadTemplate = () => {
    if (!selectedTable) {
      toast.error('Please select a table first');
      return;
    }

    const template = tableTemplates[selectedTable];
    
    // Create a worksheet with the template instructions as the first row
    const headerRow = template.headers.map(h => ({
      v: h.header,
      t: 's',
      s: { font: { bold: true }, fill: { fgColor: { rgb: 'FFD3D3D3' } } }
    }));
    
    // Create a data row with default values and dropdowns
    const dataRow = template.headers.map(header => ({
      v: header.defaultValue || '',
      t: header.type === 'number' ? 'n' : 's',
      s: header.defaultValue ? { fill: { fgColor: { rgb: 'FFE6F3FF' } } } : {}
    }));
    
    // Create worksheet with data validation
    const ws = XLSX.utils.aoa_to_sheet([
      [{ v: 'TEMPLATE GUIDE - PLEASE READ CAREFULLY', s: { font: { bold: true, color: { rgb: 'FFFF0000' } } } }],
      ...template.headers.map(h => [
        { 
          v: `${h.header} (${h.type})${h.required ? ' *' : ''}\n${h.description || ''}${h.options ? '\nOptions: ' + h.options.join(', ') : ''}`,
          t: 's',
          s: { 
            font: { bold: true, color: { rgb: h.required ? 'FFFF0000' : 'FF000000' } },
            alignment: { wrapText: true },
            fill: { fgColor: { rgb: 'FFF2F2F2' } }
          }
        }
      ]),
      [], // Empty row for separation
      template.headers.map(h => h.header), // Header row
      template.headers.map(h => h.defaultValue || '') // Data row with default values
    ]);
    
    // Set column widths
    const colWidths = template.headers.map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;
    
    // Add data validation for dropdowns
    const range = XLSX.utils.decode_range(ws['!ref']);
    template.headers.forEach((header, colIndex) => {
      if (header.validation) {
        const validation = {
          ...header.validation,
          formulae: header.options ? [`"${header.options.join(',')}"`] : undefined
        };
        
        // Apply validation to data rows (starting from row 5)
        for (let row = 4; row <= 100; row++) {
          const cell = XLSX.utils.encode_cell({ r: row, c: colIndex });
          if (!ws[cell]) ws[cell] = {};
          ws[cell].dataValidation = validation;
          
          // Set default value for status and payment method
          if (header.defaultValue && row === 4) {
            ws[cell].v = header.defaultValue;
            ws[cell].s = { fill: { fgColor: { rgb: 'FFE6F3FF' } } };
          }
        }
      }
    });
    
    // Protect the template guide rows
    ws['!protection'] = {
      sheet: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      insertHyperlinks: false,
      deleteColumns: false,
      deleteRows: false,
      selectLockedCells: false,
      sort: false,
      autoFilter: false,
      pivotTables: false,
      selectUnlockedCells: true
    };
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Donation Template');
    
    // Add instructions sheet
    const instructions = [
      ['DONATION TEMPLATE INSTRUCTIONS'],
      [],
      ['1. DO NOT modify the first 3 rows of the template'],
      ['2. Fill in the data starting from row 5'],
      ['3. Required fields are marked with * and highlighted in red'],
      ['4. Fields with dropdowns must use the provided options'],
      ['5. Date format: YYYY-MM-DD'],
      ['6. For assistance, contact support@nexuscrm.com']
    ];
    
    const ws2 = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, ws2, 'Instructions');
    
    XLSX.writeFile(wb, template.fileName, { bookType: 'xlsx', type: 'array' });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset the input value to allow re-uploading the same file
    e.target.value = '';

    setIsUploading(true);
    setUploadProgress(0);

    let data, headers, headerRowIndex;
    
    try {
      // Read the file
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
      
      // Process the Excel file
      const workbook = XLSX.read(new Uint8Array(fileData), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Get all rows as JSON
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', blankrows: false });
      
      if (jsonData.length < 2) { // At least header row + 1 data row
        throw new Error('The file does not contain enough data. Please check the template format.');
      }
      
      // Find the header row (first non-empty row)
      headerRowIndex = jsonData.findIndex(row => 
        row.length > 0 && row.some(cell => typeof cell === 'string' && cell.trim() !== '')
      );
      
      if (headerRowIndex === -1) {
        throw new Error('Could not find header row in the file');
      }
      
      // Get headers from the first non-empty row
      headers = jsonData[headerRowIndex]
        .filter(header => typeof header === 'string' && header.trim() !== '')
        .map(header => header.trim());
      
      if (headers.length === 0) {
        throw new Error('No valid headers found in the file');
      }
      
      // Process data rows (skip header row and any empty rows)
      const resultData = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        // Skip empty rows
        if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) {
          continue;
        }
        
        const rowData = {};
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          rowData[header] = row[j] !== undefined ? row[j] : '';
        }
        
        // Only add row if it has at least one non-empty value
        if (Object.values(rowData).some(val => val !== '')) {
          resultData.push(rowData);
        }
      }
      
      data = resultData;

      // Process and validate data
      const template = tableTemplates[selectedTable];
      const validatedData = [];
      const errors = [];
      const templateHeaders = template.headers.reduce((acc, h) => ({
        ...acc,
        [h.header]: h
      }), {});
      
      // Map user's file headers to our expected headers
      const headerMap = {};
      headers.forEach((header) => {
        const templateHeader = Object.keys(templateHeaders).find(h => 
          h.toLowerCase() === header.toLowerCase()
        );
        if (templateHeader) {
          headerMap[header] = templateHeader;
        }
      });
      
      // Validate headers
      const requiredHeaders = template.headers
        .filter(h => h.required)
        .map(h => h.header);
      
      const missingHeaders = requiredHeaders.filter(h => 
        !Object.values(headerMap).includes(h)
      );
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }
      
      // Process and validate each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const validatedRow = {};
        let rowHasErrors = false;
        const rowErrors = [];
        
        // Process each cell in the row
        for (const [fileHeader, templateHeader] of Object.entries(headerMap)) {
          const headerDef = templateHeaders[templateHeader];
          const value = row[fileHeader];
          
          // Skip validation for empty non-required fields
          if ((value === '' || value === null || value === undefined) && !headerDef.required) {
            continue;
          }
          
          // Check required fields
          if (headerDef.required && (value === '' || value === null || value === undefined)) {
            rowErrors.push(`${templateHeader} is required`);
            rowHasErrors = true;
            continue;
          }
          
          // Type validation
          if (value !== '' && value !== null && value !== undefined) {
            // Trim string values
            if (typeof value === 'string') {
              validatedRow[headerDef.key] = value.trim();
              
              // Check for required but empty strings after trim
              if (headerDef.required && validatedRow[headerDef.key] === '') {
                rowErrors.push(`${templateHeader} cannot be empty`);
                rowHasErrors = true;
                continue;
              }
            } else {
              validatedRow[headerDef.key] = value;
            }
            
            // Number validation
            if (headerDef.type === 'number') {
              const numValue = Number(validatedRow[headerDef.key]);
              if (isNaN(numValue)) {
                rowErrors.push(`${templateHeader} must be a number`);
                rowHasErrors = true;
              } else {
                validatedRow[headerDef.key] = numValue;
              }
            }
            // Date validation
            else if (headerDef.type === 'date') {
              try {
                const dateValue = new Date(validatedRow[headerDef.key]);
                if (isNaN(dateValue.getTime())) {
                  throw new Error('Invalid date');
                }
                validatedRow[headerDef.key] = dateValue.toISOString();
              } catch (e) {
                rowErrors.push(`${templateHeader} must be a valid date (YYYY-MM-DD)`);
                rowHasErrors = true;
              }
            }
            // Boolean validation
            else if (headerDef.type === 'boolean') {
              const val = String(validatedRow[headerDef.key]).toLowerCase();
              if (val === 'true' || val === '1' || val === 'yes') {
                validatedRow[headerDef.key] = true;
              } else if (val === 'false' || val === '0' || val === 'no' || val === '') {
                validatedRow[headerDef.key] = false;
              } else {
                rowErrors.push(`${templateHeader} must be true/false, yes/no, or 1/0`);
                rowHasErrors = true;
              }
            }
            // Options validation
            else if (headerDef.options && !headerDef.options.includes(validatedRow[headerDef.key])) {
              rowErrors.push(
                `${templateHeader} must be one of: ${headerDef.options.join(', ')}`
              );
              rowHasErrors = true;
            }
          }
        }
        
        // Only add row if it has all required fields and no errors
        if (!rowHasErrors && Object.keys(validatedRow).length > 0) {
          validatedData.push(validatedRow);
        } else if (rowHasErrors) {
          errors.push({
            row: i + headerRowIndex + 2, // +2 for 1-based index and header row
            errors: rowErrors
          });
          
          // Show first 5 errors to avoid flooding the UI
          if (errors.length <= 5) {
            rowErrors.forEach(err => {
              toast.error(`Row ${i + headerRowIndex + 2}: ${err}`, {
                duration: 5000
              });
            });
          }
        }
      }
      
      // Show summary of errors if any
      if (errors.length > 5) {
        toast.error(
          `Found ${errors.length} rows with errors. Showing first 5 errors. Please check your file.`,
          { duration: 8000 }
        );
      }
      
      if (validatedData.length === 0) {
        throw new Error('No valid data to import. Please check the file format and try again.');
      }
      
      // Ask for confirmation before import
      const shouldProceed = window.confirm(
        `Found ${validatedData.length} valid rows to import. ${errors.length > 0 ? 
        `\nNote: ${errors.length} rows had errors and will be skipped.` : ''}\n\nDo you want to continue?`
      );
      
      if (!shouldProceed) {
        throw new Error('Import cancelled by user');
      }
      
      // Save to database
      let apiMethod;
      switch (selectedTable) {
        case 'donations':
          apiMethod = donationsAPI.createDonation;
          break;
        case 'contacts':
          apiMethod = contactsAPI.createContact;
          break;
        default:
          throw new Error('Unsupported table');
      }
      
      // Process in batches to avoid overwhelming the server
      const BATCH_SIZE = 5; // Reduced batch size for better progress feedback
      let successCount = 0;
      const failedRows = [];
      
      for (let i = 0; i < validatedData.length; i += BATCH_SIZE) {
        const batch = validatedData.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(item => apiMethod(item))
        );
        
        // Process results
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            failedRows.push({
              row: i + index + 1,
              error: result.reason?.message || 'Unknown error'
            });
            console.error('Error importing row:', result.reason);
          }
        });
        
        // Update progress
        const progress = Math.round(((i + batch.length) / validatedData.length) * 100);
        setUploadProgress(progress);
        
        // Small delay between batches to prevent UI freeze
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Show summary
      if (failedRows.length > 0) {
        toast.error(
          `Imported ${successCount} rows successfully. ${failedRows.length} rows failed.`,
          { duration: 10000 }
        );
        console.log('Failed rows:', failedRows);
      }
      
      toast.success(`Successfully imported ${successCount} ${selectedTable}`);
      onClose();
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>Bulk Upload Data</ModalHeader>
        
        <div>
          <h4>Select Table</h4>
          <TableList>
            {Object.keys(tableTemplates).map(table => (
              <Button 
                key={table}
                primary={selectedTable === table}
                onClick={() => setSelectedTable(table)}
              >
                {table.charAt(0).toUpperCase() + table.slice(1)}
              </Button>
            ))}
          </TableList>
          
          {selectedTable && (
            <div>
              <Button 
                onClick={handleDownloadTemplate}
                disabled={isUploading}
              >
                Download Template
              </Button>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px' }}>Upload Filled Template:</label>
                <label style={{
                  display: 'block',
                  padding: '20px',
                  border: '2px dashed #ccc',
                  borderRadius: '6px',
                  textAlign: 'center',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.7 : 1,
                  backgroundColor: isUploading ? '#f5f5f5' : 'transparent'
                }}>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  {isUploading ? (
                    <div>
                      <p>Uploading... {uploadProgress}%</p>
                      <progress value={uploadProgress} max="100" style={{ width: '100%' }} />
                    </div>
                  ) : (
                    <div>
                      <p><i className="fas fa-upload" style={{ fontSize: '24px', marginBottom: '10px' }}></i></p>
                      <p>Drag & drop your Excel file here or click to browse</p>
                      <p><small>Supports .xlsx, .xls files (Max 5MB)</small></p>
                    </div>
                  )}
                </label>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{
                      width: '100%',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '4px',
                      height: '8px',
                      marginTop: '10px'
                    }}>
                      <div style={{
                        width: `${uploadProgress}%`,
                        backgroundColor: '#4caf50',
                        height: '100%',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '12px' }}>
                      {uploadProgress}% Complete
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <h4>Template Guide</h4>
                <ul>
                  {tableTemplates[selectedTable].headers.map(header => (
                    <li key={header.key}>
                      <strong>{header.header}</strong> ({header.type})
                      {header.required && <span style={{ color: 'red' }}> *</span>}
                      {header.options && (
                        <div>
                          <small>Options: {header.options.join(', ')}</small>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={isUploading}>
            Close
          </Button>
        </div>
      </ModalContent>
    </ModalBackdrop>
  );
};

export default BulkUploadModal;
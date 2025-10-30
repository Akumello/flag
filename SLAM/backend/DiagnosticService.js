// DiagnosticService.js - Debug helpers

/**
 * Reads raw data from a specific row in SLA_MASTER to verify what was actually written
 */
function debugReadRow(rowNumber) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_MASTER');
    
    console.log('=== DEBUG READ ROW ===');
    console.log('Reading row:', rowNumber);
    
    // Get headers
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    console.log('Headers:', JSON.stringify(headers));
    
    // Get row data
    const rowData = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    console.log('Raw data:', JSON.stringify(rowData));
    
    // Get formulas
    const formulas = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getFormulas()[0];
    console.log('Formulas:', JSON.stringify(formulas));
    
    // Build object
    const result = {};
    headers.forEach((header, index) => {
      result[header] = {
        value: rowData[index],
        formula: formulas[index] || null
      };
    });
    
    console.log('=== PARSED DATA ===');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('Error reading row:', error);
    return { error: error.toString() };
  }
}

/**
 * Checks if formulas in row 2 (template row) are valid
 */
function debugCheckTemplateRow() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_MASTER');
    
    console.log('=== CHECKING TEMPLATE ROW (Row 2) ===');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const formulas = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getFormulas()[0];
    const values = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const formulaCols = ['A', 'K', 'T', 'V', 'X'];
    
    formulaCols.forEach((col, idx) => {
      const colIndex = col.charCodeAt(0) - 65; // A=0, B=1, etc.
      console.log(`Column ${col} (${headers[colIndex]}):`);
      console.log('  Formula:', formulas[colIndex] || 'NONE');
      console.log('  Value:', values[colIndex]);
    });
    
    return {
      headers: headers,
      formulas: formulas,
      values: values
    };
    
  } catch (error) {
    console.error('Error checking template:', error);
    return { error: error.toString() };
  }
}

/**
 * Lists all sheets and their row counts
 */
function debugListSheets() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    
    console.log('=== ALL SHEETS ===');
    sheets.forEach(sheet => {
      const name = sheet.getName();
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      console.log(`${name}: ${lastRow} rows x ${lastCol} columns`);
    });
    
    return sheets.map(s => ({
      name: s.getName(),
      rows: s.getLastRow(),
      cols: s.getLastColumn()
    }));
    
  } catch (error) {
    console.error('Error listing sheets:', error);
    return { error: error.toString() };
  }
}

/**
 * Searches for a specific SLA ID across all rows
 */
function debugFindSLA(slaId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_MASTER');
    
    console.log('=== SEARCHING FOR SLA:', slaId, '===');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const slaIdIndex = headers.indexOf('SLA ID');
    
    console.log('Searching column index:', slaIdIndex, '(', headers[slaIdIndex], ')');
    console.log('Total rows to search:', data.length - 1);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][slaIdIndex] === slaId) {
        console.log('FOUND at row:', i + 1);
        console.log('Data:', JSON.stringify(data[i]));
        return {
          found: true,
          row: i + 1,
          data: data[i]
        };
      }
    }
    
    console.log('NOT FOUND');
    return { found: false };
    
  } catch (error) {
    console.error('Error searching:', error);
    return { error: error.toString() };
  }
}

/**
 * Fixes circular reference formulas in existing rows and removes them from template row
 */
function fixCircularReferences() {
  try {
    console.log('=== FIXING CIRCULAR REFERENCES ===');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_MASTER');
    
    const lastRow = sheet.getLastRow();
    console.log('Last row:', lastRow);
    
    // Get column indices
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const createdAtIndex = headers.indexOf('Created At') + 1; // Column T (20)
    const rowVersionIndex = headers.indexOf('Row Version') + 1; // Column X (24)
    
    console.log('Created At column:', createdAtIndex);
    console.log('Row Version column:', rowVersionIndex);
    
    let fixedCount = 0;
    
    // Fix all rows from 2 to lastRow
    for (let row = 2; row <= lastRow; row++) {
      // Check if row has data (SLA Name in column C)
      const slaName = sheet.getRange(row, 3).getValue();
      if (!slaName) continue; // Skip empty rows
      
      // Fix Created At column (T) - remove formula, keep/set value
      const createdAtCell = sheet.getRange(row, createdAtIndex);
      const createdAtValue = createdAtCell.getValue();
      
      if (createdAtValue === '#REF!' || createdAtCell.getFormula()) {
        // Set to current timestamp if #REF!, otherwise preserve value
        const newCreatedAt = (createdAtValue === '#REF!') ? new Date() : createdAtValue;
        createdAtCell.clearContent();
        createdAtCell.setValue(newCreatedAt);
        console.log(`Row ${row}: Fixed Created At - set to ${newCreatedAt}`);
      }
      
      // Fix Row Version column (X) - remove formula, keep/set value
      const rowVersionCell = sheet.getRange(row, rowVersionIndex);
      const rowVersionValue = rowVersionCell.getValue();
      
      if (rowVersionValue === '#REF!' || rowVersionCell.getFormula()) {
        // Set to 1 if #REF!, otherwise preserve value
        const newVersion = (rowVersionValue === '#REF!') ? 1 : rowVersionValue;
        rowVersionCell.clearContent();
        rowVersionCell.setValue(newVersion);
        console.log(`Row ${row}: Fixed Row Version - set to ${newVersion}`);
      }
      
      fixedCount++;
    }
    
    console.log(`Fixed ${fixedCount} rows`);
    console.log('=== FIX COMPLETE ===');
    
    return {
      success: true,
      message: `Fixed circular references in ${fixedCount} rows`
    };
    
  } catch (error) {
    console.error('Error fixing circular references:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Removes all empty rows from SLA_MASTER sheet to clean up display
 */
function removeEmptyRows() {
  try {
    console.log('=== REMOVING EMPTY ROWS ===');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_MASTER');
    
    const lastRow = sheet.getLastRow();
    console.log('Last row before cleanup:', lastRow);
    
    let deletedCount = 0;
    
    // Delete from bottom to top to avoid row number shifts
    for (let row = lastRow; row >= 2; row--) {
      // Check if row is empty (no SLA Name in column C)
      const slaName = sheet.getRange(row, 3).getValue();
      
      if (!slaName || slaName === '') {
        sheet.deleteRow(row);
        deletedCount++;
        
        // Log progress every 100 rows
        if (deletedCount % 100 === 0) {
          console.log(`Deleted ${deletedCount} empty rows...`);
        }
      }
    }
    
    console.log(`Total deleted: ${deletedCount} empty rows`);
    console.log('New last row:', sheet.getLastRow());
    console.log('=== CLEANUP COMPLETE ===');
    
    return {
      success: true,
      message: `Removed ${deletedCount} empty rows`,
      deletedCount: deletedCount
    };
    
  } catch (error) {
    console.error('Error removing empty rows:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Converts Progress % column from individual formulas to ARRAYFORMULA in header
 */
function convertProgressToArrayFormula() {
  try {
    console.log('=== CONVERTING PROGRESS TO ARRAYFORMULA ===');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_MASTER');
    
    // Get column K (Progress %)
    const lastRow = sheet.getLastRow();
    const progressCol = 11; // Column K
    
    console.log('Clearing existing Progress formulas from rows 2 to', lastRow);
    
    // Clear all formulas/values in Progress column (except header)
    if (lastRow > 1) {
      sheet.getRange(2, progressCol, lastRow - 1, 1).clearContent();
    }
    
    // Set ARRAYFORMULA in header cell K1
    console.log('Setting ARRAYFORMULA in K1...');
    const arrayFormula = '={"Progress %"; ARRAYFORMULA(IF(ROW(C2:C)=1,"",IF(OR(ISBLANK(C2:C),ISBLANK(L2:L),ISBLANK(M2:M),M2:M=0),"",MIN(200,L2:L/M2:M*100))))}';
    sheet.getRange('K1').setFormula(arrayFormula);
    
    console.log('ARRAYFORMULA set successfully');
    console.log('Formula:', arrayFormula);
    console.log('=== CONVERSION COMPLETE ===');
    
    return {
      success: true,
      message: 'Converted Progress % column to ARRAYFORMULA'
    };
    
  } catch (error) {
    console.error('Error converting to ARRAYFORMULA:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Removes NOW() formulas from Updated At column and preserves timestamps
 */
function removeUpdatedAtFormulas() {
  try {
    console.log('=== REMOVING UPDATED AT FORMULAS ===');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SLA_MASTER');
    
    const lastRow = sheet.getLastRow();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const updatedAtIndex = headers.indexOf('Updated At') + 1; // Column V (22)
    
    console.log('Updated At column:', updatedAtIndex);
    console.log('Processing rows 2 to', lastRow);
    
    let fixedCount = 0;
    
    // Process each row
    for (let row = 2; row <= lastRow; row++) {
      const cell = sheet.getRange(row, updatedAtIndex);
      const formula = cell.getFormula();
      
      // If cell has a formula (likely NOW()), replace with static timestamp
      if (formula) {
        // Get current value (the current NOW() result)
        const currentValue = cell.getValue();
        
        // Check if row has data
        const slaName = sheet.getRange(row, 3).getValue();
        
        if (slaName) {
          // Clear formula and set static timestamp
          cell.clearContent();
          cell.setValue(currentValue || new Date());
          console.log(`Row ${row}: Converted formula to static timestamp`);
          fixedCount++;
        } else {
          // Empty row, just clear it
          cell.clearContent();
        }
      }
    }
    
    console.log(`Fixed ${fixedCount} rows`);
    console.log('=== CLEANUP COMPLETE ===');
    
    return {
      success: true,
      message: `Removed NOW() formulas from ${fixedCount} rows in Updated At column`
    };
    
  } catch (error) {
    console.error('Error removing Updated At formulas:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Utility to export data to CSV and trigger a download in the browser.
 * 
 * @param {Array<Object>} data - Array of objects containing the data to export.
 * @param {string} filename - Desired filename (e.g., 'report.csv').
 * @param {Array<string>} [headers] - Optional array of header names. If not provided, keys of the first object will be used.
 */
export const exportToCSV = (data, filename, headers) => {
  if (!data || !data.length) {
    console.error("No data provided for export");
    return;
  }

  const columnHeaders = headers || Object.keys(data[0]);
  
  const csvRows = [];
  
  // Add headers
  csvRows.push(columnHeaders.join(','));

  // Add data rows
  for (const row of data) {
    const values = columnHeaders.map(header => {
      const val = row[header] === undefined || row[header] === null ? '' : row[header];
      // Escape commas and wrap in quotes
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

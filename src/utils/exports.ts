/**
 * Triggers a browser download for a file created from a `Blob` object.
 *
 * @param {Blob} blob - The `Blob` containing the file's data.
 * @param {string} fileName - The desired name for the downloaded file.
 */
function downloadFile(blob: Blob, fileName: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);

    // Append link to the body and trigger a click
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Converts an array of data into a CSV format and triggers a download.
 *
 * @param {string[]} headers - An array of strings to be used as the CSV header row.
 * @param {any[][]} data - A 2D array representing the rows and cells of the data to be exported.
 * @param {string} fileName - The desired name for the downloaded CSV file.
 */
export function exportToCSV(headers: string[], data: any[][], fileName: string): void {
    const csvRows: string[] = [];

    // Add the headers
    csvRows.push(headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','));

    // Add the data rows
    for (const row of data) {
        csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    }

    // Create a Blob with CSV data
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Use the download utility function
    downloadFile(blob, fileName);
}

/**
 * Converts an array of data into an HTML table, then triggers a download as an Excel (.xls) file.
 *
 * @param {string[]} headers - An array of strings for the table headers.
 * @param {any[][]} data - A 2D array of the data to be exported.
 * @param {string} fileName - The desired name for the downloaded Excel file.
 */
export function exportToExcel(headers: string[], data: any[][], fileName: string): void {
    // Create a table element
    const table = document.createElement('table');
    const thead = table.createTHead();
    const tbody = table.createTBody();

    // Create the header row
    const headerRow = thead.insertRow();
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    // Create the data rows
    data.forEach(row => {
        const tr = tbody.insertRow();
        row.forEach(cell => {
            const td = tr.insertCell();
            td.textContent = String(cell);
        });
    });

    // Create a Blob with the table HTML
    const html = table.outerHTML;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });

    // Use the download utility function
    downloadFile(blob, fileName);
}

/**
 * Converts an array of data into a pretty-printed JSON string and triggers a download.
 *
 * @param {any[]} data - The data to be serialized into JSON.
 * @param {string} fileName - The desired name for the downloaded JSON file.
 */
export function exportToJSON(data: any[], fileName: string): void {
    const jsonContent = JSON.stringify(data, null, 2); // Pretty print with 2 spaces
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

    // Use the download utility function
    downloadFile(blob, fileName);
}

/**
 * Converts an array of data into a simple XML format and triggers a download.
 *
 * @param {string[]} headers - An array of strings to be used as column headers in the XML.
 * @param {any[][]} data - A 2D array of the data to be exported.
 * @param {string} fileName - The desired name for the downloaded XML file.
 */
export function exportToXML(headers: string[], data: any[][], fileName: string): void {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n';

    // Add headers
    xmlContent += '  <header>\n';
    headers.forEach(header => {
        xmlContent += `    <column>${header}</column>\n`;
    });
    xmlContent += '  </header>\n';

    // Add data rows
    data.forEach(row => {
        xmlContent += '  <row>\n';
        row.forEach(cell => {
            xmlContent += `    <cell>${cell}</cell>\n`;
        });
        xmlContent += '  </row>\n';
    });

    xmlContent += '</rows>';

    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });

    // Use the download utility function
    downloadFile(blob, fileName);
}

/**
 * Converts an array of data into a tab-separated text format and triggers a download.
 *
 * @param {string[]} headers - An array of strings for the header row.
 * @param {any[][]} data - A 2D array of the data to be exported.
 * @param {string} fileName - The desired name for the downloaded text file.
 */
export function exportToText(headers: string[], data: any[][], fileName: string): void {
    const textRows: string[] = [];

    // Add headers
    textRows.push(headers.join('\t'));

    // Add data rows
    data.forEach(row => {
        textRows.push(row.join('\t'));
    });

    // Create a Blob with text data
    const textContent = textRows.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });

    // Use the download utility function
    downloadFile(blob, fileName);
}
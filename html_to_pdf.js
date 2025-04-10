const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');
const util = require('util');

// Convert fs.readFile to return a Promise
const readFile = util.promisify(fs.readFile);

// Function to make HTTP requests using native Node.js modules
async function getAuthToken(userId) {
    return new Promise((resolve, reject) => {
        // Prepare the request data
        const data = JSON.stringify({ user_id: userId });
        
        // Request options
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: '/get_report_token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        // Make the request
        const req = http.request(options, (res) => {
            let responseData = '';
            
            // Collect data chunks
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            // Process the complete response
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const jsonResponse = JSON.parse(responseData);
                        resolve(jsonResponse);
                    } catch (error) {
                        console.error('Error parsing JSON response:', error);
                        resolve({ token: null });
                    }
                } else {
                    console.error(`HTTP error! Status: ${res.statusCode}`);
                    resolve({ token: null });
                }
            });
        });

        // Handle request errors
        req.on('error', (error) => {
            console.error('Error making HTTP request:', error);
            resolve({ token: null });
        });

        // Send the request data
        req.write(data);
        req.end();
    });
}

// Function to make a GET request
async function makeGetRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        console.error('Error parsing response data:', error);
                        reject(error);
                    }
                } else {
                    console.error(`HTTP error: ${res.statusCode}`);
                    reject(new Error(`HTTP error: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error making request:', error);
            reject(error);
        });

        req.end();
    });
}

async function generatePDF(date, userId) {
    // First get an authentication token
    const tokenResponse = await getAuthToken(userId);
    if (!tokenResponse.token) {
        throw new Error("Failed to get authentication token");
    }
    const token = tokenResponse.token;

    // Fetch user data
    let userData;
    try {
        userData = await makeGetRequest(`/get_user_data?token=${token}&userId=${userId}`);
        console.log('Got user data:', userData);
    } catch (error) {
        console.warn('Could not fetch user data, using defaults');
        userData = { firstName: 'User', lastName: '', role: 'N/A' };
    }

    // Fetch report data
    let reportData;
    try {
        reportData = await makeGetRequest(`/get_report_data?token=${token}&date=${encodeURIComponent(date)}`);
        console.log(`Got report data with ${reportData.responses.length} entries`);
    } catch (error) {
        console.error('Failed to get report data:', error);
        throw new Error("Failed to get report data");
    }

    // Create the browser instance
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
   
    // Enable console logging from the browser
    page.on('console', msg => console.log(`PAGE CONSOLE: ${msg.text()}`));    // Read the HTML template file and CSS file
    const htmlTemplate = await readFile(path.join(__dirname, 'templates', 'report.html'), 'utf8');
    const cssContent = await readFile(path.join(__dirname, 'static', 'report-style.css'), 'utf8');
    
    // Generate the report content table rows for the report
    const reportRows = reportData.responses.length > 0 ? 
        reportData.responses.map(item => `
            <tr>
                <td>${item.step || 'N/A'}</td>
                <td>${reportData.steps[item.step]?.Instruction || 'Instruction not available'}</td>
                <td>${item.answer || 'No response provided'}</td>
            </tr>
        `).join('') : 
        '<tr><td colspan="3">No data found for this date.</td></tr>';
    
    // Create a modified version of the HTML template with our dynamic content
    let reportHTML = htmlTemplate;
    
    // Remove Flask/Jinja template variables and replace with our values
    reportHTML = reportHTML.replace('{{ url_for(\'index\') }}', '#');
    reportHTML = reportHTML.replace(/\{\{\s*url_for\('[^']+'\)\s*\}\}/g, '#');
    reportHTML = reportHTML.replace(/\{\%\s*if[^]*?\{\%\s*endif\s*\%\}/gs, ''); // Remove all {% if %} blocks
    
    // Insert our user data
    reportHTML = reportHTML.replace('<span id="report-date"></span>', `<span id="report-date">${date}</span>`);
    reportHTML = reportHTML.replace('<span id="auditor-name">{{ current_user.first_name }} {{ current_user.last_name }}</span>', 
                                    `<span id="auditor-name">${userData.firstName} ${userData.lastName}</span>`);
    reportHTML = reportHTML.replace('<span id="department-name">{{ current_user.role }}</span>', 
                                    `<span id="department-name">${userData.role || 'N/A'}</span>`);
    reportHTML = reportHTML.replace('<span id="department-name">N/A</span>', 
                                    `<span id="department-name">${userData.role || 'N/A'}</span>`);
    
    // Insert report data rows
    reportHTML = reportHTML.replace('<!-- Steps will be dynamically inserted here -->', reportRows);
    
    // Replace relative CSS paths with inline CSS
    reportHTML = reportHTML.replace('<link rel="stylesheet" href="../static/report-style.css">', 
                                   `<style>${cssContent}</style>`);
                                   
    // Remove script tags to prevent any JavaScript execution
    reportHTML = reportHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Set the modified HTML content directly
    await page.setContent(reportHTML, { waitUntil: 'networkidle0' });

    // Generate the PDF
    const outputPdfPath = `${__dirname}/static/output.pdf`;
    await page.pdf({
        path: outputPdfPath,
        format: 'A4',
        printBackground: true,
    });

    await browser.close();
    console.log(`PDF generated successfully: ${outputPdfPath}`);
}

// Get the date and userId arguments from the command line
const [date, userId] = process.argv.slice(2);
if (!date || !userId) {
    console.error("Error: Missing arguments. Usage: node html_to_pdf.js <date> <userId>");
    process.exit(1);
}

generatePDF(date, userId).catch((err) => {
    console.error("Error generating PDF:", err);
});

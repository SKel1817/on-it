const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');

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
    page.on('console', msg => console.log(`PAGE CONSOLE: ${msg.text()}`));    // Generate HTML content for the report
    const reportHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cybersecurity Audit Report</title>
        <style>
            /* Report Styling */
            body {
                font-family: 'Times New Roman', Times, serif;
                margin: 0;
                padding: 20px;
                background-color: #FFFFFF;
                color: #000000;
                line-height: 1.6;
            }
            
            #report-container {
                max-width: 1000px;
                margin: 0 auto;
                padding: 20px;
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            
            h1 {
                color: #143F6E;
                text-align: center;
                font-size: 24px;
                margin-bottom: 20px;
                border-bottom: 2px solid #A5D6A7;
                padding-bottom: 10px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            
            th, td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
            }
            
            th {
                background-color: #143F6E;
                color: white;
            }
            
            tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            
            #audit-header {
                margin-bottom: 30px;
            }
            
            #audit-header td {
                border: none;
                font-weight: bold;
                padding: 5px 10px;
            }
            
            .section-title {
                color: #143F6E;
                margin-top: 30px;
                border-left: 5px solid #A5D6A7;
                padding-left: 10px;
            }
            
            @media print {
                body {
                    padding: 0;
                }
                #report-container {
                    box-shadow: none;
                }
            }
        </style>
    </head>
    <body>
        <div id="report-container">
            <h1>Cybersecurity Audit Report</h1>
            <table id="audit-header">
                <tr>
                    <td><strong>Date:</strong> ${date}</td>
                    <td><strong>Auditor:</strong> ${userData.firstName} ${userData.lastName}</td>
                    <td><strong>Department:</strong> ${userData.role || 'N/A'}</td>
                </tr>
            </table>

            <h2 class="section-title">Audit Steps</h2>
            <table id="audit-steps">
                <thead>
                    <tr>
                        <th>Step Name</th>
                        <th>Instruction</th>
                        <th>Response</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.responses.length > 0 ? 
                        reportData.responses.map(item => `
                            <tr>
                                <td>${item.step || 'N/A'}</td>
                                <td>${reportData.steps[item.step]?.Instruction || 'Instruction not available'}</td>
                                <td>${item.answer || 'No response provided'}</td>
                            </tr>
                        `).join('') : 
                        '<tr><td colspan="3">No data found for this date.</td></tr>'
                    }
                </tbody>
            </table>
        </div>
    </body>
    </html>
    `;

    // Set the HTML content directly
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

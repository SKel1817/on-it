const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF(date, userId) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

   
   // Build the URL to the live report page with user authentication
    const reportUrl = `http://127.0.0.1:5000/report?date=${encodeURIComponent(date)}&userId=${encodeURIComponent(userId)}`;

    // Navigate to the live report page
    await page.goto(reportUrl, { waitUntil: 'networkidle0' });



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

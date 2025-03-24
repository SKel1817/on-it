const puppeteer = require('puppeteer');

async function generatePDF(date) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Build the URL to the live report page
    const reportUrl = `http://127.0.0.1:5000/report?date=${encodeURIComponent(date)}`;

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

// Get the date argument from the command line
const date = process.argv[2];
if (!date) {
    console.error("Error: No date provided. Usage: node html_to_pdf.js <date>");
    process.exit(1);
}

generatePDF(date).catch((err) => {
    console.error("Error generating PDF:", err);
});

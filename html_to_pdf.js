const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF(date, userId) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Load cookies from a file
    const cookiesPath = path.resolve(__dirname, 'cookies.json');
    if (fs.existsSync(cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
        await page.setCookie(...cookies);
        console.log("Cookies loaded into the browser.");
    } else {
        console.warn("No cookies file found. Ensure you are logged in and export cookies to cookies.json.");
    }

    // Build the URL to the live report page with user authentication
    const reportUrl = `http://127.0.0.1:5000/report?date=${encodeURIComponent(date)}&userId=${encodeURIComponent(userId)}`;

    // Navigate to the live report page
    await page.goto(reportUrl, { waitUntil: 'networkidle0' });

    // Check if the page is the login screen
    const isLoginScreen = await page.evaluate(() => {
        return document.title.includes('Login') || document.body.innerText.includes('Please log in');
    });

    if (isLoginScreen) {
        console.warn("Warning: The generated PDF is the login screen. Ensure the cookies are valid.");
    }

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

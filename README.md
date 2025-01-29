# on-it - README

Welcome to the on-it repository! Your Cybersecurity Solution. An application that guides small businesses through the steps of a cybersecurity audit. This guide will help you set up and run the Flask application on your local machine, whether you're using Windows or macOS, and now includes instructions for using Node.js and Puppeteer for PDF generation.

---

## **Table of Contents**
1. [Prerequisites](#prerequisites)
2. [Cloning the Repository](#cloning-the-repository)
3. [Setting Up the Environment](#setting-up-the-environment)
   - [For Windows](#for-windows)
   - [For macOS](#for-macos)
   - [Node.js Setup](#nodejs-setup)
   - [Database](#database-setup)
4. [Running the Application](#running-the-application)
5. [Directory Structure](#directory-structure)
6. [FAQ](#faq)

---

## **Prerequisites**
Make sure you have the following installed:

1. **Python 3.8+**
   - [Download Python](https://www.python.org/downloads/)

2. **Git**
   - [Download Git](https://git-scm.com/downloads)

3. **Pip**
   - Usually installed with Python. You can verify by running:
     ```bash
     pip --version
     ```

4. **Node.js and npm**
   - [Download Node.js](https://nodejs.org/) (Ensure npm is installed with it).
     Verify installation:
     ```bash
     node --version
     npm --version
     ```

5. **A Code Editor (Optional)**
   - Examples: [VS Code](https://code.visualstudio.com/), PyCharm, or any text editor.

---

## **Cloning the Repository**
1. Open a terminal (Command Prompt, PowerShell, or macOS Terminal).
2. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/<your-username>/flask_app.git
   cd flask_app
   ```

---

## **Setting Up the Environment**

### For Windows
1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   ```bash
   venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### For macOS
1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   ```

2. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
### Database Setup
If you a part of the orginal group the way you can use the database is by going to the database folder
In there there is a .env.example file, please copy that file and name it .env, then fill in the information provided to you by the backend team

If you are not part of the orninal team, you will need to connect a database, we used a mariaDB database with MySQL, fill in with the proper credentials and then open the way you will be interacting with MySQL and run the onit-data.sql file in your database. That will create the schema of onit, all the tables and insert needed and some temp data. 
### Node.js Setup
1. Navigate to the project directory:
   ```bash
   cd flask_app
   ```
2. Install Node.js dependencies:
   ```bash
   npm install puppeteer
   ```
3. Ensure the Puppeteer script (`html_to_pdf.js`) is in the project root.

---

## **Running the Application**

1. Ensure you are in the project directory and your virtual environment is activated.
2. Run the Flask application:
   ```bash
   python app.py
   ```
3. Open a browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```
4. To generate a PDF, navigate to the **report** page and click the **Download Report** button. The PDF will be generated using Puppeteer and saved to the `static` directory.

---

## **Directory Structure**
```
flask_app/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── templates/          # HTML files
│   ├── index.html      # Homepage template
│   ├── report.html     # Report template
│   └── previous_audits.html # Previous audits page
├── static/             # Static files (CSS, JS, images)
│   ├── style.css       # Stylesheet
│   ├── report-style.css# Report-specific styles
│   ├── script.js       # JavaScript file
│   └── audit_responses.json # JSON for audit data
├── html_to_pdf.js      # Puppeteer script for PDF generation
├── venv/               # Virtual environment (not included in repo)
└── .gitignore          # Git ignore file
```

---

## **FAQ**

### **1. I see a `ModuleNotFoundError` when running the app. What should I do?**
- Ensure you've activated the virtual environment.
- Run `pip install -r requirements.txt` to install all dependencies.

### **2. How do I generate a PDF report?**
- Ensure Node.js and Puppeteer are installed.
- Click the **Download Report** button on the **report** page.

### **3. How do I deactivate the virtual environment?**
- For Windows:
  ```bash
  deactivate
  ```
- For macOS:
  ```bash
  deactivate
  ```

### **4. How do I add new dependencies?**
- Install the dependency:
  ```bash
  pip install <package-name>
  ```
- Update the `requirements.txt` file:
  ```bash
  pip freeze > requirements.txt
  ```

---

If you encounter any issues, feel free to reach out to the repository maintainer or submit an issue on GitHub.

Happy coding!


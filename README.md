# on-it - README

Welcome to the on-it repository! Your Cybersecurity Solution. An application that guides small businesses through the steps of a cybersecurity audit. This guide will help you set up and run the Flask application on your local machine, whether you're using Windows or macOS.

---

## **Table of Contents**
1. [Prerequisites](#prerequisites)
2. [Cloning the Repository](#cloning-the-repository)
3. [Setting Up the Environment](#setting-up-the-environment)
   - [For Windows](#for-windows)
   - [For macOS](#for-macos)
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

4. **A Code Editor (Optional)**
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

---

## **Directory Structure**
```
flask_app/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── templates/          # HTML files
│   └── index.html      # Homepage template
├── static/             # Static files (CSS, JS, images)
│   ├── style.css       # Stylesheet
│   └── script.js       # JavaScript file
├── venv/               # Virtual environment (not included in repo)
└── .gitignore          # Git ignore file
```

---

## **FAQ**

### **1. I see a `ModuleNotFoundError` when running the app. What should I do?**
- Ensure you've activated the virtual environment.
- Run `pip install -r requirements.txt` to install all dependencies.

### **2. How do I deactivate the virtual environment?**
- For Windows:
  ```bash
  deactivate
  ```
- For macOS:
  ```bash
  deactivate
  ```

### **3. Can I use this app on a different Python version?**
- The app is tested with Python 3.8+. It might work on earlier versions, but using the recommended version is advised.

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


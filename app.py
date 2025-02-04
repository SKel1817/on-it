from flask import Flask, redirect, render_template, request, jsonify, send_file, session, url_for
import os
import json
from datetime import datetime
import subprocess
from dotenv import load_dotenv
import mariadb
from mariadb import Error
import sys
import bcrypt

# Ideal workflow w/ current JSON logic no database:
# - Javascript requests flask API
# - Flask API fetches JSON file and returns it to Javascript
# - Javascript displays the JSON data on the frontend
# - User interacts with the frontend and sends a POST request to Flask
# - Flask API saves the POST request to the JSON file
# - Repeat

app = Flask(__name__)
# Database connection 
# Load preferences from .env
load_dotenv()

# secert key for session variables
app.secret_key = 'your_unique_and_secret_key'

# Set IP address
IP_ADDR = os.getenv("IP_ADDR") if os.getenv("IP_ADDR") else "localhost"
print(f"IP Address: {IP_ADDR}")

# Make connection to mariadb database using .env (DB_USER, DB_PASS, SCHEMA_NAME), will have to refrence everytime you want to make a query
def get_db_connection():
    try:
        conn = mariadb.connect(
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            host=IP_ADDR,
            port=3306,
            database=os.getenv("SCHEMA_NAME")
        )
        return conn
    except Error as e:
        print(f"Database connection error: {e}")
        return None


# Path to the JSON file -- remove when database is connected
RESPONSES_FILE = os.path.join("static", "audit_responses.json")
REPORT_TEMPLATE = os.path.join("templates", "report.html")
OUTPUT_PDF = os.path.join("static", "output.pdf")
PUPPETEER_SCRIPT = os.path.join(os.getcwd(), "html_to_pdf.js")

# Function to ensure the file exists and is properly initialized -- remove once database is set up
def ensure_file_exists():
    if not os.path.exists(RESPONSES_FILE):
        with open(RESPONSES_FILE, "w") as f:
            json.dump([], f)
# API Database queries -------------------------------------------------------------
# User Logic Start ------------------
# user login -- To be done

# create user -- done
@app.route("/create_user", methods=["POST"])
def create_user():
    try:
        data = request.json

        # Required fields for all users
        required_fields = ["first_name", "last_name", "username", "email", "password", "familarity_with_audits", "business_indicator"]

        # Validate the presence of required fields
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Validate and process `business_indicator`
        business_indicator = int(data.get("business_indicator", 0))  # Default to 0 (No)
        if business_indicator not in [0, 1]:
            return jsonify({"error": "Invalid business indicator value"}), 400

        # Set `role` and `company` to "N/A" if not a business
        role = data.get("role", "N/A") if business_indicator == 1 else "N/A"
        company = data.get("company", "N/A") if business_indicator == 1 else "N/A"

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()

        # Check for duplicate username or email
        cur.execute("SELECT username FROM user_table WHERE username=? OR email=?", (data["username"], data["email"]))
        existing_user = cur.fetchone()

        if existing_user:
            cur.close()
            conn.close()
            return jsonify({"error": "Username or email already exists"}), 409

        # Hash the password
        hashed_password = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # Insert user into the database
        cur.execute("""
            INSERT INTO user_table (first_name, last_name, username, email, password, familarity_with_audits, role, company, business_indicator)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (data["first_name"], data["last_name"], data["username"], data["email"], hashed_password,
             data["familarity_with_audits"], role, company, business_indicator))

        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "User added successfully!"}), 200

    except Exception as e:
        print(f"Error adding user: {e}")
        return jsonify({"error": "Failed to add user."}), 500
# User Logic End ------------------

# Audit Logic Start ------------------
# API for fetching audit steps from DB -- DONE
@app.route("/get_audit_steps", methods=["GET"])
def get_audit_steps():
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("SELECT Step, instruction, explanation, example FROM audit_steps_table")
        rows = cur.fetchall()
        
        audit_steps = {row[0]: {"Instruction": row[1], "Explanation": row[2], "Example": json.loads(row[3])} for row in rows}
        
        cur.close()
        conn.close()
        return jsonify({"CybersecurityAudit": audit_steps})
    except Exception as e:
        print(f"Error loading audit steps: {e}")
        return jsonify({"error": "Failed to load audit steps."}), 500

# API for fetching audit dates -- modify once database is set up (will be API for report dates) -- TO DO
@app.route("/get_audit_dates", methods=["GET"])
def get_audit_dates():
    # I think this might be the code for the audit dates:
    # def get_audit_dates():
    # try:
    #     conn = get_db_connection()
    #     if conn is None:
    #         return jsonify({"error": "Database connection failed"}), 500
        
    #     cur = conn.cursor()
    #     cur.execute("SELECT DISTINCT DATE(date) FROM audit_responses")
    #     rows = cur.fetchall()
        
    #     dates = [row[0].strftime("%Y-%m-%d") for row in rows]
        
    #     cur.close()
    #     conn.close()
    #     return jsonify({"dates": dates})
    # except Exception as e:
    #     print(f"Error loading audit dates: {e}")
    #     return jsonify({"error": "Failed to load audit dates."}), 500
    try:
        responses_file = os.path.join("static", "audit_responses.json")
        with open(responses_file, "r") as f:
            responses = json.load(f)
        # Extract unique dates
        unique_dates = sorted({item["date"].split("T")[0] for item in responses})
        return jsonify({"dates": unique_dates})
    except Exception as e:
        print(f"Error fetching audit dates: {e}")
        return jsonify({"error": "Failed to load audit dates."}), 500

# API for fetching report data -- modify once database is set up (will be API for report) -- TO DO
@app.route("/get_report_data", methods=["GET"])
def get_report_data():
    try:
        date = request.args.get("date")
        if not date:
            return jsonify({"error": "Date is required"}), 400

        responses_file = os.path.join("static", "audit_responses.json")
        steps_file = os.path.join("static", "auditsteps.json")

        with open(responses_file, "r") as f:
            responses = json.load(f)

        with open(steps_file, "r") as f:
            steps = json.load(f).get("CybersecurityAudit", {})

        filtered_responses = [
            {"step": item["responses"]["step"], "answer": item["responses"]["answer"]}
            for item in responses if item["date"].startswith(date)
        ]

        return jsonify({"responses": filtered_responses, "steps": steps})
    except Exception as e:
        print(f"Error fetching report data: {e}")
        return jsonify({"error": "Failed to load report data."}), 500

# modify once database set up, temp JOSN saving method (Will be API for Save responses) -- TO DO
@app.route("/save_response", methods=["POST"])
def save_response():
    try:
        # Ensure the file exists and is initialized
        ensure_file_exists()

        # Read the existing responses -- can remove after database is set up
        with open(RESPONSES_FILE, "r") as f:
            try:
                responses = json.load(f)
            except json.JSONDecodeError:
                # If the file is corrupted or empty, reinitialize it
                responses = []

        # Get the incoming data from the POST request
        data = request.json
        if not data or "step" not in data or "answer" not in data:
            return jsonify({"error": "Invalid data"}), 400

        # Add the new response -- remove / modify after this point
        new_entry = {
            "date": datetime.utcnow().isoformat(),
            "responses": {
                "step": data["step"],
                "answer": data["answer"]
            }
        }
        responses.append(new_entry)
        # example database logic
        # INSERT INTO bruh (date, step, answer) VALUES (now(), new_entry["responses"]["step"], new_entry["responses"]["answer"])

        # Save the updated responses back to the file -- remove
        with open(RESPONSES_FILE, "w") as f:
            json.dump(responses, f, indent=2)

        return jsonify({"message": "Response saved successfully!"}), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Internal server error"}), 500
# Audit Logic End ------------------

# API for fetching audit frameworks from DB  -- DONE
@app.route("/get_frameworks", methods=["GET"])
def get_frameworks():
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500
        
        cur = conn.cursor()
        cur.execute("SELECT name, definition, how_to_use, advantages, disadvantages, link FROM frameworks_table")
        rows = cur.fetchall()
        
        frameworks = []
        for row in rows:
            try:
                how_to_use = json.loads(row[2]) if row[2].startswith("[") else row[2].split(";")
                advantages = json.loads(row[3]) if row[3].startswith("[") else row[3].split(";")
                disadvantages = json.loads(row[4]) if row[4].startswith("[") else row[4].split(";")
            except json.JSONDecodeError:
                how_to_use, advantages, disadvantages = row[2].split(";"), row[3].split(";"), row[4].split(";")  # Fallback to list format

            frameworks.append({
                "name": row[0],
                "definition": row[1],
                "how_to_use": how_to_use,
                "advantages": advantages,
                "disadvantages": disadvantages,
                "link": row[5]
            })
        
        cur.close()
        conn.close()
        return jsonify({"frameworks": frameworks})
    except Exception as e:
        print(f"Error loading frameworks: {e}")
        return jsonify({"error": "Failed to load frameworks."}), 500
# End of API Database queries -------------------------------------------------------------


# function for generating the pdf 
@app.route("/generate_pdf", methods=["GET"])
def generate_pdf():
    try:
        # Get the requested date from the query parameters
        date = request.args.get("date")
        if not date:
            return jsonify({"error": "Date parameter is missing"}), 400

        # Call the Puppeteer script with the date as an argument
        subprocess.run(["node", PUPPETEER_SCRIPT, date], check=True)

        # Send the generated PDF file
        return send_file(OUTPUT_PDF, as_attachment=True)

    except subprocess.CalledProcessError as e:
        print("Error generating PDF with Puppeteer:", e)
        return jsonify({"error": "Failed to generate PDF"}), 500
    except Exception as e:
        print("Unexpected error:", e)
        return jsonify({"error": "Internal server error"}), 500


# search page logic
# function to grab the search data from form
@app.route('/display_search', methods=['POST'])
def display_search():
    session['error_code'] = request.form.get('error_code')
    session['power_status'] = request.form.get('power_status')
    session['updated_recently'] = request.form.get('updated_recently')
    session['device_name'] = request.form.get('device_name')
    session['device_model'] = request.form.get('device_model')

    return redirect(url_for('search_page'))

# function to display the search page with the variables
@app.route('/search')
def search_page():
    return render_template('search.html', 
                           error_code=session.get('error_code'), 
                           power_status=session.get('power_status'), 
                           updated_recently=session.get('updated_recently'), 
                           device_name=session.get('device_name'), 
                           device_model=session.get('device_model'))

# pages logic
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/audit")
def audit():
    return render_template("audit.html")

@app.route("/acctCreate")
def acctCreate():
    return render_template("acctCreate.html")

@app.route("/settings")
def settings():
    return render_template("settings.html")

@app.route("/report")
def report():
    return render_template("report.html")

@app.route("/previous")
def previous_audits():
    return render_template("previous_audits.html")

@app.route("/learn")
def learn():
    return render_template("learn.html")

@app.route("/troubleshooting")
def troubleshooting():
    return render_template("troubleshooting.html")


# main loop to run the app
if __name__ == "__main__":
    ensure_file_exists()
    app.run(debug=True)

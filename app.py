from flask import Flask, flash, redirect, render_template, request, jsonify, send_file, session, url_for
import os
import json
from datetime import datetime
import subprocess
from dotenv import load_dotenv
import mariadb
from mariadb import Error
import bcrypt
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user

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

#set up Flask Login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"  # Redirect to login page if unauthorized

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

# User model for Flask-Login
class User(UserMixin):
    def __init__(self, user_id, username, password, email, first_name, last_name, role, familarity_with_audits):
        self.id = user_id
        self.username = username
        self.password = password
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.role = role
        self.familarity_with_audits = familarity_with_audits


# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    conn = get_db_connection()
    if conn is None:
        return None

    cur = conn.cursor()
    cur.execute("""
        SELECT iduser_table, username, password, email, first_name, last_name, role, familarity_with_audits
        FROM user_table
        WHERE iduser_table = ?
    """, (user_id,))
    user_data = cur.fetchone()

    cur.close()
    conn.close()

    if user_data:
        return User(
            user_id=user_data[0],
            username=user_data[1],
            password=user_data[2],
            email=user_data[3],
            first_name=user_data[4],
            last_name=user_data[5],
            role=user_data[6],
            familarity_with_audits=user_data[7]
        )
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
@app.route("/login-user", methods=["POST"])
def user_login():
    # Ensure Content-Type is application/json
    if request.content_type != "application/json":
        return jsonify({"error": "HAHA we are in app.py Unsupported Media Type. Please set Content-Type to application/json."}), 415

    try:
        # Parse JSON data
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Invalid JSON data"}), 400

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Missing username or password"}), 400

        # Database connection and query logic
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        cur.execute("""
            SELECT iduser_table, username, password, email, first_name, last_name, role, familarity_with_audits
            FROM user_table
            WHERE username=?
        """, (username,))
        user_data = cur.fetchone()

        cur.close()
        conn.close()

        if not user_data or not bcrypt.checkpw(password.encode("utf-8"), user_data[2].encode("utf-8")):
            return jsonify({"error": "Invalid username or password"}), 401

        # Create user object and log in
        user = User(
            user_id=user_data[0],
            username=user_data[1],
            password=user_data[2],
            email=user_data[3],
            first_name=user_data[4],
            last_name=user_data[5],
            role=user_data[6],
            familarity_with_audits=user_data[7]
        )
        login_user(user)
        return jsonify({"message": "Login successful!"}), 200

    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({"error": "An error occurred during login."}), 500
# Update current User details -- to be done
@app.route("/update_user", methods=["POST"])
@login_required
def update_user():
    try:
        data = request.json
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()

        # Validate if the fields exist in the payload
        fields_to_update = {}
        if "email" in data:
            fields_to_update["email"] = data["email"]
        if "password" in data:
            # Hash the new password
            fields_to_update["password"] = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        if "first_name" in data:
            fields_to_update["first_name"] = data["first_name"]
        if "last_name" in data:
            fields_to_update["last_name"] = data["last_name"]
        if "role" in data:
            fields_to_update["role"] = data["role"]
        if "familarity_with_audits" in data:
            fields_to_update["familarity_with_audits"] = data["familarity_with_audits"]

        if not fields_to_update:
            return jsonify({"error": "No valid fields to update."}), 400

        # Dynamically construct the update query
        update_query = "UPDATE user_table SET " + ", ".join(
            f"{field} = ?" for field in fields_to_update.keys()
        ) + " WHERE iduser_table = ?"
        cur.execute(update_query, list(fields_to_update.values()) + [current_user.id])

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "User account updated successfully."}), 200
    except Exception as e:
        print(f"Error updating user: {e}")
        return jsonify({"error": "Failed to update user account."}), 500
# create user -- done
@app.route("/create_user", methods=["POST"])
def create_user():
    try:
        data = request.json

        # Required fields for all users
        required_fields = ["first_name", "last_name", "username", "email", "password", "password_conf", "familarity_with_audits", "business_indicator"]

        # Validate the presence of required fields
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Confirm passwords match
        if data["password"] != data["password_conf"]:
            return jsonify({"error": "Passwords do not match"}), 400

        # Validate and process `business_indicator`
        business_indicator = int(data.get("business_indicator", 0))  # Default to 0 (No)
        if business_indicator not in [0, 1]:
            return jsonify({"error": "Invalid business indicator value"}), 400

        # Set `role` and `company` to "N/A" if not a business
        role = data.get("role", "N/A") if business_indicator == 1 else "N/A"

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
            INSERT INTO user_table (first_name, last_name, username, email, password, familarity_with_audits, role, business_indicator)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (data["first_name"], data["last_name"], data["username"], data["email"], hashed_password,
                data["familarity_with_audits"], role, business_indicator))

        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "User added successfully!"}), 200

    except Exception as e:
        print(f"Error adding user: {e}")
        return jsonify({"error": "Failed to add user."}), 500

# User Logic End ------------------

#logout logic - Done
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))
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
        # pass along the user's familariity with audits
        cur.close()
        conn.close()
        return jsonify({"CybersecurityAudit": audit_steps})
    except Exception as e:
        print(f"Error loading audit steps: {e}")
        return jsonify({"error": "Failed to load audit steps."}), 500

# API for fetching audit dates -- modify once database is set up (will be API for report dates) -- TO DO
@app.route("/get_audit_dates", methods=["GET"])
def get_audit_dates():
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        cur.execute("SELECT DISTINCT DATE(date) FROM onit.audit_response_table WHERE user_table_iduser_table = ?", (current_user.id,))
        rows = cur.fetchall()
        dates = [row[0].strftime("%Y-%m-%d") for row in rows]

        cur.close()
        conn.close()
        return jsonify({"dates": dates})
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

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        cur.execute("""
            SELECT response_step, response_answer
            FROM audit_response_table
            WHERE DATE(date) = ?
        """, (date,))
        responses = [{"step": row[0], "answer": row[1]} for row in cur.fetchall()]

        cur.execute("""
            SELECT Step, instruction
            FROM audit_steps_table
        """)
        steps = {row[0]: {"Instruction": row[1]} for row in cur.fetchall()}

        cur.close()
        conn.close()

        return jsonify({"responses": responses, "steps": steps}), 200
    except Exception as e:
        print(f"Error fetching report data: {e}")
        return jsonify({"error": "Failed to load report data."}), 500

# modify once database set up, temp JOSN saving method (Will be API for Save responses) -- TO DO
@app.route("/save_response", methods=["POST"])
@login_required
def save_response():
    try:
        data = request.json
        if not data or "response_step" not in data or "response_answer" not in data:
            return jsonify({"error": "Invalid data"}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        cur.execute("""
            INSERT INTO audit_response_table (date, response_step, response_answer, user_table_iduser_table)
            VALUES (NOW(), ?, ?, ?)
        """, (data["response_step"], data["response_answer"], current_user.id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Response saved successfully!"}), 200
    except Exception as e:
        print("Error saving response:", e)
        return jsonify({"error": "Internal server error"}), 500
    
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
        date = request.args.get("date")
        if not date:
            return jsonify({"error": "Date parameter is missing"}), 400
        name = current_user.first_name + " " +current_user.last_name
        role = current_user.role
        if role == "":
            role = "N/A"

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        # Fetch responses for the given date
        cur.execute("""
            SELECT response_step, response_answer
            FROM audit_response_table
            WHERE DATE(date) = ?
        """, (date,))
        responses = [{"repsonse_step": row[0], "response_answer": row[1]} for row in cur.fetchall()]
        cur.close()
        conn.close()

        # Save responses to a temporary file or pass them to Puppeteer
        temp_file = os.path.join("static", "temp_data.json")
        with open(temp_file, "w") as f:
            json.dump(responses, f)

        # Call Puppeteer to generate the PDF
        subprocess.run(["node", PUPPETEER_SCRIPT, date], check=True)


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

def check_user_login():
    if current_user.is_authenticated:
        print(f"Logged in as: {current_user.username}")

@app.route("/login")
def login():
    return render_template("login.html")

# login page is in the API's for ease of use
@app.route("/profile")
@login_required
def profile():
    return jsonify({
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "familarity_with_audits": current_user.familarity_with_audits
    })

@app.route("/audit")
@login_required
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

@app.route("/changePassword")
def changePassword():
    return render_template("changePassword.html")


# main loop to run the app
if __name__ == "__main__":
    ensure_file_exists()
    app.run(debug=True)

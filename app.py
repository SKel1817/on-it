from flask import Flask, flash, redirect, render_template, request, jsonify, send_file, session, url_for
import os
import json
from datetime import datetime, timedelta
import subprocess
from dotenv import load_dotenv
import mariadb
from mariadb import Error
import bcrypt
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import secrets

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
        cur.execute("""INSERT INTO user_table (first_name, last_name, username, email, password, familarity_with_audits, role, business_indicator) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
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
# API for checking incomplete audits
@app.route("/check_incomplete_audit", methods=["GET"])
@login_required
def check_incomplete_audit():
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        
        # First get all audit steps to determine total steps
        cur.execute("SELECT COUNT(*) FROM audit_steps_table")
        total_steps = cur.fetchone()[0]
        
        # Get the most recent incomplete audit session
        # An audit session is considered incomplete if it doesn't contain a Step6 response
        cur.execute("""
            SELECT DATE(date) as audit_date, COUNT(*) as steps_completed, session_id
            FROM audit_response_table
            WHERE user_table_iduser_table = ?
            AND (date, session_id) NOT IN (
                SELECT date, session_id
                FROM audit_response_table
                WHERE user_table_iduser_table = ?
                AND response_step = 'Step6'
            )
            GROUP BY DATE(date), session_id
            HAVING COUNT(*) < ?
            ORDER BY date DESC, session_id DESC
            LIMIT 1        """, (current_user.id, current_user.id, total_steps))
        
        incomplete_audit = cur.fetchone()
        
        if incomplete_audit:
            audit_date = incomplete_audit[0].strftime("%Y-%m-%d")
            completed_steps = incomplete_audit[1]
            session_id = incomplete_audit[2]
            
            # Get the most recent step that was completed in this session
            cur.execute("""
                SELECT response_step
                FROM audit_response_table
                WHERE user_table_iduser_table = ? AND DATE(date) = ? AND session_id = ?
                ORDER BY date DESC
                LIMIT 1
            """, (current_user.id, audit_date, session_id))
            
            last_step = cur.fetchone()[0]
            
            # Get all responses for this specific session to restore the audit state
            cur.execute("""
                SELECT response_step, response_answer
                FROM audit_response_table
                WHERE user_table_iduser_table = ? AND DATE(date) = ? AND session_id = ?
            """, (current_user.id, audit_date, session_id))
            
            responses = [{"step": row[0], "answer": row[1]} for row in cur.fetchall()]
            
            cur.close()
            conn.close()
            
            progress_percentage = round((completed_steps / total_steps) * 100)
            
            return jsonify({
                "incomplete_audit": True,
                "date": audit_date,
                "completed_steps": completed_steps,
                "total_steps": total_steps,
                "progress_percentage": progress_percentage,
                "last_step": last_step,
                "responses": responses
            })
        else:
            cur.close()
            conn.close()
            return jsonify({"incomplete_audit": False})
            
    except Exception as e:
        print(f"Error checking incomplete audit: {e}")
        return jsonify({"error": "Failed to check for incomplete audits."}), 500

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
        
        audit_steps = {}
        for row in rows:
            step = row[0]
            instruction = row[1]
            explanation = row[2]
            example_str = row[3]
            
            # Handle text data from the database instead of trying to parse it as JSON
            if example_str and example_str.strip():
                # If the data looks like JSON, try to parse it
                if (example_str.strip().startswith('{') and example_str.strip().endswith('}')) or \
                   (example_str.strip().startswith('[') and example_str.strip().endswith(']')):
                    try:
                        example = json.loads(example_str)
                    except json.JSONDecodeError:
                        # If JSON parsing fails, use the string as is
                        print(f"Could not parse JSON for step {step}, using raw string")
                        example = example_str
                else:
                    # Not JSON format, use as plain text
                    example = example_str
            else:
                # Empty or null value
                example = ""
            
            audit_steps[step] = {
                "Instruction": instruction,
                "Explanation": explanation,
                "Example": example
            }
        
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
        
        # Query to get unique date-session combinations and check if each session has a Step6 (complete)
        cur.execute("""
            SELECT 
                DATE(a.date) as audit_date, 
                a.session_id,
                EXISTS (
                    SELECT 1 
                    FROM audit_response_table 
                    WHERE user_table_iduser_table = ? 
                    AND DATE(date) = DATE(a.date) 
                    AND session_id = a.session_id 
                    AND response_step = 'Step6'
                ) as is_complete
            FROM audit_response_table a
            WHERE a.user_table_iduser_table = ?
            GROUP BY DATE(a.date), a.session_id
            ORDER BY DATE(a.date) DESC, a.session_id DESC
        """, (current_user.id, current_user.id))
        
        rows = cur.fetchall()
        audit_sessions = []
        # For backward compatibility with existing code
        dates = []
        
        for row in rows:
            date_str = row[0].strftime("%Y-%m-%d")
            session_id = row[1]
            is_complete = bool(row[2])
            
            # Add to dates array for backward compatibility
            if date_str not in dates:
                dates.append(date_str)
            
            # Format as "2025-04-10" for single sessions, "2025-04-10 (Session 2)" for multiple
            display_name = date_str
            if session_id > 1:
                display_name = f"{date_str} (Session {session_id})"
                
            audit_sessions.append({
                "date": date_str,
                "session_id": session_id,
                "display_name": display_name,
                "is_complete": is_complete
            })

        cur.close()
        conn.close()
        return jsonify({"audit_sessions": audit_sessions, "dates": dates})
    except Exception as e:
        print(f"Error fetching audit dates: {e}")
        return jsonify({"error": "Failed to load audit dates."}), 500

# API for fetching report data -- modified to support token authentication
@app.route("/get_report_data", methods=["GET"])
def get_report_data():
    try:
        date = request.args.get("date")
        if not date:
            return jsonify({"error": "Date is required"}), 400
        
        # Check for token-based authentication
        token = request.args.get("token")
        if token and token in report_tokens:
            user_id = report_tokens[token]["user_id"]
        elif current_user.is_authenticated:
            user_id = current_user.id
        else:
            return jsonify({"error": "Authentication required"}), 401

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500        # Get session_id from request parameters, default to 1
        session_id = request.args.get("session_id", 1)
        try:
            session_id = int(session_id)
        except (ValueError, TypeError):
            session_id = 1

        cur = conn.cursor()
        cur.execute("""
            SELECT response_step, response_answer
            FROM audit_response_table
            WHERE DATE(date) = ? AND user_table_iduser_table = ? AND session_id = ?
        """, (date, user_id, session_id))
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

        # Get or create session_id for the current date
        session_id = data.get("session_id")
        if not session_id:
            # Check if we need to create a new session for today
            cur = conn.cursor()
            today = datetime.now().strftime("%Y-%m-%d")
            
            # Find the latest session_id for today
            cur.execute("""
                SELECT MAX(session_id) FROM audit_response_table 
                WHERE user_table_iduser_table = ? AND DATE(date) = ?
            """, (current_user.id, today))
            
            result = cur.fetchone()
            if result and result[0] is not None:
                session_id = result[0]
                
                # Check if this session has a Step6 (which means it's complete)
                cur.execute("""
                    SELECT 1 FROM audit_response_table
                    WHERE user_table_iduser_table = ? AND DATE(date) = ? 
                    AND session_id = ? AND response_step = 'Step6'
                """, (current_user.id, today, session_id))
                
                if cur.fetchone():
                    # This session is complete, create a new one
                    session_id = result[0] + 1
            else:
                # First session of the day
                session_id = 1
        
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO audit_response_table (date, response_step, response_answer, user_table_iduser_table, session_id)
            VALUES (NOW(), ?, ?, ?, ?)
        """, (data["response_step"], data["response_answer"], current_user.id, session_id))

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


# Token storage for report access
report_tokens = {}

# Generate a temporary token for report access
def generate_report_token(user_id, expiry_minutes=5):
    token = secrets.token_urlsafe(32)
    expiry_time = datetime.now() + timedelta(minutes=expiry_minutes)
    report_tokens[token] = {"user_id": user_id, "expiry": expiry_time}
    return token

# Add a token-authenticated report route
@app.route("/report-with-token")
def report_with_token():
    token = request.args.get("token")
    date = request.args.get("date")
    if not token or token not in report_tokens:
        return redirect(url_for("login"))
    
    token_data = report_tokens[token]
    # Check if token has expired
    if datetime.now() > token_data["expiry"]:
        del report_tokens[token]  # Remove expired token
        return redirect(url_for("login"))
    
    # Retrieve user data for the token
    user_id = token_data["user_id"]
    user = load_user(user_id)
    if not user:
        return redirect(url_for("login"))
    
    # Render the report template with the user data and date
    return render_template("report.html", current_user=user, report_date=date)

# Add an endpoint to generate a token for PDF generation
@app.route("/get_report_token", methods=["POST"])
def get_report_token():
    data = request.json
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    token = generate_report_token(user_id)
    return jsonify({"token": token})

# function for generating the pdf 
@app.route("/generate_pdf", methods=["GET"])
def generate_pdf():
    try:
        date = request.args.get("date")
        if not date:
            return jsonify({"error": "Date parameter is missing"}), 400

        user_id = current_user.id
        if not user_id:
            return jsonify({"error": "User ID is missing"}), 400

        # Get the session_id from request parameters
        session_id = request.args.get("session_id")
        print(f"Raw session_id from request.args: {request.args.get('session_id')}")
        if not session_id:
            print("session_id parameter is missing in the request.")
            return jsonify({"error": "Session ID parameter is missing"}), 400

        print(f"Extracted session_id from request: {session_id}")

        # Format the parameter as "userId-sessionId" to pass both values to the script
        user_param = f"{user_id}-{session_id}"
        print(f"Formatted user_param: {user_param}")

        # Call Puppeteer to generate the PDF with the combined parameter
        subprocess.run(["node", PUPPETEER_SCRIPT, date, user_param], check=True)

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
@login_required
def report():
    # Extract session_id from request parameters
    session_id = request.args.get("session_id", "1")  # Default to 1 if not provided
    return render_template("report.html", current_user=current_user, session_id=session_id)

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

# Add an endpoint to get user data by ID for report generation
@app.route("/get_user_data", methods=["GET"])
def get_user_data():
    try:
        user_id = request.args.get("userId")
        token = request.args.get("token")
        
        # Validate the token if provided
        if token:
            if token not in report_tokens:
                return jsonify({"error": "Invalid token"}), 401
            token_data = report_tokens[token]
            if datetime.now() > token_data["expiry"]:
                del report_tokens[token]
                return jsonify({"error": "Token expired"}), 401
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
            
        # Load user data from database
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        cur.execute("""
            SELECT first_name, last_name, role
            FROM user_table
            WHERE iduser_table = ?
        """, (user_id,))
        
        user_data = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user_data:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({
            "firstName": user_data[0],
            "lastName": user_data[1],
            "role": user_data[2]
        }), 200
        
    except Exception as e:
        print(f"Error getting user data: {e}")
        return jsonify({"error": "Failed to get user data"}), 500

# Add new endpoint for marking an audit as complete
@app.route("/mark_audit_complete", methods=["POST"])
@login_required
def mark_audit_complete():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid data"}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        # Get the current session ID or create one
        cur = conn.cursor()
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Find the latest session_id for today
        cur.execute("""
            SELECT MAX(session_id) FROM audit_response_table 
            WHERE user_table_iduser_table = ? AND DATE(date) = ?
        """, (current_user.id, today))
        
        result = cur.fetchone()
        session_id = 1
        if result and result[0] is not None:
            session_id = result[0]
        
        # First, add the Step6 completion marker
        cur.execute("""
            INSERT INTO audit_response_table (date, response_step, response_answer, user_table_iduser_table, session_id)
            VALUES (NOW(), 'Step6', 'Audit completed', ?, ?)
        """, (current_user.id, session_id))
        
        # Log completion for debugging
        app.logger.info(f"Marked audit as complete for user {current_user.id}, session {session_id}")
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True, 
            "message": "Audit marked as complete", 
            "session_id": session_id,
            "date": today
        })
    
    except Exception as e:
        app.logger.error(f"Error marking audit as complete: {e}")
        return jsonify({"error": f"Failed to mark audit as complete: {str(e)}"}), 500

# main loop to run the app
if __name__ == "__main__":
    ensure_file_exists()
    app.run(debug=True)

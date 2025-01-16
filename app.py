from flask import Flask, render_template, request, jsonify, send_file
import os
import json
from datetime import datetime
import subprocess

app = Flask(__name__)

# Path to the JSON file
RESPONSES_FILE = os.path.join("static", "audit_responses.json")
REPORT_TEMPLATE = os.path.join("templates", "report.html")
OUTPUT_PDF = os.path.join("static", "output.pdf")
PUPPETEER_SCRIPT = os.path.join(os.getcwd(), "html_to_pdf.js")


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



# Function to ensure the file exists and is properly initialized
def ensure_file_exists():
    if not os.path.exists(RESPONSES_FILE):
        with open(RESPONSES_FILE, "w") as f:
            json.dump([], f)


@app.route("/save_response", methods=["POST"])
def save_response():
    try:
        # Ensure the file exists and is initialized
        ensure_file_exists()

        # Read the existing responses
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

        # Add the new response
        new_entry = {
            "date": datetime.utcnow().isoformat(),
            "responses": {
                "step": data["step"],
                "answer": data["answer"]
            }
        }
        responses.append(new_entry)

        # Save the updated responses back to the file
        with open(RESPONSES_FILE, "w") as f:
            json.dump(responses, f, indent=2)

        return jsonify({"message": "Response saved successfully!"}), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Internal server error"}), 500


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
def acct_create():
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


if __name__ == "__main__":
    ensure_file_exists()
    app.run(debug=True)

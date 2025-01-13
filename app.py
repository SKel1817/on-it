from flask import Flask, render_template
import mysql.connector

app = Flask(__name__)

# Database connection
# def get_db_connection():
#     return mysql.connector.connect(
#         host="localhost",
#         user="flask_user",
#         password="your_password",
#         database="flask_app"
#     )

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/login')
def login():
    return render_template("login.html")

@app.route('/audit')
def audit():
    return render_template("audit.html")

@app.route('/acctCreate')
def acctCreate():
    return render_template("acctCreate.html")

@app.route('/settings')
def settings():
    return render_template("settings.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
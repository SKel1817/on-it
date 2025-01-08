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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
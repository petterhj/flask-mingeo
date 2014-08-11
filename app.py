# Imports
from flask import Flask, render_template, jsonify


# App
app = Flask(__name__)


# Index
@app.route('/')
def index():
    # Return
    return render_template('index.html')


# Main
if __name__ == "__main__":
    app.run(host='0.0.0.0')

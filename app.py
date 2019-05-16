# Imports
import re
import json
import datetime
from flask import Flask, render_template, request, jsonify
from flask_uwsgi_websocket import GeventWebSocket

from monitor import Server


# App
app = Flask(__name__, static_url_path='')

# Monitor
ws = GeventWebSocket(app)

monitor = Server(ws)


# Index
@app.route('/')
def index():
    # Return
    return render_template('index.html')


# Monitor
@app.route('/monitor')
def monitorview():
    # Return
    return render_template('monitor.html')


@ws.route('/websocket')
def websocket(ws):
    # Register
    client = monitor.register_client(ws)

    # Listen
    client.listen()

    # Disconnect
    monitor.remove_client(ws)


# Main
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=8080, gevent=100)
# Imports
import re
import json
import datetime
from collections import deque
from flask import Flask, render_template, request, jsonify
from flask.ext.uwsgi_websocket import GeventWebSocket
from flask_mail import Mail, Message
from validate_email import validate_email

from monitor import Server


# App
app = Flask(__name__, static_url_path='')

# Monitor
ws = GeventWebSocket(app)

monitor = Server(ws)

# Mail
mail = Mail()

app.config.update(
    MAIL_SERVER     = '',
    MAIL_PORT       = 465,
    MAIL_USE_SSL    = True,
    MAIL_USERNAME   = '',
    MAIL_PASSWORD   = ''
)


# Index
@app.route('/')
@app.route('/shareto/<share_address>')
def index(share_address=None):
    # Return
    return render_template('index.html', share_address=share_address)


# Monitor
@app.route('/monitor')
def monitor():
    # Return
    return render_template('monitor.html')


# Share location
@app.route('/share', methods=['POST'])
def share():
    # Check incoming data
    success = False
    
    try:
        data = request.get_json(force=True)
    except:
        pass
    else:
        if (('address' in data) and ('location' in data)):
            # Validate address
            address = data['address'].replace('_', '@').replace('-', '.')
            
            if validate_email(address):
                try:
                    # Initialize mail
                    mail.init_app(app)

                    # Generate and send message
                    latitude = re.sub('<[^<]+?>', '', str(data['location']['latitude']))
                    longitude = re.sub('<[^<]+?>', '', str(data['location']['longitude']))
                    link = 'https://www.google.no/maps/?q=' + latitude+',' + longitude

                    msg = Message('Delt posisjon', sender=('MinGeo', 'no-reply@mingeo.no'), recipients=[address])

                    msg.html  = '<b>Tidspunkt:</b> ' +  datetime.datetime.fromtimestamp((int(data['location']['timestamp'])/1000.0)).strftime('%Y-%m-%d %H:%M:%S')
                    msg.html += '<br><b>Latitude:</b> ' + latitude
                    msg.html += '<br><b>Longitude:</b> ' + longitude
                    msg.html += '<br><b>Accuracy:</b> ' + re.sub('<[^<]+?>', '', str((int(data['location']['accuracy']) / 1000.0))) + ' km.'
                    msg.html += '<br><b>Maps:</b> <a href="' + link + '">' + link + '</a>'

                    mail.send(msg)
                except:
                    pass
                else:
                    success = True
    
    # Return
    return jsonify({'success': success})
    

# Save location
@app.route('/save', methods=['POST'])
def save():
    #TODO: IMPLEMENT FALLBACK-METHOD?
    return jsonify({})


#=================================================================
#   SOCKETS
#=================================================================

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
    app.run(host='0.0.0.0', gevent=100)
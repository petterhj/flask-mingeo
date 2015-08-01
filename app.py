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


# Test
@app.route('/test')
def test():
    # Return
    return render_template('test.html')


# Monitor
@app.route('/monitor')
def monitor2():
    # Return
    return render_template('monitor.html')


# Location access
@app.route('/tillatelse')
def access():
    # Return
    return render_template('access.html')


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
    # IMPLEMENT AS BACKUP SOULUTION
    '''

    # Get data
    try:
        # Parse as JSON
        location    = request.get_json(force=True)

        # Validate data
        timestamp   = str(int(location['timestamp'])) if location['timestamp'] else ''
        latitude    = str(float(location['coords']['latitude'])) if location['coords']['latitude'] else ''
        longitude   = str(float(location['coords']['longitude'])) if location['coords']['longitude'] else ''
        altitude    = str(int(location['coords']['altitude'])) if location['coords']['altitude'] else ''
        accuracy    = str(int(location['coords']['accuracy'])) if location['coords']['accuracy'] else ''

    except:
        # Error
        out = {'status': 'fail', 'message': 'not able to parse json data'}

    else:
        try:
            # TODO: Do something completely different here.
            # And use socketIO to communicate with "operator" clients?

            # Save to file
            with open('lookups.datafile', 'a') as datafile:
                datafile.write(timestamp + '|' + latitude + '|' + longitude + '|' + altitude + '|' + accuracy + '\n')

        except Exception as e:
            # Error
            out = {'status': 'fail', 'message': str(e)}

        else:
            # Success
            out = {'status': 'success', 'message': 'saved to database'}

    # Return
    return jsonify(out)
    '''
    return jsonify({})


# @app.route('/robots.txt')
# def static_from_root():
#     print '---------------------------------------------'
#     print app.static_folder
#     print '---------------------------------------------'
#     return send_from_directory(app.static_folder, request.path[1:])


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
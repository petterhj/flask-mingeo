# Imports
from collections import deque
from flask import Flask, render_template, request, jsonify
from flask.ext.uwsgi_websocket import GeventWebSocket

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
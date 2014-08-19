#   Imports
import json


#   Server
# =======================================================================

class Server:
    # Init
    def __init__(self, server):
        # Variables
        self.server = server

        self.clients = {}
        self.backlog = []
    

    # Register new client
    def register_client(self, client):
        # New client
        client = Client(self, client)

        # Add to list
        self.clients[client.id] = client

        # Send client data
        client.send({
            'type':     'connect',
            'id':       client.uid,
            'backlog':  self.backlog
        })

        # Update client count
        self.update_client_count()

        # Return
        return client


    # Remove client
    def remove_client(self, client):
        # Remove
        del self.clients[client.id]

        # Update client count
        self.update_client_count()


    # Data received
    def data_received(self, client, data):
        print '[DATA][' + client.uid + ']', data

        # Type: Connect
        if data['type'] == 'connect':
            print data['monitor']

            if data['monitor']:
                client.is_monitor = True

        # Type: Location
        if data['type'] == 'location':
            # New location
            if 'location' in data:
                # Parse
                location = Location().parse(data['location'])

                if location:
                    # Add to backlog
                    self.backlog.append(location)

                    # Broadcast to monitoring clients
                    self.broadcast({
                        'type':     'location',
                        'client':   client.uid,
                        'location': location
                    }, monitors=True)


    # Broadcast
    def broadcast(self, data, monitors=False):
        # Only monitors
        if monitors:
            for client in self.clients:
                if self.clients[client].is_monitor:
                    # Send
                    self.clients[client].send(data)

        # All clients
        else:
            for client in self.clients:
                # Send
                self.clients[client].send(data)


    # Client count
    def client_count(self):
        # Count
        return len(self.clients)


    # Update client count
    def update_client_count(self):
        # Broadcast
        self.broadcast({
            'type':     'clients',
            'count':    self.client_count()
        })



#   Client
# =======================================================================

class Client:
    # Init
    def __init__(self, server, client):
        # Variables
        self.server = server
        self.client = client

        self.id = client.id;
        self.uid = self.id.split('-')[0]
        self.is_monitor = False


    # Listen
    def listen(self):
        while True:
            # Receive
            data = self.client.receive()
            
            if data is not None:
                # Keep-alive
                if (data != '') or (data != 'ping'):
                    # Parse data
                    try:
                        data = json.loads(data)
                    except:
                        pass
                    else:
                        # Send back to monitor
                        self.server.data_received(self, data)
            else:
                break

    
    # Send
    def send(self, data):
        # Pass data to client
        self.client.send(json.dumps(data))


#   Location
# =======================================================================

class Location:
    # Init
    def __init__(self):
        # Variables
        self.location = {
            'timestamp':    '',
            'latitude':     '',
            'longitude':    '',
            'altitude':     '',
            'accuracy':     ''
        }


    # Parse
    def parse(self, location):
        try:            
            self.location['timestamp']  = str(int(location['timestamp'])) if location['timestamp'] else ''
            self.location['latitude']   = str(float(location['latitude'])) if location['latitude'] else ''
            self.location['longitude']  = str(float(location['longitude'])) if location['longitude'] else ''
            self.location['altitude']   = str(int(location['altitude'])) if location['altitude'] else ''
            self.location['accuracy']   = str(int(location['accuracy'])) if location['accuracy'] else ''
        except:
            return None
        else:
            return self.location



#   Tests
# =======================================================================
if __name__ == "__main__":
    m = Server(None)

    #m.register_client()

    #print m.update_client_count()
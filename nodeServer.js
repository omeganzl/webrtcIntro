var static = require('node-static');
var http = require('http');

//create a node-static server instance listening on port 8181
var file = new(static.Server)();

//we use the http module's createServer function and use our instance of node-static to serve the files
var app = http.createServer(function (req, res) {
	file.serve(req, res);
}).listen(8181);

//Use socket.io javascript library for real-time web applications
var io = require('socket.io').listen(app);

//Lets start managing connections...
io.sockets.on('connection', function(socket){
	//handle 'message' messages
	socket.on('message', function(message) {
		log('S --> got message: ', message);
		socket.broadcast.to(message.channel).emit('message', message.message);
	});
	//handle create or join messages
	socket.on('create or join', function(channel) {
		console.log(channel);
		var res = [];
		room = io.sockets.adapter.rooms[channel];
			for (var id in room) {
			res.push(io.sockets.adapter.nsp.connected[id]);
	    
		}
		
			
		//var numClients = io.of['/'].adapter.rooms[channel].length;
		//var client_socket = 0;
		/*for (var clientId in numClients) {

		//io.sockets.clients(channel).length;
		console.log('numclients = ' + numClients);
		console.log('client: ' + clientId);
		client_socket = io.sockets.connected[clientId].length;
		console.log(client_socket);
		}*/
		//first client joining...
		if (res.length==0) {
			socket.join(channel);
			socket.emit('created', channel);
			
		//second client joining
		} else if (res.length==1) {
			//inform initiator...
			io.sockets.in(channel).emit('remotePeerJoining', channel);
			//Let the new peer join
			socket.join(channel);
			socket.broadcast.to(channel).emit('broadcast: joined', 'S --> broadcast(): client ' + socket.id + ' joined channel ' + channel);
			
		} else {
			//max two clients
			console.log('Channel full');
			socket.emit('full', channel);
		}
		console.log(res.length);
		return res;
			
	});
	//handle 'response' messages
	socket.on('response', function (response) {
		log('S --> Got response: ', response);

		//just forward message to other peer
	socket.broadcast.to(response.channel).emit('response', response.message);
	});

	//handle 'bye' mesage
	socket.on('Bye', function(channel) {
		//notify other peer
		socket.broadcast.to(channel).emit('Bye');
		//close socket from server's side
		socket.disconnect();
	});

	//handle ack messages
	socket.on('Ack', function() {
		console.log('Got an ACK!');
		//close socket from server side
		socket.disconnect();
	});

	//utility function used for remote logging
	function log() {
		var array = [">>> "];
		for (var i = 0; i < arguments.length; i++) {
			array.push(arguments[i]);
		}
		socket.emit('log', array);
	}
});

'use strict';

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;


server.listen(port, function (req, res) {
	console.log('Listening at port %d', port);
});

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});


io.on('connection', function(socket) {
	console.log(io.engine.clientsCount);
	socket.on('send_ice', function(data) {
		console.log('send_ice');
		socket.broadcast.emit('send_ice', data);
	});
	
	socket.on('set_remote_desc', function(data) {
		console.log('set_remote_desc');
		socket.broadcast.emit('set_remote_desc', data);
	});
	
});

'use strict';

var socket;
var isInitiator;
var pc;
var offerOptions;

var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');
var btnStart = document.getElementById('btnStart');
var btnCall = document.getElementById('btnCall');

window.onload = function(e){
	init();
}

function init(){
	socket = io();
	isInitiator = false;
	
	// Add to global scope so that it's accessible from the browser console
	window.pc = pc = new RTCPeerConnection(null);
	// fired when remote stream is available (after remote description is set)
	pc.ontrack = handleOnTrack;
	// fired when ice candidate is available (after local description is set)
	pc.onicecandidate = handleOnIceCandidate; 
		
	socket.on('set_remote_desc', handleOnSetRemoteDescription);
	socket.on('send_ice', handleOnSendIceCandidate);
	
	offerOptions = {
		offerToReceiveAudio: true,
		offerToReceiveVideo: true
	};

	btnCall.disabled = true;
	btnCall.onclick = call;
	btnStart.onclick = start;
	
}

function handleOnIceCandidate(event){
	if(event.candidate){
		console.log('Sending ice candidate start');
		socket.emit('send_ice', event.candidate);
	}
}

function handleOnTrack(event){
	if(!localVideo.srcObject){
		alert('Make sure camera is enabled');
		return;
	}
	else if(event.streams.length>0){
		console.log('Received remote stream');
		remoteVideo.srcObject = event.streams[0];	
		btnCall.disabled = true;
	}
}

function handleOnSendIceCandidate(candidate){
	pc.addIceCandidate(new RTCIceCandidate(candidate))
		.then(
			function() {
			console.log('Received and set ice candidate');
		},
			function(err) {
			console.log('Failed to set ice candidate %s', err);
			}
		);
}

function handleOnSetRemoteDescription(description){
		setRemoteDescription(description);
		
		if(!isInitiator){
			console.log('createAnswer start');
			// Since the 'remote' side has no media stream we need
			// to pass in the right constraints in order for it to
			// accept the incoming offer of audio and video.
			pc.createAnswer()
			.then(
				onCreateOfferOrAnswerSuccess,
				function(err){
					console.log('Failed to create/answer session description: %s', err)
					}
			);
		}
}

function gotStream(stream) {  
	console.log('Received local stream');
	pc.addStream(stream);
	localVideo.srcObject = stream;
	// Add to global scope so that it's accessible from the browser console
	window.localStream = stream;
	btnStart.disabled = true;
	btnCall.disabled = false;
}

function start() {
	console.log('Requesting local stream');	
	navigator.mediaDevices.getUserMedia({
		audio: false,
		video: true
	})
	.then(gotStream)
	.catch(function(err) {
		alert('getUserMedia() error: %s', JSON.stringify(err));
		console.log('getUserMedia() error: %s', err);
	});
}

function call(){
	isInitiator = true;
	pc.createOffer(offerOptions)
	.then(
		onCreateOfferOrAnswerSuccess,
		function(err){
			console.log('Failed to create/answer session description: %s', err)
			}
	);
		
    btnCall.disabled = true;
}

function onCreateOfferOrAnswerSuccess(description) {
	console.log('setLocalDescription start');
	setLocalDescription(description);
	
	console.log('setRemoteDescription start');
	socket.emit('set_remote_desc', description);
}

function setLocalDescription(description){
	pc.setLocalDescription(description)
	.then(
		function() {console.log('setLocalDescription complete')},
		function(err) {console.log('Failed to set session description: %s', err)}
	);
}

function setRemoteDescription(description){
	pc.setRemoteDescription(description).then(
		function() {console.log('setRemoteDescription complete')},
		function(err) {console.log('Failed to set session description: %s', err)}
	);
}

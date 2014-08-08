//Define local variables associated with stream and connection info
var localStream, localPeerConnection, remotePeerConnection;

//variables associated with HTML5 video elements
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

//call management variables
var startButton = document.getElementById("startButton");
var callButton = document.getElementById("callButton");
var hangupButton = document.getElementById("hangupButton");

//Just allow user to click on the start button at start-up
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;

//Associate JS handlers with click events on the buttons
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

//Utility function for logging information to the console
function log(text) {
	console.log("At time: " + (performance.now() / 1000).toFixed(3) + " --> " + text);
}

//callback to be called in case of success
function successCallback(stream) {
	log("Received local stream");
	//Note: make the returned stream available tot eh console for inspection
	window.stream = stream;
	
	//Attach returned stream to the localvideo element
	
	if (window.URL) {		
		localvideo.src = URL.createObjectURL(stream);	
	} else {
		localvideo.src = stream;
	}
	localStream = stream;
	//Now we can enable the call button
	callButton.disabled = false;
}

//Function associated with clicking on the Start button
//This is the event triggering all other actions

function start() {
	log("Requesting local stream");
	//First disable the start button
	startButton.disabled = true;
	//Get ready to deal with different browsers
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	//call getUserMedia()
	navigator.getUserMedia({audio: true, video: true}, successCallback, function(error) {
		log("navigator.getUserMedia error: ", error);
	});
	
}

//Function associated with clicking on the call button
//this is enabled upon successful completion of the start button handler
function call() {
	//First disable the call button
	callButton.disabled = true;
	//enable the hangup button
	hangupButton.disabled = false;
	log("Starting Call");
	//getVideoTracks and getAudioTracks are not supported in Firefox, just Chrome
	if (navigator.webkitGetUserMedia) {
		//log info about devices in use
		if (localStream.getVideoTracks().length > 0) {
			log('Using video device: ' + localStream.getVideoTracks()[0].label);
		}
		if (localStream.getAudioTracks().length > 0) {
			log('Using audio device: ' + localStream.getAudioTracks()[0].label);
		}
	}

	//Chrome
	if (navigator.webkitGetUserMedia) {
		RTCPeerConnection = webkitRTCPeerConnection;
		//Firefox
		
	} else if (navigator.mozGetUserMedia) {
		RTCPeerConnection = mozRTCPeerConnection;
		RTCSessionDescription = mozRTCSessionDescription;
		RTCIceCandidate = mozRTCIceCandidate;
	}
	log("RTCPeerConnection object: " + RTCPeerConnection);

	//Optional setting for NAT traversal
	var servers = null;

	//Create localPeerConnection object
	localPeerConnection = new RTCPeerConnection(servers);
	log("created local peer connection object localPeerConnection");
	//Add a handler for ICE protocol events
	localPeerConnection.onicecandidate = gotRemoteIceCandidate;
	//and a second handler to be activated as soon as the remote stream becomes available
	remotePeerConnection.onaddstream = getRemoteStream;

	//Add the local stream (as returned by getUserMedia())
	//to the local PeerConnection
	localPeerConnection.addStream(localStream);
	log("Added localStream to localPeerConnection");

	//All set! Create an offer to be sent to the callee as soon as local SDP is ready
	localPeerConnection.createOffer(gotLocalDescription, onSignalingError);
}

function onSignalingError(error) {
	console.log('Failed to create signalling message: ' + error.name);
}

//Handler to be called when local SDP becomes available
function getLocalDescription(description){
	//Add the local description to the localPeerConnection
	localPeerConnection.setLocalDescription(description);
	log("Offer from localPeerConnection : \n" + description.sdp);
	
	//do the same with remote PeerConnection
	remotePeerConnection.setRemoteDescription(description);
	
	//Create Answer to the received offer based on local description	
	remotePeerConnection.createAnswer(gotRemoteDescription, onSignalingError);
}

//Handler to be called when the remote SDP becomes available
function gotRemoteDescription(description) {
	//set the remote description as the local description of the remote PeerConnection
	remotePeerConnection.setLocalDescription(description);
	log("Answer from remotePeerConnection: \n" + description.sdp);
	//Conversely, set the remote description as the remote description of the local PeerConnection
	localPeerConnection.setRemoteDescription(description);
}

//Handler to be called when hanging up the call
function hangup() {
	log("Ending Call");
	//Close PeerConnection(s)
	localPeerConnection.close();
	remotePeerConnection.close();
	//Reset local vars
	localPeerConnection = null;
	remotePeerConnection = null;
	//Disable hangup button
	hangupButton.disabled = true;
	//enable call button
	callButton.disabled = false;
}

//handler to be called as soon as the remote stream becomes available
function gotRemoteStream(event) {
	//Associate the remote video element with the retrieved stream
	if (window.URL) {
		//Chrome
		remoteVideo.src = window.URL.createObjectURL(event.stream);
	} else {
		//Firefox
		remoteVideo.src = event.stream;
	}
	log("Received remote stream");
}

//hnadler to be called whenever a new local ICE candidate becomes available
function gotLocalIceCandidate(event){
	if (event.candidate) {
		//Add candidate to the remote peer connection
		remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		log("Local ICE candidate: \n" + event.candidate.candidate);
	}
}

//Handler to be called whenever a new remote ICE candidate becomes available
function gotRemoteIceCandidate(event) {
	if (event.candidate) {
		//Add candidate to local peer connection
		localPeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
		log("Remote ICE candidate: \n" + event.candidate.candidate);
	}
}



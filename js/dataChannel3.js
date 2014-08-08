//Define local variables associated with stream and connection info
var sendChannel, receiveChannel;

//variables associated with HTML5 video elements
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

//call management variables
var startButton = document.getElementById("startButton");
var callButton = document.getElementById("sendButton");
var hangupButton = document.getElementById("closeButton");

//Just allow user to click on the start button at start-up
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;

//Associate JS handlers with click events on the buttons
startButton.onclick = createConnection;
callButton.onclick = sendData;
hangupButton.onclick = closeDataChannels;

//Utility function for logging information to the console
function log(text) {
	console.log("At time: " + (performance.now() / 1000).toFixed(3) + " --> " + text);
}

function createConnection() {
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
	//JS variable associated with proper configuration of an RTCPeerConnection object: use DTLS/SRTP
	var pc_constraints = {
		'optional': [{
			'DtlsSrtpKeyAgreement': true
		}]
	};
	//Create localPeerConnection object
	localPeerConnection = new RTCPeerConnection(servers, pc_constraints);
	log("created local peer connection object localPeerConnection with data channel");
	try {
		//Note: SCTP-based reliable DataChannels suported in Chrome 29+ 
		//use reliable: false if earlier
		sendChannel = localPeerConnection.createDataChannel(
			"sendDataChannel", {
				reliable: true
			});
		log('Created reliable send data channel!');
	} catch (e) {
		alert('Failed to create data channel!');
		log('createDataChannel() failed with following message: ' + e.message);
	}
	//Associate handlers with peer connection ICE events
	localPeerConnection.onicecandidate = gotLocalIceCandidate;

	//Associate handles with data channel events
	sendChannel.onopen = handleSendChannelStateChange;
	sendChannel.onclose = handleSendChannelStateChange;

	//Mimic a remote peer connection
	window.remotePeerConnection = new RTCPeerConnection(servers, pc_constraints);
	log('Created remote peer connection object with DataChannel');
	//Associate handlers with peer connection ICE events
	remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
	//and data channel creation event
	remotePeerConnection.ondatachannel = gotReceiveChannel;

	//all set, let's negotiate a session
	localPeerConnection.createOffer(gotLocalDescription, onSignalingError);

	//disable start and enable close button
	startButton.disabled = true;
	closeButton.disabled = false;

}

function onSignalingError(error) {
	console.log('Failed to create signalling message: ' + error.name);
}

//handler for sending data to remote peer
function sendData() {
	var data = document.getElementById("dataChannelSend").value;
	sendChannel.send(data);
	log('Sent data: ' + data);
}

//Handler for close button
function closeDataChannels() {
	log("Closing data channels");
	sendChannel.close();
	log('CLosed data channel with label: ' + sendChannel.label);
	receiveChannel.close();
	log('CLosed data channel with label: ' + receiveChannel.label);
	//Close PeerConnection(s)
	localPeerConnection.close();
	remotePeerConnection.close();
	//Reset local vars
	localPeerConnection = null;
	remotePeerConnection = null;
	log('Closed peer connections');
	//rollback to initial page setup
	startButton.disabled = false;
	sendButton.disabled = true;
	closeButton.disabled = true;
	dataChannelSend.value = "";
	dataChannelReceive.value = "";
	dataChannelSend.disabled = "true";
	dataChannelSend.placeholder = "1: Press Start; 2: Enter Text; 3: Press Send";
}

//Handler to be called when local SDP becomes available
function gotLocalDescription(desc) {
	//Add the local description to the localPeerConnection
	localPeerConnection.setLocalDescription(desc);
	log("localPeerConnection\'s SDP : \n" + desc.sdp);

	//do the same with remote PeerConnection
	remotePeerConnection.setRemoteDescription(desc);

	//Create Answer to the received offer based on local description	
	remotePeerConnection.createAnswer(gotRemoteDescription, onSignalingError);
}

//Handler to be called when the remote SDP becomes available
function gotRemoteDescription(desc) {
	//set the remote description as the local description of the remote PeerConnection
	remotePeerConnection.setLocalDescription(desc);
	log("Answer from remotePeerConnection SDP: \n" + desc.sdp);
	//Conversely, set the remote description as the remote description of the local PeerConnection
	localPeerConnection.setRemoteDescription(desc);
}

//hnadler to be called whenever a new local ICE candidate becomes available
function gotLocalIceCandidate(event) {
	log('local ice callback');
	if (event.candidate) {
		//Add candidate to the remote peer connection
		remotePeerConnection.addIceCandidate(event.candidate);
		log("Local ICE candidate: \n" + event.candidate.candidate);
	}
}

//Handler to be called whenever a new remote ICE candidate becomes available
function gotRemoteIceCandidate(event) {
	log('remote ice callback');
	if (event.candidate) {
		//Add candidate to local peer connection
		localPeerConnection.addIceCandidate(event.candidate);
		log("Remote ICE candidate: \n" + event.candidate.candidate);
	}
}

//handler associated with management of remote peers connections data channel events
function gotReceiveChannel(event) {
	log('Receive channel callback: event --> ' + event);
	//Retrieve channel info
	receiveChannel = event.channel;

	//Set handlers for open, message, close
	receiveChannel.onopen = handleReceiveChannelStateChange;
	receiveChannel.onmessage = handleMessage;
	receiveChannel.onclose = handleReceiveChannelStateChange;
}

//message event handler
function handleMessage(event) {
	log('Received message: ' + event.data);
	//show message in html page
	document.getElementById("dataChannelReceive").value = event.data;
	//Clean 'Send' text area in html page
	document.getElementById("dataChannelSend").value = '';

}

//handler for either open or close events on senders data channel
function handleSendChannelStateChange() {
	var readyState = sendChannel.readyState;
	log('Send channel state is: ' + readyState);
	if (readyState == 'open'){
		//enable'Send' text area and set focus
		dataChannelSend.disabled = false;
		dataChannelSend.focus();
		dataChannelSend.placeholder = "";
		//Enable both send and close buttons
		sendButton.disabled = false;
		closeButton.disabled = false;
	} else { //event MUST be close if we are here
		//disable send text area
		dataChannelSend.disabled = true;
		//Dislable send and close buttons
		sendButton.disabled = true;
		closeButton.disabled = true;
	}
	

}


//handler for either 'open' or 'close' events on receiver's data channel
function handleReceiveChannelStateChange () {
	var readyState = receiveChannel.readyState;
	log('Receive channel state is: ' + readyState);
}

//Define local variables associated with video resolution selection buttons
var vgaButton = document.querySelector("button#vga");
var qvgaButton = document.querySelector("button#qvga");
var hdButton = document.querySelector("button#hd");

//video element in html page
var video = document.querySelector("video");

//local MediaStream to play with
var stream;

//Look after different browser vendors' ways of calling the getUserMedia()
//API Method
//Opera --> getUserMedia
//Chrome --> webkitGetUserMedia
//Firefox --> mozGetUserMedia

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

//use constraints to ask for video only MediaStream
var constraints = {audio: false, video: true};
var video = document.querySelector("video");

//callback to be called in case of success
function successCallback(gotStream) {
	//Note: make the returned stream available tot eh console for inspection
	window.stream = gotStream;
	
	//Attach returned stream to the <video> element
	
		//Chrome only supports constraints so no need for if statement
		
		video.src = window.URL.createObjectURL(stream);	
	
	//start playing video
	video.play();
}

//callback function to be called in case of failure
function errorCallback(error) {
	console.log("navigator.getUserMedia error: ", error);
}

//Constraints object for low res
var qvgaConstraints = {
	video: {
		mandatory: {
			maxWidth: 320,
			maxHeight: 240
		}
	}
};

//Constraints object for normal res
var vgaConstraints = {
	video: {
		mandatory: {
			maxWidth: 640,
			maxHeight: 480
		}
	}
};
//constraints object for hi res
var hdConstraints = {
	video: {
		mandatory: {
			maxWidth: 1280,
			maxHeight: 960
		}
	}
};

//Associate actions with buttons
qvgaButton.onclick = function() {getMedia(qvgaConstraints)};
vgaButton.onclick = function() {getMedia(vgaConstraints)};
hdButton.onclick = function() {getMedia(hdConstraints)};


//Simple wrapper for getUserMedia() with constraints object as an input parameter

function getMedia(constraints) {
	if (!!stream) {
		video.src = null;
		stream.stop();
	}

	navigator.getUserMedia(constraints, successCallback, errorCallback);
}

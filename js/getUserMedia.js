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
function successCallback(stream) {
	//Note: make the returned stream available tot eh console for inspection
	window.stream = stream;
	if (window.URL) {
		//Chrome case: URL.createObjectURL() converts a media stream to a blob URL
		video.src = window.URL.createObjectURL(stream);	
	} else {
		//Firefox and Opera: the src of the video can be set directly from the streamv
		video.src = stream;
	}
	//We're all set. Let's play the video out.
	video.play();
}

//callback function to be called in case of failure
function errorCallback(error) {
	console.log("navigator.getUserMedia error: ", error);
}

//Main action: just call getUserMedia() on the navigator object
navigator.getUserMedia(constraints, successCallback, errorCallback);
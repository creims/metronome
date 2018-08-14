let timerID = null;
let interval = 25;

self.onmessage = function(e) {
	if(e.data == 'start') {
		console.log('Starting...');
		timerID = setInterval(() => {
			postMessage('tick');
			}, interval);
	} else if(e.data == 'stop') {
		console.log('Stopping...');
		clearInterval(timerID);
		timerID = null;
	} else {
		console.log('Unknown message passed to worker');
	}
}
let timerID = null;
let going = false;
let interval = 25;

self.onmessage = function(e) {
	if(e.data == 'start') {
		if(going) {
			console.log('Already going.');
			return;
		}
		console.log('Starting...');
		going = true;
		timerID = setInterval(() => {
			postMessage('tick');
			}, interval);
	} else if(e.data == 'stop') {
		if(!going) {
			console.log('Already stopped.');
			return;
		}
		console.log('Stopping...');
		clearInterval(timerID);
		timerID = null;
		going = false;
	} else {
		console.log('Unknown message passed to worker');
	}
}
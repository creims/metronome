const toggleBtn = document.getElementById('toggle');
const addLineBtn = document.getElementById('addLine');
const lineDiv = document.getElementById('lineDiv');
const periodInput = document.getElementById('periodInput');
const periodDisplay = document.getElementById('periodDisplay');

const scheduleAheadTime = 0.1;

// Defaults
const defTempo = 1.0;
const defFrequency = 440;
const defNoteLength = 0.05;

let period;
let isPlaying = false;
let audioContext;
let timer;
let lines = [];
let counter = 0;

function toggle() {
    if(isPlaying) {
        toggleBtn.textContent = 'Start';
		timer.postMessage('stop');
    } else {
        toggleBtn.textContent = 'Stop';
		
		// Set timing for the first notes
		let t = audioContext.currentTime + 0.1; // 100ms lead time
		for(let l of lines) {
			l.nextNoteTime = t;
		}
		
		timer.postMessage('start');
    }
    
    isPlaying = !isPlaying;
}

function scheduleNote(line) {
	let osc = audioContext.createOscillator();
	osc.frequency.value = line.frequency;
	osc.connect(audioContext.destination);
	
	osc.start(line.nextNoteTime);
	osc.stop(line.nextNoteTime + line.noteLength);
	
	line.nextNoteTime += period / line.tempo;
}

function scheduleNotes() {
	for(let l of lines) {
		while(l.nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
			scheduleNote(l);
		}
	}
}

function addLine() {
	// This is the slider to choose the tempo
	const tempoInput = document.createElement('input');
	tempoInput.type = 'range';
	tempoInput.min = '1.0';
	tempoInput.max = '100.0';
	tempoInput.step = '1';
	tempoInput.value = defTempo;
	tempoInput.id = 'tempo' + counter;
	
	// Displays the line's tempo
	const tempoDisplay = document.createElement('span');
	tempoDisplay.id = 'tempoDisplay' + counter;
	tempoDisplay.className = 'tempoDisplay';
	tempoDisplay.innerText = tempoInput.value;
	
	// Create the input to choose the frequency
	const frequencyInput = document.createElement('input');
	frequencyInput.type = 'number';
	frequencyInput.min = '20.0';
	frequencyInput.max = '20000.0';
	frequencyInput.step = '1';
	frequencyInput.value = defFrequency;
	frequencyInput.id = 'frequency' + counter;
	
	// Displays the line's frequency
	const frequencyDisplay = document.createElement('span');
	frequencyDisplay.id = 'frequencyDisplay' + counter;
	frequencyDisplay.className = 'frequencyDisplay';
	frequencyDisplay.innerText = frequencyInput.value;
	
	// Button to remove the line
	const removeBtn = document.createElement('button');
	removeBtn.innerText = 'Remove';

	const newLineDiv = document.createElement('div');
	newLineDiv.appendChild(document.createTextNode('Tempo: '));
	newLineDiv.appendChild(tempoDisplay);
	newLineDiv.appendChild(document.createTextNode(' BPI'));
	newLineDiv.appendChild(tempoInput);
	newLineDiv.appendChild(document.createTextNode('Frequency (Hz): '));
	newLineDiv.appendChild(frequencyInput);
	newLineDiv.appendChild(removeBtn);
	
	// Add the line controls to the div
	lineDiv.appendChild(newLineDiv);
	
	let idNumber = counter;
	const newLine = {
		id: idNumber,
		tempo: tempoInput.value,
		frequency: frequencyInput.value,
		nextNoteTime: 1, // Overwritten when the timer starts
		noteLength: defNoteLength,
	};
	
	tempoInput.oninput = e => {
		newLine.tempo = tempoInput.value;
		tempoDisplay.innerText = newLine.tempo;
	};
	
	frequencyInput.oninput = e => {
		newLine.frequency = frequencyInput.value;
	};
	
	removeBtn.onclick = () => {
		newLineDiv.remove();
		removeLine(idNumber);
	};
	
	lines.push(newLine);
	counter++;
}

function removeLine(id) {
	for(let i = 0; i < lines.length; i++) {
		if(lines[i].id == id) {
			lines.splice(i, i + 1);
		}
	}
}

//Hackify so we can locally test...
var BuildWorker = function(foo){
   var str = foo.toString()
             .match(/^\s*function\s*\(\s*\)\s*\{(([\s\S](?!\}$))*[\s\S])/)[1];
   return  new Worker(window.URL.createObjectURL(
                      new Blob([str],{type:'text/javascript'})));
}

function init() {
	toggleBtn.onclick = toggle;
	addLineBtn.onclick = addLine;
	
	periodInput.oninput = e => {
		period = periodInput.value;
		periodDisplay.innerText = periodInput.value;
	};
	
	periodInput.oninput();
	
	audioContext = new AudioContext();
	
	// Hackify the worker workin'
	timer = BuildWorker(function(){
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
	});

	timer.onmessage = e => {
		if(e.data == 'tick') {
			scheduleNotes();
		} else {
			console.log('Unknown message received from timer');
		}
	};
}

init();


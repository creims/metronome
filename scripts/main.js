import {
	numToHz, 
	numToNote
} from './conversions.js';

import visualize from './visualize.js';

const toggleBtn = document.getElementById('toggle');
const addLineBtn = document.getElementById('addLine');
const lineDiv = document.getElementById('lineDiv');
const periodInput = document.getElementById('periodInput');
const periodDisplay = document.getElementById('periodDisplay');

const bgCanvas = document.getElementById('bg');
const fgCanvas = document.getElementById('fg');

// Internal constants
const scheduleAheadTime = 0.1;
const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'violet'];

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
let colorIndex = 0;

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
	
	// Select the note to play
	const noteSelect = document.createElement('select');
	noteSelect.id = 'noteSelect';
	for(let i = 0; i < 108; i++) {
		let opt = document.createElement('option');
		opt.value = i;
		opt.innerHTML = numToNote(i);
		noteSelect.appendChild(opt);
	}
	noteSelect.selectedIndex = 57; // A4 selected by default
	
	// Button to remove the line
	const removeBtn = document.createElement('button');
	removeBtn.innerText = 'Remove';

	const newLineDiv = document.createElement('div');
	newLineDiv.appendChild(document.createTextNode('Tempo: '));
	newLineDiv.appendChild(tempoDisplay);
	newLineDiv.appendChild(document.createTextNode(' BPI'));
	newLineDiv.appendChild(tempoInput);
	newLineDiv.appendChild(noteSelect);
	newLineDiv.appendChild(removeBtn);
	
	// Add the line controls to the div
	lineDiv.appendChild(newLineDiv);
	
	let idNumber = counter;
	const newLine = {
		id: idNumber,
		tempo: tempoInput.value,
		frequency: numToHz(noteSelect.value),
		nextNoteTime: 1, // Overwritten when the timer starts
		noteLength: defNoteLength,
		color: colors[colorIndex],
	};
	
	// Register event handlers
	tempoInput.oninput = () => {
		newLine.tempo = tempoInput.value;
		tempoDisplay.innerText = newLine.tempo;
		visualize.updateBG(lines);
	};
	
	noteSelect.onchange = () => {
		newLine.frequency = numToHz(noteSelect.value);
	};
	
	removeBtn.onclick = () => {
		newLineDiv.remove();
		removeLine(idNumber);
		visualize.updateBG(lines);
	};
	
	lines.push(newLine);
	visualize.updateBG(lines);
	counter++;
	colorIndex = (colorIndex + 1) % colors.length;
}

function removeLine(id) {
	for(let i = 0; i < lines.length; i++) {
		if(lines[i].id == id) {
			lines.splice(i, i + 1);
		}
	}
}

function init() {
	visualize.init(bgCanvas, fgCanvas);
	
	toggleBtn.onclick = toggle;
	addLineBtn.onclick = addLine;
	
	periodInput.oninput = e => {
		period = periodInput.value;
		periodDisplay.innerText = periodInput.value;
	};
	
	periodInput.oninput();
	
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	audioContext = new AudioContext();
	
	timer = new Worker('scripts/worker.js');

	timer.onmessage = e => {
		if(e.data == 'tick') {
			scheduleNotes();
		} else {
			console.log('Unknown message received from timer');
		}
	};
}

window.onload = init();


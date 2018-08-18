import {
	numToHz
} from './conversions.js';

import visualize from './visualize.js';
import elementBuilder from './elementbuilder.js';

// Document elements
const toggleBtn = document.getElementById('toggle');
const addLineBtn = document.getElementById('add-line');
const lineDiv = document.getElementById('lines');
const periodInput = document.getElementById('period-input');
const periodDisplay = document.getElementById('period-display');

const bgCanvas = document.getElementById('bg');
const fgCanvas = document.getElementById('fg');

// Internal constants
const scheduleAheadTime = 0.1;
const defaultNoteLength = 0.05;
const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'violet'];

// Globals
let period;
let isPlaying = false;
let audioContext;
let timer;
let lines = [];
let idCounter = 0;
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
	const newLMI = elementBuilder.createLineMenuItem();
	
	// Add the line controls to the div
	lineDiv.appendChild(newLMI.div);
	
	let idNumber = idCounter;
	const newLine = {
		id: idNumber,
		tempo: newLMI.tempoInput.value,
		frequency: numToHz(newLMI.noteSelect.value),
		nextNoteTime: 1, // Overwritten when the timer starts
		noteLength: defaultNoteLength,
		color: colors[colorIndex],
	};
	
	// Register event handlers
	newLMI.tempoInput.oninput = () => {
		newLine.tempo = newLMI.tempoInput.value;
		newLMI.tempoSpan.innerText = newLine.tempo;
		visualize.updateBG(lines);
	};
	
	newLMI.noteSelect.onchange = () => {
		newLine.frequency = numToHz(newLMI.noteSelect.value);
	};
	
	newLMI.removeBtn.onclick = () => {
		newLMI.div.remove();
		removeLine(idNumber);
		visualize.updateBG(lines);
	};
	
	idCounter++;
	lines.push(newLine);
	visualize.updateBG(lines);
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


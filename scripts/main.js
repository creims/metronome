import {
	numToHz,
	types,
	audioUrls,
} from './conversions.js';

import visualize from './visualize.js';
import MenuItem from './menuitem.js';
import AudioLoader from './audioloader.js';

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

// TEST STUFF
// TEST STUFF
const testUrl = 'https://cors-anywhere.herokuapp.com/https://actions.google.com/sounds/v1/weapons/bullet_hit_car.ogg';

// END TEST STUFF
// END TEST STUFF

// Globals
let period;
let isPlaying = false;
let audioContext;
let timer;
let lines = [];
let idCounter = 0;
let colorIndex = 0;
let periodTime; // The time the last period started
let audioBuffers;

function toggle() {
    if(isPlaying) {
        toggleBtn.textContent = 'Start';
		timer.postMessage('stop');
    } else {
        toggleBtn.textContent = 'Stop';
		
		// Set timing for the first notes
		periodTime = audioContext.currentTime + 0.1; // 100ms lead time
		for(let l of lines) {
			l.nextNoteTime = periodTime;
		}
		
		timer.postMessage('start');
    }
    
    isPlaying = !isPlaying;
}

function scheduleNote(line) {
	let node;
	if(line.typeIndex == 0) {
		node = audioContext.createOscillator();
		node.frequency.value = line.frequency;
	} else {
		node = audioContext.createBufferSource();
		node.buffer = audioBuffers[line.noteIndex];
	}
	
	node.connect(audioContext.destination);
	
	node.start(line.nextNoteTime);
	node.stop(line.nextNoteTime + line.noteLength);
	
	line.nextNoteTime += period / line.tempo;
}

function scheduleNotes() {
	for(let l of lines) {
		while(l.nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
			scheduleNote(l);
		}
	}
}

function addLine(type) {
	const newMI = new MenuItem(lineDiv);
	
	let idNumber = idCounter;
	const newLine = {
		id: idNumber,
		tempo: newMI.getTempo(),
		frequency: 440.0, // Only used for oscillators
		typeIndex: newMI.getTypeIndex(),
		noteIndex: newMI.getNoteIndex(),
		nextNoteTime: periodTime,
		noteLength: defaultNoteLength,
		color: colors[colorIndex],
	};
	
	// Register event handlers
	newMI.setHandler('tempoChange', () => {
			newLine.tempo = newMI.getTempo();
			newMI.setTempoText(newLine.tempo);
			visualize.updateBG(lines);
		});
		
	newMI.setHandler('typeChange', () => {
		newMI.updateType();
		let newTypeIndex = newMI.getTypeIndex();
		if(newTypeIndex == 0) {
			newLine.noteLength = defaultNoteLength;
		} else {
			newLine.noteLength = 1.0;
		}
		newLine.typeIndex = newTypeIndex;
		newLine.noteIndex = newMI.getNoteIndex();
	});
	
	newMI.setHandler('noteChange', () => {
		newLine.noteIndex = newMI.getNoteIndex();
		newLine.frequency = numToHz(newLine.noteIndex);
	});
	
	newMI.setHandler('remove', () => {
		newMI.remove();
		removeLine(idNumber);
		visualize.updateBG(lines);
	});
	
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

function testSound(buffer) {
	var source = audioContext.createBufferSource();
	source.buffer = buffer;
	source.connect(audioContext.destination);
	source.start(0);  
}

function init() {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	audioContext = new AudioContext();
	
	let loader = new AudioLoader(audioContext, audioUrls, buffers => {
		audioBuffers = buffers;
	});
	loader.loadAll();
	
	visualize.init(bgCanvas, fgCanvas);
	
	toggleBtn.onclick = toggle;
	addLineBtn.onclick = addLine;
	
	periodInput.oninput = e => {
		period = periodInput.value;
		periodDisplay.innerText = periodInput.value;
	};
	
	periodInput.oninput();
	
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


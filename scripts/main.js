import soundMgr from './sounds.js';
import Visualizer from './visualizer.js';
import MenuItem from './menuitem.js';

// Document elements
const intervalToggleBtn = document.getElementById('toggle-intervalic');
const bpmToggleBtn = document.getElementById('toggle-bpm');
const addLineBtn = document.getElementById('add-line');
const lineDiv = document.getElementById('lines');
const periodInput = document.getElementById('period-input');
const periodDisplay = document.getElementById('period-display');
const bpmInput = document.getElementById('bpm-input');
const bpmDisplay = document.getElementById('bpm-display');

const canvasIntervalic = document.getElementById('intervalic');
const canvasIntervalicAnim = document.getElementById('intervalic-anim');
const canvasBPM = document.getElementById('bpm');
const canvasBPMAnim = document.getElementById('bpm-anim');

// Internal constants
const scheduleAheadTime = 0.1;
const defaultNoteLength = 0.05;
const defaultBPM = 0.5; // 120bpm
const leadTime = 0.15; // Time before playing notes after starting metronome
const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'violet'];
const beepType = 'Beeps'; // For readability

// Animation timing
const leadupFrac = 0.20;
const cooldownFrac = 1 - leadupFrac;
const animMult = 1 / leadupFrac;
const logthree = Math.log10(3);

// Globals
let period;
let intervalPlaying = false;
let bpmPlaying = false;
let audioContext;
let timer;
let lines = [];
let idCounter = 0;
let colorIndex = 0;
let periodStart; // The time the last period started
let intervalicVisualizer, bpmVisualizer;
let bpmLine;

function scheduleNote(line) {
	let node;
	if(line.type == beepType) {
		node = audioContext.createOscillator();
		node.frequency.value = line.frequency;
	} else {
		node = audioContext.createBufferSource();
		node.buffer = line.soundBuffer;
	}
	
	node.connect(audioContext.destination);
	
	node.start(line.nextNoteTime);
	node.stop(line.nextNoteTime + line.noteLength);
	
	line.nextNoteTime += line.delay;
}

function scheduleNotes() {
	if(bpmPlaying) {
		while(bpmLine.nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
			scheduleNote(bpmLine);
		}
	}
	
	if(intervalPlaying) {
		for(let l of lines) {
			if(l.muted) {
				continue;
			}
			while(l.nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
				scheduleNote(l);
			}
		}
	}
}

function resync(...lines) {
	// If this is a fresh rhythm, set periodStart to be when the first beat falls
	// but schedule the first note at currentTime + leadTime
	if(!isPlaying()) {
		// Find the minimum offset
		let minNoteOffset = 0;
		for(let l of lines) {
			if(l.noteOffset < minNoteOffset) {
				minNoteOffset = l.noteOffset;
			}
		}
		periodStart = audioContext.currentTime + leadTime - minNoteOffset;
		
		// Schedule notes
		for(let l of lines) {
			l.nextNoteTime = periodStart + l.noteOffset;
		}
	} else { // If a rhythm is in progress, schedule notes when they'd next play
		let missedNotes; // The number of notes missed since the line last played
		for(let l of lines) {
			missedNotes = (audioContext.currentTime + leadTime - periodStart + l.noteOffset) / l.delay;
			l.nextNoteTime = periodStart + l.noteOffset + Math.ceil(missedNotes) * l.delay;
			
			// Prevent the sound from playing in the past due to noteOffset
			if(l.nextNoteTime < audioContext.currentTime) {
				l.nextNoteTime += l.delay;
			}
		}
	}
}

function addLine(type) {
	const newMI = new MenuItem(lineDiv);
	
	let idNumber = idCounter;
	const newLine = {
		id: idNumber,
		bpi: 1.0,
		delay: 1.0,
		noteOffset: 0,
		type: newMI.getType(),
		nextNoteTime: periodStart,
		noteLength: defaultNoteLength,
		color: colors[colorIndex],
		frequency: soundMgr.frequencyOf(newMI.getNoteIndex()),
		soundBuffer: null,
		muted: false,
	};
	
	// Register event handlers
	newMI.setHandler('bpiChange', () => {
			newLine.bpi = newMI.getBPI();
			newLine.delay = period / newLine.bpi;
			newMI.setBPIText(newLine.bpi);
			intervalicVisualizer.updateBG(lines);
			resync(newLine);
		});
		
	newMI.setHandler('typeChange', () => {
		newMI.updateType();
		
		const newType = newMI.getType();
		const noteIndex = newMI.getNoteIndex();
		if(newType == beepType) {
			newLine.noteLength = defaultNoteLength;
			newLine.noteOffset = 0;
			newLine.frequency = soundMgr.frequencyOf(noteIndex);
		} else {
			newLine.soundBuffer = soundMgr.getSound(newType, noteIndex);
			newLine.noteLength = newLine.soundBuffer.duration;
			newLine.noteOffset = soundMgr.getOffset(newType, noteIndex);
		}
		
		newLine.type = newType;
		resync(newLine);
	});
	
	newMI.setHandler('noteChange', () => {
		const newIndex = newMI.getNoteIndex();
		if(newLine.type == beepType) {
			newLine.frequency = soundMgr.frequencyOf(newIndex);
		} else {
			newLine.soundBuffer = soundMgr.getSound(newLine.type, newIndex);
			newLine.noteLength = newLine.soundBuffer.duration;
			newLine.noteOffset = soundMgr.getOffset(newLine.type, newIndex);
		}
		resync(newLine);
	});
	
	newMI.setHandler('mute', () => {
		newLine.muted = !newLine.muted;
		if(newLine.muted) {
			newMI.mute();
		} else{
			newMI.unmute();
		}
		intervalicVisualizer.updateBG(lines);
		resync(newLine);
	});
	
	newMI.setHandler('remove', () => {
		newMI.remove();
		removeLine(idNumber);
		intervalicVisualizer.updateBG(lines);
	});
	
	idCounter++;
	lines.push(newLine);
	intervalicVisualizer.updateBG(lines);
	colorIndex = (colorIndex + 1) % colors.length;
}

function removeLine(id) {
	for(let i = 0; i < lines.length; i++) {
		if(lines[i].id == id) {
			lines.splice(i, i + 1);
		}
	}
}

function isPlaying() {
	return bpmPlaying || intervalPlaying;
}

function animate() {
	let nextImpact = (bpmLine.nextNoteTime - bpmLine.noteOffset) - audioContext.currentTime;
	if(nextImpact > 0) { // Only play if the next note is scheduled
		let pctToNext = nextImpact / bpmLine.delay;
		
		// Pulse up approaching the sound
		if(pctToNext < leadupFrac  && bpmPlaying) {
			bpmVisualizer.pulse(1 - (pctToNext * animMult));
		} // Pulse down after the sound
		else if(pctToNext > cooldownFrac) {
			let pct = Math.min(1, (pctToNext - cooldownFrac) * animMult);
			bpmVisualizer.pulse(pct);
		} else {
			bpmVisualizer.clear();
		}
	}

	requestAnimationFrame(animate);
}

function init() {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	audioContext = new AudioContext();
	
	bpmLine = {
		delay: defaultBPM,
		type: 'Percussion',
		nextNoteTime: periodStart,
		noteLength: 1.0,
		noteOffset: 0,
		soundBuffer: null,
		muted: false,
	};
	
	soundMgr.init(audioContext, () => {
		bpmLine.soundBuffer = soundMgr.getSound('Percussion', 0);
		bpmLine.noteOffset = soundMgr.getOffset('Percussion', 0);
		bpmLine.noteLength = bpmLine.soundBuffer.duration;
	});
	
	intervalicVisualizer = new Visualizer(canvasIntervalic, canvasIntervalicAnim);
	bpmVisualizer = new Visualizer(canvasBPM, canvasBPMAnim);
	
	intervalToggleBtn.onclick = function() {
		if(intervalPlaying) {
			intervalToggleBtn.textContent = 'Start';
			if(!bpmPlaying) {
				timer.postMessage('stop');
			}
		} else {
			intervalToggleBtn.textContent = 'Stop';
			
			// Set timing for the first notes
			resync(...lines);
			
			timer.postMessage('start');
		}
		
		intervalPlaying = !intervalPlaying;
	};
	
	bpmToggleBtn.onclick = function() {
		if(bpmPlaying) {
			bpmToggleBtn.textContent = 'Start';
			if(!intervalPlaying) {
				timer.postMessage('stop');
			}
		} else {
			bpmToggleBtn.textContent = 'Stop';
			
			resync(bpmLine);
			
			timer.postMessage('start');
		}
		
		bpmPlaying = !bpmPlaying;
	}
	
	addLineBtn.onclick = addLine;
	
	periodInput.oninput = e => {
		period = periodInput.value;
		periodDisplay.innerText = period;
		for(let l of lines) {
			l.delay = period / l.bpi;
		}
	};
	
	bpmInput.oninput = e => {
		bpmLine.delay = 60.0 / bpmInput.value;
		bpmDisplay.innerText = bpmInput.value;
	};
	
	bpmInput.oninput();
	periodInput.oninput();
	
	timer = new Worker('scripts/worker.js');

	timer.onmessage = e => {
		if(e.data == 'tick') {
			scheduleNotes();
		} else {
			console.log('Unknown message received from timer');
		}
	};
	
	requestAnimationFrame(animate);
}

window.onload = init();


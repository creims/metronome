import soundMgr from './sounds.js';
import Visualizer from './visualizer.js';
import MenuItem from './menuitem.js';
import Line from './line.js';

// Document elements
const intervalToggleBtn = document.getElementById('toggle-intervalic');
const bpmToggleBtn = document.getElementById('toggle-bpm');
const addLineBtn = document.getElementById('add-line');
const lineDiv = document.getElementById('lines');
const volumeInput = document.getElementById('volume-input');
const periodInput = document.getElementById('period-input');
const periodSet = document.getElementById('set-period');
const periodDisplay = document.getElementById('period-display');
const bpmInput = document.getElementById('bpm-input');
const bpmDisplay = document.getElementById('bpm-display');

const canvasIntervalic = document.getElementById('intervalic');
const canvasIntervalicAnim = document.getElementById('intervalic-anim');
const canvasBPM = document.getElementById('bpm');
const canvasBPMAnim = document.getElementById('bpm-anim');

// Internal constants
const scheduleAheadTime = 0.1;
const leadTime = 0.15; // Time before playing notes after starting metronome
const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'violet'];
const maxPeriod = 10000; // 10 seconds
const minPeriod = 500; // 0.5 second
const defaultPeriod = 1000;
const defaultVolume = 100;

// Animation timing
const leadupFrac = 0.25;
const animMult = 1 / leadupFrac;

// Globals
let period = defaultPeriod / 1000; // Length of our rhythm in seconds
let globalVolume = defaultVolume / 100;
let periodStart; // The time the last period started, used to synchronize
let intervalPlaying = false;
let bpmPlaying = false;
let bpmAnimTime;
let lines = [];
let intervalicVisualizer, bpmVisualizer;
let bpmLine;
let audioContext;
let timer;
let colorIndex = 0;

// Schedule a single note
function scheduleNote(line) {
	let node;
	if(line.type == 'Beeps') {
		node = audioContext.createOscillator();
		node.frequency.value = line.frequency;
	} else {
		node = audioContext.createBufferSource();
		node.buffer = line.soundBuffer;
	}
	
	let gainNode = audioContext.createGain();
	gainNode.gain.value = globalVolume;
	
	node.connect(gainNode);
	gainNode.connect(audioContext.destination);
	
	node.start(line.nextNoteTime);
	node.stop(line.nextNoteTime + line.noteLength);
	
	line.nextNoteTime += line.delay;
}

// Schedule all notes for both BPM and intervalic metronomes
function scheduleNotes() {
	if(bpmPlaying) {
		while(bpmLine.nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
			bpmAnimTime = bpmLine.nextNoteTime;
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

// Ensure that notes play at the proper time
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

// Add a new rhythm to our polyrhythm
function addLine(type) {
	const newMI = new MenuItem(lineDiv);
	const newBPI = newMI.getBPI();
	const l = new Line({
		bpi: newBPI,
		delay: period / newBPI,
		color: colors[colorIndex],
		nextNoteTime: periodStart,
	});
	colorIndex = (colorIndex + 1) % colors.length;
	
	// Register event handlers
	newMI.setHandler('bpiChange', () => {
			l.bpi = newMI.getBPI();
			l.delay = period / l.bpi;
			
			newMI.setBPIText(l.bpi);
			
			intervalicVisualizer.updateBG(lines);
			resync(l);
		});
		
	newMI.setHandler('typeChange', () => {
		newMI.updateType();
		l.setSound(newMI.getType(), newMI.getNoteIndex());

		resync(l);
	});
	
	newMI.setHandler('noteChange', () => {
		l.setSound(l.type, newMI.getNoteIndex());
		
		resync(l);
	});
	
	newMI.setHandler('mute', () => {
		l.muted = !l.muted;
		if(l.muted) {
			newMI.mute();
		} else{
			newMI.unmute();
		}
		intervalicVisualizer.updateBG(lines);
		resync(l);
	});
	
	newMI.setHandler('remove', () => {
		newMI.remove();
		removeLine(l.id);
		intervalicVisualizer.updateBG(lines);
	});
	
	lines.push(l);
	intervalicVisualizer.updateBG(lines);
}

// Remove a rhythm from our polyrhythm
function removeLine(id) {
	for(let i = 0; i < lines.length; i++) {
		if(lines[i].id == id) {
			lines.splice(i, i + 1);
		}
	}
}

// Is either metronome playing?
function isPlaying() {
	return bpmPlaying || intervalPlaying;
}

// Main animation loop
function animate() {
	// Animate BPM metronome
	let nextImpact = (bpmAnimTime - bpmLine.noteOffset) - audioContext.currentTime;
	let pctToNext = Math.abs(nextImpact) / bpmLine.delay;
	if(pctToNext < leadupFrac) { // Only play if the BPM line's next note is scheduled
		// Pulse up approaching the sound
		if(nextImpact > 0) {
			bpmVisualizer.animate(1 - (pctToNext * animMult));
		} // Pulse red during the sound
		else {
			bpmVisualizer.animate(1, true);
		}
	}  else {
		bpmVisualizer.clearFG();
	}
	
	if(intervalPlaying) {
		let pct = ((audioContext.currentTime - periodStart) % period) / period;
		intervalicVisualizer.animate(pct);
	}

	requestAnimationFrame(animate);
}

// Adjust the intervalic metronome's period length
function updatePeriod(newPeriod) {
	period = newPeriod / 1000;
	periodDisplay.innerText = formatInt(newPeriod);
	
	periodInput.value = newPeriod;
	periodSet.value = newPeriod;
	
	for(let l of lines) {
		l.delay = period / l.bpi;
	}
	
	resync(...lines);
}

// Adds commas to an integer for readability
function formatInt(num) {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function init() {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	audioContext = new AudioContext();
	
	// Load our sounds and set the BPM metronome's sound when done
	bpmLine = new Line();
	soundMgr.init(audioContext, () => {
		bpmLine.setSound('Percussion', 0);
	});
	
	// Set up visualizations
	intervalicVisualizer = new Visualizer(canvasIntervalic, canvasIntervalicAnim);
	intervalicVisualizer.setAnimation('radar');
	
	bpmVisualizer = new Visualizer(canvasBPM, canvasBPMAnim);
	bpmVisualizer.setAnimation('pulse');
	
	// Event handlers
	intervalToggleBtn.onclick = function() {
		if(intervalPlaying) {
			intervalToggleBtn.textContent = 'Start';
			if(!bpmPlaying) {
				timer.postMessage('stop');
			}
		} else {
			intervalToggleBtn.textContent = 'Stop';
			resync(...lines); // Set timing for the first notes
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
	
	volumeInput.oninput = e => {
		globalVolume = parseFloat(volumeInput.value) / 100;
	};
	
	periodInput.oninput = e => {
		updatePeriod(periodInput.value);
		periodSet.value = periodInput.value;
	};
	
	periodSet.onchange = e => {
		let ms = Number.parseInt(periodSet.value);
		if(isNaN(ms)) { // If invalid, revert to period length
			periodSet.value = periodInput.value;
			return;
		}
		
		if(ms > maxPeriod) {
			ms = maxPeriod;
		} else if (ms < minPeriod) {
			ms = minPeriod;
		}
		
		updatePeriod(ms);
		periodSet.blur(); // Unfocus the input 
	};
	
	bpmInput.oninput = e => {
		bpmLine.delay = 60.0 / bpmInput.value;
		bpmDisplay.innerText = bpmInput.value;
		
		resync(bpmLine);
	};
	
	volumeInput.oninput();
	bpmInput.oninput();
	updatePeriod(defaultPeriod); // Initialize period displays to default
	
	timer = new Worker('scripts/worker.js');

	timer.onmessage = e => {
		if(e.data == 'tick') {
			scheduleNotes();
		} else {
			console.log('Unknown message received from timer');
		}
	};
	
	requestAnimationFrame(animate); // Start the animation loop
}

window.onload = init();


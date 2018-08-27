import soundMgr from './sounds.js';

// Defaults
const defaultNoteLength = 0.05;
const defaultBPI = 1.0;

const idGen = (function*() {
	let counter = 0;
	while(true) {
		yield counter;
		counter++;
	}
})();

function Line(opts = {}) {
	this.id = idGen.next().value;
	this.bpi = opts.bpi || defaultBPI;
	this.delay = opts.delay || 1.0;
	this.noteOffset = opts.noteOffset || 0;
	this.type = opts.type || 'Beeps';
	this.nextNoteTime = opts.nextNoteTime || 0.0;
	this.noteLength = opts.noteLength || defaultNoteLength;
	this.color = opts.color || 'red';
	this.frequency = opts.frequency || 440.0;
	this.soundBuffer = opts.soundBuffer || null;
	this.muted = opts.muted || false;
}

Line.prototype.setSound = function(type, index = 0) {
	this.type = type;
	if(type == 'Beeps') {
		this.noteOffset = 0;
		this.noteLength = defaultNoteLength;
		this.frequency = soundMgr.frequencyOf(index);
	} else{
		this.soundBuffer = soundMgr.getSound(type, index);
		this.noteOffset = soundMgr.getOffset(type, index);
		this.noteLength = this.soundBuffer.duration;
	}
}
export default Line;
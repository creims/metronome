import AudioLoader from './audioloader.js';

const sharp = '&#9839;' // &#9839; is the sharp symbol
const flat = '&#9837;' // &#9837; is a flat symbol
const soundMgr = {};

// Precalculated from C0 at 16.35 Hz
// Formula: note = C0 * (2^(1/12))^n
const frequencies = [
	16.35,
	17.3222215928,
	18.3522544899,
	19.4435363303,
	20.5997091658,
	21.8246316157,
	23.1223917448,
	24.4973207069,
	25.9540071997,
	27.4973127788,
	29.1323880832,
	30.8646900247,
	32.7,
	34.6444431855,
	36.7045089797,
	38.8870726606,
	41.1994183316,
	43.6492632314,
	46.2447834896,
	48.9946414139,
	51.9080143994,
	54.9946255576,
	58.2647761664,
	61.7293800494,
	65.4,
	69.2888863711,
	73.4090179594,
	77.7741453212,
	82.3988366631,
	87.2985264627,
	92.4895669792,
	97.9892828277,
	103.816028799,
	109.989251115,
	116.529552333,
	123.458760099,
	130.8,
	138.577772742,
	146.818035919,
	155.548290642,
	164.797673326,
	174.597052925,
	184.979133958,
	195.978565655,
	207.632057597,
	219.97850223,
	233.059104666,
	246.917520198,
	261.6,
	277.155545484,
	293.636071838,
	311.096581285,
	329.595346652,
	349.194105851,
	369.958267917,
	391.957131311,
	415.264115195,
	439.957004461,
	466.118209331,
	493.835040395,
	523.2,
	554.311090969,
	587.272143675,
	622.193162569,
	659.190693305,
	698.388211702,
	739.916535834,
	783.914262622,
	830.52823039,
	879.914008921,
	932.236418662,
	987.67008079,
	1046.4,
	1108.62218194,
	1174.54428735,
	1244.38632514,
	1318.38138661,
	1396.7764234,
	1479.83307167,
	1567.82852524,
	1661.05646078,
	1759.82801784,
	1864.47283732,
	1975.34016158,
	2092.8,
	2217.24436388,
	2349.0885747,
	2488.77265028,
	2636.76277322,
	2793.55284681,
	2959.66614333,
	3135.65705049,
	3322.11292156,
	3519.65603569,
	3728.94567465,
	3950.68032316,
	4185.6,
	4434.48872775,
	4698.1771494,
	4977.54530056,
	5273.52554644,
	5587.10569361,
	5919.33228667,
	6271.31410098,
	6644.22584312,
	7039.31207137,
	7457.8913493,
	7901.36064632
];

// 12 notes per octave, 8 octaves
function numToNote(n) {
	let octave = Math.trunc(n / 12);
	switch(n % 12) {
		case 0:
			return 'C' + octave;
			break;
		case 1:
			return 'C' + sharp + octave + '/D' + flat + octave;
			break;
		case 2:
			return 'D' + octave;
			break;
		case 3:
			return 'D' + sharp + octave + '/E' + flat + octave;
			break;
		case 4:
			return 'E' + octave;
			break;
		case 5:
			return 'F' + octave;
			break;
		case 6:
			return 'F' + sharp + octave + '/G' + flat + octave;
			break;
		case 7:
			return 'G' + octave;
			break;
		case 8:
			return 'G' + sharp + octave + '/A' + flat + octave;
			break;
		case 9:
			return 'A' + octave;
			break;
		case 10:
			return 'A' + sharp + octave + '/B' + flat + octave;
			break;
		case 11:
			return 'B' + octave;
			break;
	}
}

let beepNoteNames = [];
for(let i = 0; i < frequencies.length; i++) {
	beepNoteNames.push(numToNote(i));
}

const percussion = [
	{ name: 'Hi-Hat', url: './sounds/hihat.normal.m4a' },
	{ name: 'Bell', url: './sounds/hihat.bell.m4a' },
	{ name: 'Footclose', url: './sounds/hihat.footclose.m4a' },
	{ name: 'Footsplash', url: './sounds/hihat.footsplash.m4a' },
	{ name: 'Shoulder', url: './sounds/hihat.shoulder.m4a' },
];

const sounds = {
	'Beeps': {
		defaultIndex: 57,
		noteNames: beepNoteNames,
	},
	'Percussion': {
		defaultIndex: 0,
		noteNames: percussion.map(e => e.name),
		urls: percussion.map(e => e.url)
	},
};

const soundTypes = Object.keys(sounds);
soundMgr.getTypes = function() {
	return soundTypes;
}

soundMgr.getNotes = function(type) {
	return sounds[type].noteNames;
}

soundMgr.getSound = function(type, index) {
	return sounds[type].buffers[index];
}

soundMgr.frequencyOf = function(index) {
	return frequencies[index];
}

soundMgr.defaultIndex = function(type) {
	return sounds[type].defaultIndex;
}

soundMgr.init = function(audioContext) {
	const audioLoader = new AudioLoader(audioContext);
	audioLoader.load(sounds['Percussion'].urls, bufs => {
		sounds['Percussion'].buffers = bufs;
	});
}

export default soundMgr;
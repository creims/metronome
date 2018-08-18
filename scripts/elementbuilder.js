import { 
	numToNote
} from './conversions.js';
// Defaults
const defaultTempo = 1.0;
const defaultTempoIndex = 57; // A4 


const elementBuilder = {};

elementBuilder.createLineMenuItem = function() {
	// This is the slider to choose the tempo
	const tempoInput = document.createElement('input');
	tempoInput.className = 'tempo-range';
	tempoInput.type = 'range';
	tempoInput.min = '1.0';
	tempoInput.max = '100.0';
	tempoInput.step = '1';
	tempoInput.value = defaultTempo;
	
	// Display the line's tempo
	const tempoSpan = document.createElement('span');
	tempoSpan.innerText = defaultTempo;
	
	const tempoDisplay = document.createElement('div');
	tempoDisplay.appendChild(document.createTextNode('Tempo: '));
	tempoDisplay.appendChild(tempoSpan);
	tempoDisplay.appendChild(document.createTextNode(' BPI'));
	
	// Select for the note to play'
	const noteSelect = document.createElement('select');
	for(let i = 0; i < 108; i++) {
		let opt = document.createElement('option');
		opt.value = i;
		opt.innerHTML = numToNote(i);
		noteSelect.appendChild(opt);
	}
	noteSelect.className = 'note-select';
	noteSelect.selectedIndex = 57; // A4 selected by default
	
	// Use an outer div so we can style the select
	const selectDiv = document.createElement('div');
	selectDiv.className = 'select-div';
	selectDiv.appendChild(noteSelect);
	
	// Button to remove the line
	const removeBtn = document.createElement('button');
	removeBtn.className = 'remove-btn';
	removeBtn.innerText = 'Remove';
	
	const div = document.createElement('div');
	div.className = 'line-menu-item';
	div.appendChild(tempoDisplay);
	div.appendChild(tempoInput);
	div.appendChild(selectDiv);
	div.appendChild(removeBtn);

	return {
		tempoInput: tempoInput,
		tempoSpan: tempoSpan,
		removeBtn: removeBtn,
		noteSelect: noteSelect,
		div: div
	};
}

export default elementBuilder;
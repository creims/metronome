import soundMgr from './sounds.js';

// Helper functions
function createSelect(options, defaultIndex) {
	const selectElement = document.createElement('select');
	selectElement.className = 'note-select';
	
	setSelectOptions(selectElement, options);
	selectElement.selectedIndex = defaultIndex;
	
	return selectElement;
}

function setSelectOptions(selectElement, options) {
	selectElement.innerHTML = "";
	for(let o of options) {
		let opt = document.createElement('option');
		opt.innerHTML = o;
		selectElement.appendChild(opt);
	}
}

// Constructor
function MenuItem(parentElement) {
	const tempoInput = document.createElement('input'); // Slider to choose the tempo
	tempoInput.className = 'tempo-range';
	tempoInput.type = 'range';
	tempoInput.min = '1.0';
	tempoInput.max = '100.0';
	tempoInput.step = '1';
	tempoInput.value = '1';	
	
	// Display the line's tempo
	const tempoSpan = document.createElement('span');
	tempoSpan.innerText = tempoInput.value;
	
	const tempoDisplay = document.createElement('div');
	tempoDisplay.appendChild(document.createTextNode('Tempo: '));
	tempoDisplay.appendChild(tempoSpan);
	tempoDisplay.appendChild(document.createTextNode(' BPI'));
	
	// Select for the type of line (frequency, hi hat, piano, etc)
	const typeSelect = createSelect(soundMgr.getTypes(), 0);
	
	// Use an outer div so we can style the select
	const typeSelectDiv = document.createElement('div');
	typeSelectDiv.className = 'select-div';
	typeSelectDiv.appendChild(typeSelect);
	
	// Select for the note to play
	const noteSelect = createSelect(soundMgr.getNotes('Beeps'), soundMgr.defaultIndex('Beeps'));
	
	// Use an outer div so we can style the select
	const noteSelectDiv = document.createElement('div');
	noteSelectDiv.className = 'select-div';
	noteSelectDiv.appendChild(noteSelect);
	
	// Button to remove the line
	const removeBtn = document.createElement('button');
	removeBtn.className = 'remove-btn';
	removeBtn.innerText = 'Remove';
	
	const div = document.createElement('div');
	div.className = 'line-menu-item';
	div.appendChild(tempoDisplay);
	div.appendChild(tempoInput);
	div.appendChild(typeSelectDiv);
	div.appendChild(noteSelectDiv);
	div.appendChild(removeBtn);

	this.tempoInput = tempoInput;
	this.tempoSpan = tempoSpan;
	this.removeBtn = removeBtn;
	this.typeSelect = typeSelect;
	this.noteSelect = noteSelect;
	this.div = div;
	this.parentElement = parentElement;
	
	parentElement.appendChild(div);
}

// Methods
MenuItem.prototype.setHandler = function(type, handler) {
	switch(type) {
		case 'tempoChange': 
			this.tempoInput.oninput = handler;
			break;
		case 'typeChange': 
			this.typeSelect.onchange = handler;
			break;
		case 'noteChange': 
			this.noteSelect.onchange = handler;
			break;
		case 'remove': 
			this.removeBtn.onclick = handler;
			break;
		default:
			console.log('MenuItem.setHandler: Invalid handler type: ' + type);
			console.log(evtHandler);
	};
}

MenuItem.prototype.remove = function() {
	this.div.remove();
}

MenuItem.prototype.getTempo = function() {
	return this.tempoInput.value;
}

MenuItem.prototype.getType = function() {
	return this.typeSelect.value;
}

MenuItem.prototype.getNoteIndex = function() {
	return this.noteSelect.selectedIndex;
}

MenuItem.prototype.updateType = function() {
	const soundType = this.typeSelect.value;
	setSelectOptions(this.noteSelect, soundMgr.getNotes(soundType));
	this.noteSelect.selectedIndex = soundMgr.defaultIndex(soundType);
}

MenuItem.prototype.setTempoText = function(newText) {
	this.tempoSpan.innerText = newText;
}

export default MenuItem;
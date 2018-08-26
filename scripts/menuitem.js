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
	const bpiInput = document.createElement('input'); // Slider to choose the bpi
	bpiInput.className = 'bpi-range';
	bpiInput.type = 'range';
	bpiInput.min = '1.0';
	bpiInput.max = '100.0';
	bpiInput.step = '1';
	bpiInput.value = '1';	
	
	// Display the line's bpi
	const bpiSpan = document.createElement('span');
	bpiSpan.innerText = bpiInput.value;
	
	const bpiDisplay = document.createElement('div');
	bpiDisplay.appendChild(document.createTextNode('BPI: '));
	bpiDisplay.appendChild(bpiSpan);
	
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
	
	// Button to mute the line
	const muteBtn = document.createElement('button');
	muteBtn.className = 'mute-btn';
	muteBtn.innerText = 'Mute';
	
	// Button to remove the line
	const removeBtn = document.createElement('button');
	removeBtn.className = 'remove-btn';
	removeBtn.innerText = 'Remove';
	
	const div = document.createElement('div');
	div.className = 'line-menu-item';
	div.appendChild(bpiDisplay);
	div.appendChild(bpiInput);
	div.appendChild(typeSelectDiv);
	div.appendChild(noteSelectDiv);
	div.appendChild(muteBtn);
	div.appendChild(removeBtn);

	this.bpiInput = bpiInput;
	this.bpiSpan = bpiSpan;
	this.removeBtn = removeBtn;
	this.muteBtn = muteBtn;
	this.typeSelect = typeSelect;
	this.noteSelect = noteSelect;
	this.div = div;
	this.parentElement = parentElement;
	
	parentElement.appendChild(div);
}

// Methods
MenuItem.prototype.setHandler = function(type, handler) {
	switch(type) {
		case 'bpiChange': 
			this.bpiInput.oninput = handler;
			break;
		case 'typeChange': 
			this.typeSelect.onchange = handler;
			break;
		case 'noteChange': 
			this.noteSelect.onchange = handler;
			break;
		case 'mute':
			this.muteBtn.onclick = handler;
			break;
		case 'remove': 
			this.removeBtn.onclick = handler;
			break;
		default:
			console.log('MenuItem.setHandler: Invalid handler type: ' + type);
			console.log(evtHandler);
	};
}

MenuItem.prototype.mute = function() {
	this.muteBtn.innerText = 'Unmute';
}

MenuItem.prototype.unmute = function() {
	this.muteBtn.innerText = 'Mute';
}

MenuItem.prototype.remove = function() {
	this.div.remove();
}

MenuItem.prototype.getBPI = function() {
	return this.bpiInput.value;
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

MenuItem.prototype.setBPIText = function(newText) {
	this.bpiSpan.innerText = newText;
}

export default MenuItem;
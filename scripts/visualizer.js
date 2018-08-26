const circleColor = '#808080';
const offset = 10;
const twopi = Math.PI * 2;
const logthree = Math.log10(3);
const center = 250;
const radius = center - offset;

// Helper functions
// Draws an n-pointed star inside the circle
function drawStar(ctx, numPts, color) {
	let stepSize = twopi / (numPts * 2);
	ctx.fillStyle = makeGradient(ctx, 'transparent', color);

	let currAngle = 3 * Math.PI / 2;
	let innerR = radius / (1 + (Math.log(numPts) / Math.log(3.5)));
	let xCoord, yCoord;
	
	ctx.beginPath();
	for(let i = 0; i < numPts; i++) {
		currAngle += stepSize;
		xCoord = innerR * Math.cos(currAngle) + center;
		yCoord = innerR * Math.sin(currAngle) + center;
		ctx.lineTo(xCoord, yCoord);
		
		currAngle += stepSize;
		xCoord = radius * Math.cos(currAngle) + center;
		yCoord = radius * Math.sin(currAngle) + center;
		ctx.lineTo(xCoord, yCoord);
	}
	ctx.closePath();
	ctx.fill();
}

// Draws a single arrow
function drawArrow(ctx, color) {
	ctx.fillStyle = makeGradient(ctx, 'transparent', '#3344AA', color);
	let xCoord, yCoord;
	let innerR = radius * 0.8;
	let angle;
	
	ctx.beginPath();
	angle = Math.PI * 5 / 3;
	xCoord = innerR * Math.cos(angle) + center;
	yCoord = innerR * Math.sin(angle) + center;
	ctx.moveTo(xCoord, yCoord);
	ctx.lineTo(center, offset);
	angle = Math.PI * 4 / 3;
	xCoord = innerR * Math.cos(angle) + center;
	yCoord = innerR * Math.sin(angle) + center;
	ctx.lineTo(xCoord, yCoord);
	ctx.closePath();
	ctx.fill();
}

function makeGradient(ctx, ...colors) {
	const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius * 1.1);
	
	if(colors.length == 0) { // 0 colors: fail gracefully
		console.log('No colors passed to makeGradient');
		return gradient; 
	} else if(colors.length == 1) { // 1 color: fade to transparent
		gradient.addColorStop(0, colors[0]);
		gradient.addColorStop(1, 'transparent');
	} else { // 2 or more colors
		for(let i = 0; i < colors.length; i++) {
			gradient.addColorStop(i / (colors.length - 1), colors[i]);
		}
	}
	
	return gradient;
}

// Export
function Visualizer(bgCanvas, fgCanvas) {
	this.bgCanvas = bgCanvas;
	this.fgCanvas = fgCanvas;

	this.bgctx = bgCanvas.getContext('2d');
	this.fgctx = fgCanvas.getContext('2d');
	
	this.updateBG();
}

// To be called when the background changes
Visualizer.prototype.updateBG = function(lines) {
	// Draw circle
	this.bgctx.fillStyle = makeGradient(this.bgctx, circleColor, '#004477', '#001444');
	this.bgctx.beginPath();
	this.bgctx.arc(center, center, radius, 0, twopi);
	this.bgctx.closePath();
	this.bgctx.fill();
	
	// Draw shapes if there are any
	if(lines == null) {
		return;
	}
	
	for(let l of lines) {
		let color;
		if(l.muted) {
			color = 'grey';
		} else {
			color = l.color;
		}
		
		if(l.bpi == 1) {
			drawArrow(this.bgctx, color);
		} else {
			drawStar(this.bgctx, l.bpi, color);
		}
	}
}

Visualizer.prototype.pulse = function(pct) {
	const adjustedPct = Math.sqrt(Math.log10(1 + pct) / logthree) * 1.26;
	let gradient;
	if(adjustedPct > 0.95) {
		gradient = makeGradient(this.fgctx, 'rgba(200,80,55,50)', 'rgba(180,0,110,80)');
	} else {
		gradient = makeGradient(this.fgctx, 'rgba(22,200,110,115)', 'rgba(80,100,180,160)');
	}
	// Draw circle
	this.fgctx.clearRect(0, 0, this.fgCanvas.width, this.fgCanvas.height);
	this.fgctx.fillStyle = gradient;
	this.fgctx.beginPath();
	this.fgctx.arc(center, center, radius * adjustedPct, 0, twopi);
	this.fgctx.closePath();
	this.fgctx.fill();
}

Visualizer.prototype.clear = function() {
	// Draw circle
	this.fgctx.clearRect(0, 0, this.fgCanvas.width, this.fgCanvas.height);
}

export default Visualizer;
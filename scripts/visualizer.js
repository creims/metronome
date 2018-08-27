const circleColor = '#808080';
const offset = 10;
const twopi = Math.PI * 2;
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

function pulse(ctx, pct, gradient) {
	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.arc(center, center, radius * pct, 0, twopi);
	ctx.closePath();
	ctx.fill();
}

function radar(ctx, pct, gradient) {
	const angle = twopi * pct + (3 * Math.PI / 2);
	const xCoord = radius * Math.cos(angle) + center;
	const yCoord = radius * Math.sin(angle) + center;

	ctx.strokeStyle = gradient;
	ctx.beginPath();
	ctx.moveTo(center, center);
	ctx.lineTo(xCoord, yCoord);
	ctx.stroke();
	ctx.closePath();
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
	this.animate = null;
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

Visualizer.prototype.setAnimation = function(type) {
	if(type == 'radar') {
		this.fgctx.lineWidth = 3;
		const gradient = makeGradient(this.fgctx, 'rgba(20,250,20,0)', 'rgba(20,250,20,40)');
		
		this.animate = pct => {
			this.clearFG();
			radar(this.fgctx, pct, gradient);
		};
	} else if(type == 'pulse') {
		const partialGradient = makeGradient(this.fgctx, 'rgba(22,200,110,115)', 'rgba(80,100,180,160)');
		const fullGradient = makeGradient(this.fgctx, 'rgba(200,80,55,50)', 'rgba(180,0,110,80)');
		
		this.animate = pct => {
			const adjustedPct = Math.pow(pct, 0.41);
			this.clearFG();
			if(adjustedPct < 0.95) {
				pulse(this.fgctx, adjustedPct, partialGradient);
			} else {
				pulse(this.fgctx, adjustedPct, fullGradient);
			}
		};
	}
}

Visualizer.prototype.clearFG = function() {
	this.fgctx.clearRect(0, 0, this.fgCanvas.width, this.fgCanvas.height);
}

export default Visualizer;
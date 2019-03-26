/*
 */

let fps = 60;
let bodies;
let t = 0;
let real_t = 1;
let vels = [];
let audio;
let fft;
let img;

// size of the frames
let scanline = 384;

class Data
{
	constructor(filename, radius, color)
	{
		this.table = loadTable(filename, 'csv', 'header');
		this.radius = radius;
		this.color = color;
		this.trail = 255;
		this.decay = 1;
	}

	draw(t, scale, angle, angle2)
	{
		// draw a decaying trail of points
		push();
		let weight = this.radius;

		let or = this.table.rows[t].arr;
		let skip = t > this.trail ? int(this.trail / 256) + 1 : 1;
		for(let i = 1 ; i < this.trail ; i += skip)
		{
			if (t - i < 0)
				break;

			let r = this.table.rows[t-i].arr;
			let c = this.color;
			if (1 || this.decay)
			{
				if (this.trail > t)
					c.setAlpha(256 * (t-i) / (t+1));
				else
					c.setAlpha(256 * (this.trail - i) / this.trail);
			}

			stroke(c);
			strokeWeight(weight);
			if (this.decay)
				weight *= 0.995;

			// mix the Y and Z based on the rotation angle
			// exagerate the Z by a large factor
			let x = r[2] * sin(angle2) + r[3] * cos(angle2);
			let y = -r[2] * cos(angle2) + r[3] * sin(angle2);
			let y2 = -y * sin(angle) + r[4] * cos(angle) * 5;

			let ox = or[2] * sin(angle2) + or[3] * cos(angle2);
			let oy = -or[2] * cos(angle2) + or[3] * sin(angle2);
			let oy2 = -oy * sin(angle) + or[4] * cos(angle) * 5;

			line(
				ox * scale,
				oy2 * scale,
				x * scale,
				y2 * scale,
			);

			or = r;
		}

		pop();
	}
}

function setup()
{
	createCanvas(windowWidth, windowHeight);
	//createCanvas(windowWidth, windowHeight, WEBGL); // WEBGL doesn't work
	background(0);
	frameRate(fps);
	//fullscreen(1);

	fft = new p5.FFT();
	fft.setInput(audio);
	audio.play();
}

function preload()
{
	audio = loadSound("assets/voyager.mp3");
	img = loadImage("assets/frame.jpg");

	// planet data from https://ssd.jpl.nasa.gov/horizons.cgi
	bodies = [
	 	new Data("assets/voyager2.csv", 5, color(255,255,255)),
	 	new Data("assets/earth.csv", 5, color(0,255,0)),
	 	new Data("assets/mercury.csv", 2, color(80,100,100)),
	 	new Data("assets/venus.csv", 4, color(100,100,0)),
	 	new Data("assets/mars.csv", 5, color(255,0,0)),
	 	new Data("assets/jupiter.csv", 20, color(255,0,255)),
	 	new Data("assets/saturn.csv", 25, color(255,120,0)),
	 	new Data("assets/neptune.csv", 10, color(0,0,255)),
	 	new Data("assets/uranus.csv", 8, color(100,100,100)),
	];

	bodies[0].decay = 0;
	bodies[0].trail = 8192; // voyager itself
	bodies[2].trail = 64; // mercury
	bodies[3].trail = 128; // venus
	bodies[5].trail = 1024;
	bodies[6].trail = 1024;
	bodies[7].trail = 1024;
	bodies[8].trail = 1024;
}

//function keyReleased() { }
//function keyPressed() { }

function reset() {
	audio.stop();
	real_t = 1;
	vels = [];
	audio.play();
}

function keyPressed()
{
	if (key == 'F')
	{
		console.log("Fullscreen!");
		fullscreen(1);
		resizeCanvas(windowWidth, windowHeight);
	} else
	if (keyCode == ESCAPE)
	{
		fullscreen(0);
		resizeCanvas(windowWidth, windowHeight);
	} else
	if (key == ' ')
		reset();
}


function draw()
{
	background(0);
/*
	else
	if (real_t < 1000)
		real_t += 1.0;
	else
		real_t += 1.5;
*/

	t = int(real_t);

	// draw the most recent audio data as they are received
	// round to the nearest 380 samples at 48 KHz.
	let offset = int(audio._lastPos * 48000 / audio.sampleRate() / scanline);

	real_t = offset * 4800 / 32700;
	if (real_t < 0)
		real_t = 0;
	if (real_t > 4800)
		reset();
	t = int(real_t);

	push();
	translate(0, height - scanline);

	image(img,
		// dx,dy: bottom left corner
		0,
		0,
		width, // dw,dh: fill the bottom screen
		scanline,
		offset - width, // sx,sy: starting at the current scanline
		0, 
		width, // sw,sh: one scanline, half the height
		scanline,
	);

	// fade it into the black
/*
	noStroke();
	for(let x = 0 ; x < 255 ; x++)
	{
		fill(0,0,0,256 - x);
		rect(x,0,x+1,scanline*2);
	}
*/
	pop();

	push();
	fill(255,255,255);
	textSize(24);
	text(bodies[0].table.get(t, 1) + " " + real_t, 10, 20) ;

	let x = bodies[0].table.get(t, 2);
	let y = bodies[0].table.get(t, 3);
	let z = bodies[0].table.get(t, 4);
	let vx = bodies[0].table.get(t, 5);
	let vy = bodies[0].table.get(t, 6);
	let vz = bodies[0].table.get(t, 7);
	let dist = sqrt(x*x + y*y + z*z);
	let vel = sqrt(vx*vx + vy*vy + vz*vz);
	textSize(20);
	text(int(dist / 1e6) + " million km", 10, 40);
	pop();

	// keep the last 256 velocities
	vels.push(vel);
	if (vels.length > 256)
		vels.splice(0, vels.length - 255);

	// draw the chart of the velocities
	// max velocity is around 50, so 256
	push();
	translate(width - 256, 0);
	textSize(20);
	textAlign(RIGHT);
	fill(255,255,255);
	text(int(vel*3600) + " km/h", 256, 30);

/*
	strokeWeight(2);
	
	for(let i = 1 ; i < vels.length ; i++)
	{
		stroke(0,0,200, 255 * i / vels.length);
		line(
			vels[i] * 4,
			(vels.length - i) * 4,
			vels[i-1] * 4,
			(vels.length - i) * 4,
		);
	}
*/

	pop();

	push();

	// compute the scale such that voyager is always on screen
	let scale = height / dist / 2.2;
	translate(width/2, height/2);

	let angle = (mouseY - height/2) / height * PI + PI;
	let angle2 = -(mouseX - width/2) / width * PI;


	for(body of bodies)
	{
		body.draw(t, scale, angle, angle2);
	}
	

	pop();

	// draw an FFT spectrum on the bottom left corner
	let spectrum = fft.analyze(256);

	push();

	noFill();
	strokeWeight(3);
	translate(0,3*height/4);
	for (i = 0; i < 256; i++) {
		stroke(255,255,0,(255-i)/2);
		line(
			map(i, 0, 255, 0, width),
			map(spectrum[i], 0, 255, height/4, 0),
			map(i+1, 0, 255, 0, width),
			map(spectrum[i+1], 0, 255, height/4, 0)
		);
	}

	pop();

}

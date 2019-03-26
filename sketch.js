/*
 */

let fps = 60;
let bodies;
let t = 0;
let real_t = 1;
let velx = [];
let vely = [];
let velz = [];
let vels = [];
let audio;
let fft;
let img;
let voyager;

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

/*
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
*/
		// exagerate Z scale by a lot
		let zscale = 8;

		// draw the entire orbit very faintly
		let c = color(this.color);
		c.setAlpha(30);

		noFill();
		strokeWeight(1);
		stroke(c);
		beginShape();
		for(let i = 0 ; i < this.trail ; i += 2)
		{
			let r = this.table.rows[i].arr;
			let x = r[2] * sin(angle2) + r[3] * cos(angle2);
			let y = -r[2] * cos(angle2) + r[3] * sin(angle2);
			let y2 = -y * sin(angle) + r[4] * cos(angle) * zscale;

			vertex(x * scale, y2 * scale);
		}
		endShape();
		c.setAlpha(255);

		// Draw the planet itself
		let r = this.table.rows[t].arr;
		let x = r[2] * sin(angle2) + r[3] * cos(angle2);
		let y = -r[2] * cos(angle2) + r[3] * sin(angle2);
		let y2 = -y * sin(angle) + r[4] * cos(angle) * zscale;
		this.draw_self(x*scale, y2*scale);
		pop();
	}

	
	draw_self(x,y)
	{
		stroke(this.color);
		strokeWeight(this.radius * 4);
		point(x, y);
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
	 	new Data("assets/mercury.csv", 2, color(80,100,100)),
	 	new Data("assets/venus.csv", 4, color(100,100,0)),
	 	new Data("assets/earth.csv", 5, color(0,255,0)),
	 	new Data("assets/mars.csv", 5, color(255,0,0)),
	 	new Data("assets/jupiter.csv", 20, color(255,0,255)),
	 	new Data("assets/saturn.csv", 15, color(255,120,0)),
	 	new Data("assets/neptune.csv", 10, color(0,0,255)),
	 	new Data("assets/uranus.csv", 8, color(100,100,100)),
	 	new Data("assets/pluto.csv", 4, color(40,40,40)),
	];

	bodies[0].trail = 128; // mercury
	bodies[1].trail = 240; // venus
	bodies[2].trail = 380; // earth
	bodies[3].trail = 700; // mars
	bodies[4].trail = 4800; // jupiter
	bodies[5].trail = 4800; // saturn
	bodies[6].trail = 4800; // neptune
	bodies[7].trail = 4800; // uranus
	bodies[8].trail = 4800; // pluto (not a planet)

	// voyager is special
	voyager = new Data("assets/voyager2.csv", 5, color(255,255,255));
	let voyager_img = loadImage("assets/voyager.svg");

	// voyage has its own draw function with an image
	voyager.decay = 0;
	voyager.draw_self = function(x,y)
	{
		stroke(255,255,255);
		strokeWeight(1);
		image(voyager_img,
			x - voyager_img.width/8,
			y - voyager_img.height/8,
			voyager_img.width/4,
			voyager_img.height/4,
		);
	};

	// ensure it goes on last so that it is always on top
	bodies.push(voyager);
}

//function keyReleased() { }
//function keyPressed() { }

function reset() {
	audio.stop();
	real_t = 1;
	velx = [];
	vely = [];
	velz = [];
	vels = [];

	// ensure that we have a decent default view
	// if no mouse movement happens
	mouseX = width/2;
	mouseY = 0;
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

	voyager.trail = t; // draw all the points for voyager

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
	textSize(48);
	textAlign(CENTER);
	text(voyager.table.get(t, 1).substr(5,12), width/2, 50) ;

	let x = voyager.table.get(t, 2);
	let y = voyager.table.get(t, 3);
	let z = voyager.table.get(t, 4);
	let vx = voyager.table.get(t, 5);
	let vy = voyager.table.get(t, 6);
	let vz = voyager.table.get(t, 7);
	let dist = sqrt(x*x + y*y + z*z);
	let vel = sqrt(vx*vx + vy*vy + vz*vz);
	pop();

	// keep the last 256 velocities
	velx.push(vx);
	vely.push(vy);
	velz.push(vz);
	vels.push(vel);
	if (vels.length > 256)
	{
		velx.splice(0, velx.length - 255);
		vely.splice(0, vely.length - 255);
		velz.splice(0, velz.length - 255);
		vels.splice(0, vels.length - 255);
	}

	// draw the chart of the velocities
	// max velocity is around 50, so 256
	push();
	translate(width - 1024, 0);
	textSize(20);
	textAlign(RIGHT);
	fill(255,255,255);

	// speed goes along with the velocity graph
	text(int(vel*3600) + " km/h", 1024, (50 - vel) * 8);

	// distance goes to 5000 million km at the top of the screen
	text(int(dist / 1e6) + " million km", 1024, height * (1 - (dist / 5000e6)));

	strokeWeight(2);
	
	// draw vx, vy and vz
	noFill();
	beginShape();
	stroke(100,0,0, 30);
	for(let i = 0 ; i < velx.length ; i++)
	{
		vertex(
			(256 - velx.length + i) * 4,
			(50 - abs(velx[i])) * 8,
		);
	}
	endShape();

	beginShape();
	stroke(0,100,0, 30);
	for(let i = 0 ; i < vely.length ; i++)
	{
		vertex(
			(256 - vely.length + i) * 4,
			(50 - abs(vely[i])) * 8,
		);
	}
	endShape();

	beginShape();
	stroke(0,0,100, 30);
	for(let i = 1 ; i < velz.length ; i++)
	{
		vertex(
			(256 - velz.length + i) * 4,
			(50 - abs(velz[i])) * 8,
		);
	}
	endShape();

	for(let i = 1 ; i < vels.length ; i++)
	{
		stroke(200,200,0, 255 * i / vels.length);
		line(
			(256 - vels.length + i) * 4,
			(50 - vels[i]) * 8,
			(255 - vels.length + i) * 4,
			(50 - vels[i-1]) * 8,
		);
	}

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
	strokeWeight(4);
	translate(0,3*height/4);
	for (i = 0; i < 256; i++) {
		stroke(255,255,255,(255-i)/2);
		line(
			map(i, 0, 255, 0, width),
			map(spectrum[i], 0, 255, height/4, 0),
			map(i+1, 0, 255, 0, width),
			map(spectrum[i+1], 0, 255, height/4, 0)
		);
	}

	pop();

}

/*
 */

let fps = 60;
let bodies;
let t = 0;
let vels = [];

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
			let x = r[2] * sin(angle2) + r[3] * cos(angle2);
			let y = -r[2] * cos(angle2) + r[3] * sin(angle2);
			let y2 = -y * sin(angle) + r[4] * cos(angle);

			let ox = or[2] * sin(angle2) + or[3] * cos(angle2);
			let oy = -or[2] * cos(angle2) + or[3] * sin(angle2);
			let oy2 = -oy * sin(angle) + or[4] * cos(angle);

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

	// planet data from https://ssd.jpl.nasa.gov/horizons.cgi
}

function preload()
{
	bodies = [
	 	new Data("assets/voyager2.csv", 1, color(255,255,255)),
	 	new Data("assets/earth.csv", 1, color(0,255,0)),
	 	new Data("assets/mercury.csv", 0.5, color(80,100,100)),
	 	new Data("assets/venus.csv", 0.5, color(100,100,0)),
	 	new Data("assets/mars.csv", 0.5, color(255,0,0)),
	 	new Data("assets/jupiter.csv", 5, color(255,0,255)),
	 	new Data("assets/saturn.csv", 4, color(255,120,0)),
	 	new Data("assets/neptune.csv", 2, color(0,0,255)),
	 	new Data("assets/uranus.csv", 1, color(100,100,100)),
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
	t = 0;
	vels = [];
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

	t++;

	push();
	fill(255,255,255);
	textSize(20);
	text(bodies[0].table.get(t, 1), 10, 20);

	let x = bodies[0].table.get(t, 2);
	let y = bodies[0].table.get(t, 3);
	let z = bodies[0].table.get(t, 4);
	let vx = bodies[0].table.get(t, 5);
	let vy = bodies[0].table.get(t, 6);
	let vz = bodies[0].table.get(t, 7);
	let dist = sqrt(x*x + y*y + z*z);
	let vel = sqrt(vx*vx + vy*vy + vz*vz);
	text(int(dist / 1e6) + " million km", 10, 40);

	vels.push(vel);
	if (vels.length > windowWidth)
		vels.splice(0, vels.length - windowWidth);

	// draw the chart of the velocities
	textSize(10);
	textAlign(RIGHT);
	text(int(vel) + " km/s", windowWidth - 10, windowHeight - 2);
	strokeWeight(1);
	
	for(let i = 1 ; i < vels.length ; i++)
	{
		stroke(0,0,200, 255 * i / vels.length);
		line(
			windowWidth - vels.length + i,
			windowHeight - vels[i-1],
			windowWidth - vels.length + i + 1,
			windowHeight - vels[i]
		);
	
	}

	pop();

	push();

	// compute the scale such that voyager is always on screen
	let scale = windowHeight / dist / 2.2;
	translate(windowWidth/2, windowHeight/2);

	let angle = (mouseY - windowHeight/2) / windowHeight * PI + PI;
	let angle2 = -(mouseX - windowWidth/2) / windowWidth * PI;


	for(body of bodies)
	{
		body.draw(t, scale, angle, angle2);
	}
	

	pop();
}

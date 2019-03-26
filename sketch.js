/*
 */

let fps = 60;
let bodies;
let t = 0;

class Data
{
	constructor(filename, radius, color)
	{
		this.table = loadTable(filename, 'csv', 'header');
		this.radius = radius;
		this.color = color;
		this.trail = 256;
		this.decay = 1;
	}

	draw(t, scale, angle)
	{
		// draw a decaying trail of points
		push();
		strokeWeight(this.radius);

		let or = this.table.rows[t].arr;
		for(let i = 1 ; i < this.trail ; i++)
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

			// mix the Y and Z based on the rotation angle
			let y = r[3] * sin(angle) + r[4] * cos(angle);
			let oy = or[3] * sin(angle) + or[4] * cos(angle);

			line(
				or[2] * scale,
				oy * scale,
				r[2] * scale,
				y * scale,
			);

			or = r;
		}

		pop();
	}
}

function setup()
{
	//createCanvas(windowWidth-10, windowHeight-10);
	createCanvas(windowWidth, windowHeight); // WEBGL doesn't work
	background(0);
	frameRate(fps);

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
	 	new Data("assets/jupiter.csv", 3, color(255,0,255)),
	 	new Data("assets/saturn.csv", 2, color(255,120,0)),
	 	new Data("assets/neptune.csv", 1, color(0,0,255)),
	 	new Data("assets/uranus.csv", 1, color(100,100,100)),
	];
}

//function keyReleased() { }
//function keyPressed() { }
//function mousePressed() { }

function keyPressed() {
	t = 0;
}


function draw()
{
	background(0);

	t++;
	bodies[0].decay = 0;
	bodies[0].trail = 8192;
	bodies[2].trail = 128; // mercury
	bodies[5].trail = 4096;
	bodies[6].trail = 4096;
	bodies[7].trail = 4096;
	bodies[8].trail = 4096;

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
	text(int(vel) + " km/s", 10, 60);

	// compute the scale such that voyager is always on screen
	let scale = windowHeight / dist / 2.2;
	translate(windowWidth/2, windowHeight/2);

	let angle = (mouseY - windowHeight/2) / windowHeight * PI + PI;


	for(body of bodies)
	{
		body.draw(t, scale, angle);
	}
	

	pop();
}

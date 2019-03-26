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
	}

	draw(t, scale)
	{
		// draw a decaying trail of points
		push();
		strokeWeight(1);

		let or = this.table.rows[t].arr;
		for(let i = 1 ; i < 255 ; i++)
		{
			if (t - i < 0)
				break;

			let r = this.table.rows[t-i].arr;
			let c = this.color;
			c.setAlpha(255 - i);
			stroke(c);

			line(
				r[2] * scale,
				r[3] * scale,
				//r[4] * scale,
				or[2] * scale,
				or[3] * scale,
				//or[4] * scale,
			);

			or = r;
		}

		pop();
	}
}

function setup()
{
	createCanvas(windowWidth-10, windowHeight-10);
	//createCanvas(windowWidth-10, windowHeight-10, WEBGL);
	background(0);
	frameRate(fps);

	// planet data from https://ssd.jpl.nasa.gov/horizons.cgi
}

function preload()
{
	bodies = [
	 	new Data("assets/voyager2.csv", 1, color(255,255,255)),
	 	new Data("assets/earth.csv", 1, color(0,255,0)),
	 	new Data("assets/mercury.csv", 1, color(80,100,100)),
	 	new Data("assets/venus.csv", 1, color(100,100,0)),
	 	new Data("assets/mars.csv", 1, color(255,0,0)),
	 	new Data("assets/jupiter.csv", 1, color(255,0,255)),
	 	new Data("assets/saturn.csv", 1, color(255,120,0)),
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
	let vel = sqrt(vx*vx + vy*vy + z*z);
	text(int(dist / 1e6) + " million km", 10, 40);
	text(int(vel / 1e6) + " million km/s", 10, 60);

	translate(windowWidth/2, windowHeight/2);

	// compute the scale such that voyager is always on screen
	let scale = windowHeight / dist / 2.2;

	for(body of bodies)
	{
		body.draw(t, scale);
	}
	

	pop();
}

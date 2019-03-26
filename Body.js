/*
 * Something that moves in 2D or 3D
 */
class Body
{
	constructor() {
		// mass for gravitational force calculations
		// and radius for drawing functions
		this.mass = 1;
		this.r = 1;

		// should be a constant
		this.G = 6.67408e-11; // m^3/kg/s^2


		this.old = [];
		this.p = createVector(0,0,0);
		this.v = createVector(0,0,0);
		this.a = createVector(0,0,0);

		this.color = color(255,0,0);
	}

	move(dt) {
		// update our velocity for this time step
		this.v.add(p5.Vector.mult(this.a, dt));

		// update our position
		this.p.add(p5.Vector.mult(this.v, dt));

		// store our old history
		if (this.old.unshift(this.p.copy()) > 100)
			this.old.pop();
	}

	// Compute the force from one body to another
	// F = m1 * a = G m1*m2 / r^2
	// a = G m2 / r^2
	force(b) {
		if (b === this)
			return 0;
		let d = p5.Vector.sub(b.p, this.p);
		let r2 = d.magSq();
		if (r2 == 0)
			return 0;

		return d.setMag(this.G * b.mass / r2);
	}

	draw(dist_scale,offset) {
		stroke(255,255,255);
		strokeWeight(1);

		let ox = (this.p.x - offset.x) * dist_scale;
		let oy = (this.p.y - offset.y) * dist_scale;
		let bright = 255;

/*
		for(let o of this.old)
		{
			let nx = (o.x - offset.x) * dist_scale;
			let ny = (o.y - offset.y) * dist_scale;

			stroke(bright -= 2);
			line(ox, oy, nx, ny);
			ox = nx;
			oy = ny;
		}
*/

		noStroke();
		fill(this.color);

		ellipse(
			(this.p.x - offset.x) * dist_scale,
			(this.p.y - offset.y) * dist_scale,
			2 * p.radius * rad_scale,
			2 * p.radius * rad_scale
		);
	}
}

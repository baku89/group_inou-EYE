#ifdef GL_ES
precision highp float;
#endif

#define PI 3.14159265358979323846264
#define PI_2 (PI * 2.0)

uniform vec2 resolution;
uniform sampler2D original;
uniform float pitch;
uniform float heading;

void main (void) {

	vec2 op = gl_FragCoord.xy / resolution.xy;

	// cab heading
	vec2 p = vec2(fract(op.x + heading / PI_2), clamp(op.y, 0.0, 1.0));

	//(u,v) -> (θ,φ)
	p = vec2(
		p.x * PI_2,
		PI * (p.y - 0.5)
	);

	// (θ,φ) -> (x, y, z)
	vec3 c = vec3(
		cos(p.x) * cos(p.y),
		sin(p.x) * cos(p.y),
		sin(p.y)
	);

	// (x, y, x) -rot-> (x', y', z')
	c = vec3(
		cos(pitch) * c.x - sin(pitch) * c.z,
		c.y,
		sin(pitch) * c.x + cos(pitch) * c.z
	);

	// (x', y', z') -> (θ',φ')
	p = vec2(
		atan(c.y, c.x),
		atan(c.z, length(c.xy))
	);

	// (θ',φ') -> (u',v')
	p = vec2(
		p.x / PI_2,
		p.y / PI + 0.5
	);

	p = fract(p);

	vec4 color = texture2D(original, p);

	// vec2 dir = vec2(0.5, 0.5);
	// if (distance(p, dir) < 0.003) {
	// 	color = vec4(1.0, 0.0, 0.0, 1.0);
	// }

	gl_FragColor = color;
}
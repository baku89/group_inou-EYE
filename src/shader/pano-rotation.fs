#ifdef GL_ES
precision highp float;
#endif

#define PI 3.14159265358979323846264

uniform vec2 resolution;
uniform sampler2D original;
uniform float pitch;
uniform float rotation;

void main (void) {
	vec2 op = gl_FragCoord.xy / resolution.xy;

	vec2 p = vec2(op.x + rotation / (PI * 2.0), op.y - pitch / (PI * 2.0));
	p = mod(p + vec2(1.0, 1.0), vec2(1.0, 1.0));

	vec4 color = texture2D(original, p);

  gl_FragColor = vec4(color.r, color.g, color.b, 1.0);
}
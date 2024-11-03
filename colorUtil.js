function hexToRgb(hex) {
	const bigint = parseInt(hex.slice(1), 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return { r, g, b };
}

function rgbToHex(r, g, b) {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function interpolateColor(color1, color2, factor) {
	const rgb1 = hexToRgb(color1);
	const rgb2 = hexToRgb(color2);
	const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
	const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
	const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));

	return rgbToHex(r, g, b);
}

export function createColorGradient(startColor, endColor, steps) {
	const gradient = [] ;
	for (let i = 0; i <= steps; i++) {
		const factor = i / steps;
		const c = interpolateColor(startColor, endColor, factor);
		gradient.push(c);
	}
	return gradient;
}

function adjustColor(color, factor) {
	const rgb = hexToRgb(color);

	const r = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
	const g = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
	const b = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));

	return rgbToHex(r, g, b);
}

export function lightenColor(color, factor) {
	// Factor > 1 will lighten the color
	return adjustColor(color, 1 + factor);
}

export function darkenColor(color, factor) {
	// Factor < 1 will darken the color
	return adjustColor(color, 1 - factor);
}

export function createColorGradientFromColor(color, steps) {
	const lightColor = lightenColor(color, 0.2);
	const darkColor = darkenColor(color, 0.2);
	return createColorGradient(lightColor, darkColor, steps);
}

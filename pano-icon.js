export const SIZE = 24;
export const FOV_SIZE = 96;


const SVGNS = "http://www.w3.org/2000/svg";
const DEGRAD = Math.PI/180;

export default class PanoIcon extends HTMLElement {
	#fov = createFov();
	#icon = createIcon();

	connectedCallback() {
		this.replaceChildren(this.#fov, this.#icon);
	}

	drawFov(angle, fov) {
		drawAngle(this.#fov, angle, fov)
	}

	hideFov() {
		this.drawFov(0, 0);
	}
}
customElements.define("pano-icon", PanoIcon);

function drawAngle(svg, angle, fov) {
	let path = svg.querySelector("path");
	const r = FOV_SIZE/2;
	angle -= 90; // canvas has 0 => right, we want 0 => top
	let a1 = DEGRAD * (angle - fov/2);
	let a2 = DEGRAD * (angle + fov/2);
	path.setAttribute("d", `
		M ${r} ${r}
		L ${r + r*Math.cos(a1)} ${r + r*Math.sin(a1)}
		A ${r} ${r} 0 0 1 ${r + r*Math.cos(a2)} ${r + r*Math.sin(a2)}
	`);
}

function createFov() {
	let svg = document.createElementNS(SVGNS, "svg");
	svg.setAttribute("class", "fov");
	svg.setAttribute("width", FOV_SIZE);
	svg.setAttribute("height", FOV_SIZE);
	let defs = document.createElementNS(SVGNS, "defs");
	defs.innerHTML = `
		<radialGradient id="fov" gradientUnits="userSpaceOnUse">
			<stop offset="0%" stop-color="rgba(30 144 255 / 1)" />
			<stop offset="100%" stop-color="rgba(30 144 255 / 0)" />
		</radialGradient>
	`;
	let path = document.createElementNS(SVGNS, "path");
	svg.append(defs, path);
	return svg;
}

function createIcon() {
	let svg = document.createElementNS(SVGNS, "svg");
	svg.setAttribute("class", "icon");
	svg.setAttribute("width", SIZE);
	svg.setAttribute("height", SIZE);
	let path = document.createElementNS(SVGNS, "path");
	const R1 = SIZE/2;
	const R2 = R1 - 6;
	path.setAttribute("d", `
		M ${0} ${R1}
		A ${R1} ${R1} 0 1 1 ${2*R1} ${R1}
		A ${R1} ${R1} 0 1 1 ${0} ${R1}
		M ${R1-R2} ${R1}
		A ${R2} ${R2} 0 1 0 ${R1+R2} ${R1}
		A ${R2} ${R2} 0 1 0 ${R1-R2} ${R1}
	`);
	svg.append(path);
	return svg;
}

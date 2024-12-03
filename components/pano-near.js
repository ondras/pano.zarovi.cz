import { createIcon } from "./pano-icon.js";
import * as geomUtils from "./geom-utils.js";


const D2R = Math.PI/180;

export default class PanoNear extends HTMLElement {
	#icon = createIcon();
	#targetItem;
	#currentItem;
	#data;

	constructor(targetItem, currentItem) {
		super();

		this.#targetItem = targetItem;
		this.#currentItem = currentItem;

		let distance = geomUtils.great_circle_distance(currentItem, targetItem);
		let azimuth = geomUtils.azimuth(currentItem, targetItem);
		let vazimuth1 = geomUtils.vertical_azimuth_1(currentItem, targetItem);
		let vazimuth2 = geomUtils.vertical_azimuth_2(currentItem, targetItem);
		azimuth = mod(azimuth*180/Math.PI, 360);
		vazimuth1 = vazimuth1*180/Math.PI;
		vazimuth2 = vazimuth2*180/Math.PI;
		this.#data = { distance, azimuth, vazimuth:vazimuth1 };
	}

	get target() { return this.#targetItem; }
	get distance() { return this.#data.distance; }

	updatePosition(littlePlanet) {
		const { camera, mode } = littlePlanet;

		if (mode == "planet") {
			this.hidden = true;
			return;
		}

		let heading = camera.lon + Number(this.#currentItem["FlightYawDegree"]);
		let ar = littlePlanet.width / littlePlanet.height;
		const hfov = (ar >= 1 ? camera.fov : camera.fov*ar);
		const vfov = (ar >= 1 ? camera.fov/ar : camera.fov);

		let fracH = projectToViewport(heading, hfov/2, this.#data.azimuth);
		let fracV = projectToViewport(camera.lat, vfov/2, this.#data.vazimuth);

		if (fracH === null || fracV === null) {
			this.hidden = true;
			return;
		}

		this.hidden = false;
		this.style.left = `${fracH*100}%`;
		this.style.top = `${(1-fracV)*100}%`;
	}

	connectedCallback() {
		let a = document.createElement("a");
		let url = new URL(location.href);
		url.hash = this.#targetItem["SourceFile"];
		a.href = url.href;

		a.append(this.#icon);
		this.replaceChildren(a);

		this.title = this.#targetItem["ImageDescription"];
		this.hidden = true;
	}
}
customElements.define("pano-near", PanoNear);

function projectToViewport(center, fovHalf, angle) {
	let diff = mod(angle-center, 360);
	if (diff > 180) { diff -= 360; }
	if (Math.abs(diff) > fovHalf) { return null; }

	let frac = Math.tan(D2R*diff)/Math.tan(D2R*fovHalf); // -1..1
	return (frac+1)/2;
}

function mod(num, m) {
	return (num%m+m)%m;
}

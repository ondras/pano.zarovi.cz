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
		azimuth = azimuth/D2R;
		vazimuth1 = vazimuth1/D2R;
		vazimuth2 = vazimuth2/D2R;
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

		let ar = littlePlanet.width / littlePlanet.height;
		let fov = {
			h: (ar >= 1 ? camera.fov : camera.fov*ar) * D2R / 2,
			v: (ar >= 1 ? camera.fov/ar : camera.fov) * D2R / 2
		}

		let point_r = {
			lon: D2R*this.#data.azimuth,
			lat: D2R*this.#data.vazimuth
		}
		let rotation_r = {
			lat: -D2R*camera.lat,
			lon: -D2R*(Number(this.#currentItem["FlightYawDegree"]) + camera.lon)
		}
		let rotated = geomUtils.rotate_xy(point_r, rotation_r);

		if (Math.abs(rotated.lon) > fov.h || Math.abs(rotated.lat) > fov.v) {
			this.hidden = true;
			return;
		}

		let projected = geomUtils.project_gnomonic(rotated, fov);
		this.hidden = false;
		this.style.left = `${projected[0]*100}%`;
		this.style.top = `${(1-projected[1])*100}%`;
	}

	connectedCallback() {
		let a = document.createElement("a");
		let url = new URL(location.href);
		url.hash = this.#targetItem["SourceFile"];
		a.href = url.href;

		a.append(this.#icon);
		this.replaceChildren(a);

		let dist = (this.#data.distance / 1000).toFixed(2);
		this.title = `${this.#targetItem["ImageDescription"]}\n${dist} km`;
		this.hidden = true;
	}
}
customElements.define("pano-near", PanoNear);

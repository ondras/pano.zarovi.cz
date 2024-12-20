import PanoNear from "./pano-near.js";
import { NEAR_LIMIT } from "./config.js";


const DPR = devicePixelRatio;
const YAW_KEY = "FlightYawDegree";

export default class PanoScene extends HTMLElement {
	#lp;
	#item;
	#panoIcon;
	#near = new Map();

	constructor() {
		super();
		new ResizeObserver(_ => this.#lp && this.#syncSize()).observe(this);
	}

	get heading() {
		return this.#lp.camera.lon + Number(this.#item[YAW_KEY]);
	}

	async show(item, options) {
		let camera = null;
		if (options.retainCamera && this.#lp) {
			let oldCamera = this.#lp.camera;
			camera = {
				lat: oldCamera.lat,
				lon: this.heading - Number(item[YAW_KEY]),
				fov: oldCamera.fov
			}
		}

		this.#panoIcon && this.#panoIcon.hideFov();
		this.#panoIcon = options.panoIcon;
		this.#item = item;

		[...this.#near.values()].forEach(near => near.remove());
		this.#near.clear();

		for (let otherItem of options.items) {
			if (otherItem == item) { continue; }
			let near = new PanoNear(otherItem, item);
			if (near.distance > NEAR_LIMIT) { continue; }

			near.addEventListener("click", _ => this.#dispatch("pano-click", otherItem));
			near.addEventListener("mouseenter", _ => this.#dispatch("pano-over", otherItem));
			near.addEventListener("mouseleave", _ => this.#dispatch("pano-out", otherItem));

			this.#near.set(otherItem, near);
		}

		let lp = document.createElement("little-planet");
		lp.src = item["SourceFile"];
		lp.addEventListener("change", e => this.#onPanoChange(e));

		if (camera) { // crossfade
			this.append(lp, ...this.#near.values());
			let oldLp = this.#lp;
			lp.style.opacity = 0;
			lp.addEventListener("load", _ => {
				lp.mode = "pano";
				lp.camera = camera;
				crossfade(oldLp, lp);
			});
		} else { // hard replace
			this.replaceChildren(lp, ...this.#near.values());
		}

		this.#lp = lp;
		this.#syncSize();
	}

	highlight(item) {
		for (let [i, near] of this.#near.entries()) {
			near.classList.toggle("highlight", i == item);
		}
	}

	#syncSize() {
		const lp = this.#lp;
		lp.width = lp.clientWidth * DPR;
		lp.height = lp.clientHeight * DPR;
	}

	#dispatch(type, item) {
		let event = new CustomEvent(type, {detail:{item}});
		this.dispatchEvent(event);
	}

	#onPanoChange(e) {
		if (!(YAW_KEY in this.#item)) { return; }

		const { mode, camera } = e.target;
		console.log(e, camera)

		switch (mode) {
			case "pano":
				this.#panoIcon.drawFov(this.heading, camera.fov);
			break;

			case "planet":
				this.#panoIcon.hideFov();
			break;
		}

		for (let near of this.#near.values()) {
			near.updatePosition(e.target);
		}
	}
}
customElements.define("pano-scene", PanoScene);

function crossfade(oldLp, newLp) {
	let duration = 1000;
	oldLp.animate({opacity: [1, 0]}, duration).finished.then(_ => oldLp.remove());
	newLp.animate({opacity: [0, 1]}, {duration, fill:"both"}).finished.then(a => a.commitStyles());
}

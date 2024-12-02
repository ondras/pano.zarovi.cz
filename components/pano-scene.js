import PanoNear from "./pano-near.js";


const DPR = devicePixelRatio;
const NEAR_LIMIT = 5000;

export default class PanoScene extends HTMLElement {
	#lp;
	#item;
	#near = new Map();

	constructor() {
		super();
		new ResizeObserver(_ => this.#lp && this.#syncSize()).observe(this);
	}

	show(item, allItems) {
		let littlePlanet = document.createElement("little-planet");
		littlePlanet.src = item["SourceFile"];
		this.#lp = littlePlanet;

		// fixme odebrat
		littlePlanet.addEventListener("change", e => this.#onPanoChange(e));

		if (this.#item) {
			let { panoIcon } = this.#item;
			panoIcon.hideFov();
		}

		this.#item = item;
		this.#near.clear();

		for (let otherItem of allItems) {
			if (otherItem == item) { continue; }
			let near = new PanoNear(otherItem, item);
			if (near.distance > NEAR_LIMIT) { continue; }

			near.addEventListener("click", _ => this.#dispatch("pano-click", otherItem));
			near.addEventListener("mouseenter", _ => this.#dispatch("pano-over", otherItem));
			near.addEventListener("mouseleave", _ => this.#dispatch("pano-out", otherItem));

			this.#near.set(otherItem, near);
		}

		this.replaceChildren(littlePlanet, ...this.#near.values());
		this.#syncSize();
	}

	#syncSize() { // fixme resizeobserver
		const lp = this.#lp;
		lp.width = lp.clientWidth * DPR;
		lp.height = lp.clientHeight * DPR;
	}

	highlight(item) {
		for (let [i, near] of this.#near.entries()) {
			near.classList.toggle("highlight", i == item);
		}
	}

	#dispatch(type, item) {
		let event = new CustomEvent(type, {detail:{item}});
		this.dispatchEvent(event);
	}

	#onPanoChange(e) {
		if (!("FlightYawDegree" in this.#item)) { return; }

		const { mode, camera } = e.target;

		switch (mode) {
			case "pano":
				let angle = camera.lon + Number(this.#item["FlightYawDegree"]);
				this.#item.panoIcon.drawFov(angle, camera.fov);
			break;

			case "planet":
				this.#item.panoIcon.hideFov();
			break;
		}

		for (let near of this.#near.values()) {
			near.updatePosition(e.target);
		}
	}
}
customElements.define("pano-scene", PanoScene);

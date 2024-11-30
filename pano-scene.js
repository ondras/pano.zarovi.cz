import PanoNear from "./pano-near.js";


const DPR = devicePixelRatio;

export default class PanoScene extends HTMLElement {
	#lp;
	#item;
	#near = [];

	show(item, allItems) {
		let littlePlanet = document.createElement("little-planet");
		littlePlanet.src = item["SourceFile"];
		this.#lp = littlePlanet;

		littlePlanet.addEventListener("change", e => this.#onPanoChange(e));

		if (this.#item) {
			let { marker, panoIcon } = this.#item;
			if (marker._icon) { marker._icon.classList.remove("active"); }
			panoIcon.hideFov();
		}

		this.#item = item;
		let { marker } = item;
		if (!marker._icon) { marker.__parent.spiderfy(); }
		if (marker._icon) { marker._icon.classList.add("active"); }

		let near = allItems
					.filter(otherItem => otherItem != item)
					.map(otherItem => new PanoNear(otherItem, item))
					.filter(node => node.distance < 5*1000);

		near.forEach(node => {
			node.addEventListener("click", _ => this.show(node.target, allItems));
		});
		this.#near = near;

		this.replaceChildren(littlePlanet, ...near);
		this.syncSize();
	}

	syncSize() { // fixme resizeobserver
		const lp = this.#lp;
		if (!lp) { return; }
		lp.width = lp.clientWidth * DPR;
		lp.height = lp.clientHeight * DPR;
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

		this.#near.forEach(node => node.updatePosition(e.target));
	}
}
customElements.define("pano-scene", PanoScene);

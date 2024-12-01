import PanoMap from "./pano-map.js";
import PanoScene from "./pano-scene.js";


export default class PanoApp extends HTMLElement {
	#map = new PanoMap();
	#scene = new PanoScene();
	#items = [];

	constructor() {
		super();

		this.#map.addEventListener("pano-click", e => {
			this.show(e.detail.item, {center:false, popup:false});
		});

		this.#map.addEventListener("pano-over", e => this.#highlight(e.detail.item));
		this.#map.addEventListener("pano-out", e => this.#highlight(null));
	}

	connectedCallback() {
		this.replaceChildren(this.#map, this.#scene);
		this.#load();

		window.addEventListener("resize", _ => this.#syncSize());
	}

	show(item, options) {
		this.#map.activate(item, options);
		this.#scene.show(item, this.#items);
	}

	#highlight(item) {
		this.#map.highlight(item);
		this.#scene.highlight(item);
	}

	async #load() {
		let response = await fetch("data.json");
		this.#items = await response.json();
		this.#map.showItems(this.#items);
		this.#fromURL();
	}

	#syncSize() {
		this.#scene.syncSize();
		this.#map.invalidateSize();
	}

	#fromURL() {
		let str = location.hash.substring(1);
		if (!str) { return; }

		let item = this.#items.filter(item => item["SourceFile"] == str)[0];
		if (!item) { return; }

		this.show(item, {center:true, popup:true});
	}

}
customElements.define("pano-app", PanoApp);

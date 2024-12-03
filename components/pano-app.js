import PanoMap from "./pano-map.js";
import PanoScene from "./pano-scene.js";


export default class PanoApp extends HTMLElement {
	#map = new PanoMap();
	#scene = new PanoScene();
	#items = [];

	constructor() {
		super();

		this.#map.addEventListener("pano-click", e => {
			this.show(e.detail.item, "map");
		});

		this.#scene.addEventListener("pano-click", e => {
			this.show(e.detail.item, "scene");
		});

		this.#map.addEventListener("pano-over", e => this.#highlight(e.detail.item));
		this.#map.addEventListener("pano-out", e => this.#highlight(null));

		this.#scene.addEventListener("pano-over", e => this.#highlight(e.detail.item));
		this.#scene.addEventListener("pano-out", e => this.#highlight(null));
	}

	connectedCallback() {
		this.replaceChildren(this.#map, this.#scene);
		this.#load();
	}

	show(item, activator) {
		let mapOptions = {
			center: (activator == "scene" || activator == "url"),
			popup: (activator == "scene" || activator == "url"),
			zoom: (activator == "url" ? 17 : null)
		}
		this.#map.activate(item, mapOptions);

		let sceneOptions = {
			panoIcon: this.#map.getIcon(item),
			items: this.#items,
			heading: (activator == "scene" ? this.#scene.heading : null)
		}
		this.#scene.show(item, sceneOptions);
	}

	#highlight(item) {
		this.#map.highlight(item);
		this.#scene.highlight(item);
	}

	async #load() {
		let response = await fetch("data.json");
		this.#items = await response.json();
		// FIXME validate key props
		this.#map.showItems(this.#items);
		this.#fromURL();
	}

	#fromURL() {
		let str = location.hash.substring(1);
		if (!str) { return; }

		let item = this.#items.filter(item => item["SourceFile"] == str)[0];
		if (!item) { return; }

		this.show(item, "url", );
	}

}
customElements.define("pano-app", PanoApp);

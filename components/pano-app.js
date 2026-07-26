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
		this.dataset.priority = "map";
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
			retainCamera: (activator == "scene")
		}
		this.#scene.show(item, sceneOptions);

		this.dataset.priority = "scene";
	}

	#onMoveEnd() {
		if (this.#scene.hasItem) { return; }

		let { center, zoom } = this.#map.getViewport();

		let sp = new URLSearchParams();
		sp.set("x", center.lng.toFixed(4));
		sp.set("y", center.lat.toFixed(4));
		sp.set("z", zoom);
		history.replaceState(null, "", `#${sp.toString()}`);
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

		this.#map.addEventListener("moveend", e => this.#onMoveEnd());
	}

	#fromURL() {
		let str = location.hash.substring(1);
		if (!str) { return; }

		let item = this.#items.filter(item => item["SourceFile"] == str)[0];
		if (item) {
			this.show(item, "url");
		} else {
			let sp = new URLSearchParams(str);
			if (sp.has("x") && sp.has("y") && sp.has("z")) {
				let lon = Number(sp.get("x"));
				let lat = Number(sp.get("y"));
				let zoom = Number(sp.get("z"));
				this.#map.setViewport([lat, lon], zoom);
			}
		}
	}

}
customElements.define("pano-app", PanoApp);

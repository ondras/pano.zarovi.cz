export default class PanoToggle extends HTMLElement {
	#button = document.createElement("button");

	constructor() {
		super();

		this.#button.addEventListener("click", () => {
			const { dataset } = this.app;
			dataset.priority = (dataset.priority == "map" ? "scene" : "map");
		});
	}

	get app() { return this.closest("pano-app"); }

	connectedCallback() {
		this.replaceChildren(this.#button);
	}
}
customElements.define("pano-toggle", PanoToggle);

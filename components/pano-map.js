import PanoIcon, { SIZE as ICON_SIZE } from "./pano-icon.js";
import { MAPTILER_KEY } from "./config.js";


function addLayers(map) {
	let osm = L.tileLayer(`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, {
		maxZoom: 19,
		attribution: `© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>`
	});

	let topo = L.tileLayer(`https://api.maptiler.com/maps/topo/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, {
		tileSize: 512,
		zoomOffset: -1,
		minZoom: 1,
		attribution: `© <a href="https://www.maptiler.com/copyright/">MapTiler</a>, <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>`
	});

	let satellite = L.tileLayer(`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`, {
		tileSize: 512,
		zoomOffset: -1,
		minZoom: 1,
		attribution: `© <a href="https://www.maptiler.com/copyright/">MapTiler</a>, <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>`
	});

	let layers = {
		"Base + Terrain": topo,
		"OSM": osm,
		"Satellite": satellite
	};
	L.control.layers(layers).addTo(map);
	map.addLayer(topo);
}

const dateFormat = new Intl.DateTimeFormat([], {dateStyle:"medium", timeStyle:"short"});

export default class PanoMap extends HTMLElement {
	#map;
	#markers = new Map();
	#panoIcons = new Map();

	constructor() {
		super();
		new ResizeObserver(_ => this.#map.invalidateSize()).observe(this);
	}

	connectedCallback() {
		const map = L.map(this);
		addLayers(map);
		this.#map = map;
	}

	showItems(items) {
		this.#markers.clear();
		this.#panoIcons.clear();

		let group = L.markerClusterGroup({showCoverageOnHover:false, animate:false, maxClusterRadius:40});

		for (let item of items) { this.#buildMarker(item); }
		for (let marker of this.#markers.values()) { group.addLayer(marker); }

		this.#map.addLayer(group);

		let bounds = group.getBounds();
		if (bounds.isValid()) {
			this.#map.fitBounds(bounds);
		} else {
			this.#map.setView([0, 0], 2);
		}
	}

	getIcon(item) { return this.#panoIcons.get(item); }

	activate(item, options) {
		if (options.center) { this.#map.setView([item["GPSLatitude"], item["GPSLongitude"]], 17); }

		for (let [i, panoIcon] of this.#panoIcons.entries()) {
			panoIcon.classList.toggle("active", i == item);
		}

		let marker = this.#markers.get(item);
		if (!marker._icon) { marker.__parent.spiderfy(); }

		if (options.popup) { marker.openPopup(); }
	}

	highlight(item) {
		for (let [i, panoIcon] of this.#panoIcons.entries()) {
			panoIcon.classList.toggle("highlight", i == item);
		}
	}

	#dispatch(type, item) {
		let event = new CustomEvent(type, {detail:{item}});
		this.dispatchEvent(event);
	}

	#buildPopup(item) {
		let frag = document.createDocumentFragment();

		let name = document.createElement("a");
		let url = new URL(location.href);
		url.hash = item["SourceFile"];
		name.href = url.href;
		name.textContent = item["ImageDescription"] || "n/a";
		name.addEventListener("click", _ => this.#dispatch("pano-click", item));

		let date = document.createElement("div");
		date.append(dateFormat.format(new Date(item["CreateDate"] * 1000)));

		let altitude = document.createElement("div");
		altitude.append(`Altitude: ${item["GPSAltitude"]} m`);

		frag.append(name, date, altitude);
		return frag;
	}

	#buildMarker(item) {
		let panoIcon = new PanoIcon();
		panoIcon.addEventListener("mouseenter", _ => this.#dispatch("pano-over", item));
		panoIcon.addEventListener("mouseleave", _ => this.#dispatch("pano-out", item));

		let iconSize = [ICON_SIZE, ICON_SIZE];
		let popupAnchor = [0, -ICON_SIZE/2];
		let icon = L.divIcon({html:panoIcon, popupAnchor, iconSize, className:""});
		let marker = L.marker([item["GPSLatitude"], item["GPSLongitude"]], {title:item["ImageDescription"] || "", icon});
		marker.bindPopup(() => this.#buildPopup(item));

		this.#markers.set(item, marker);
		this.#panoIcons.set(item, panoIcon);
	}
}
customElements.define("pano-map", PanoMap);

import { MAPTILER_KEY } from "./config.js";
import PanoIcon, { SIZE as ICON_SIZE } from "./pano-icon.js";


const DPR = devicePixelRatio;
const dateFormat = new Intl.DateTimeFormat([], {dateStyle:"medium", timeStyle:"short"});
const littlePlanet = document.querySelector("little-planet");
const map = L.map("map");

let currentItem = null;

function showPano(item) {
	littlePlanet.src = item["SourceFile"];

	if (currentItem) {
		let { marker, panoIcon } = currentItem;
		if (marker._icon) { marker._icon.classList.remove("active"); }
		panoIcon.hideFov();
	}

	currentItem = item;
	let { marker } = item;
	if (!marker._icon) { marker.__parent.spiderfy(); }
	if (marker._icon) { marker._icon.classList.add("active"); }
}

function buildPopup(item) {
	let frag = document.createDocumentFragment();

	let name = document.createElement("a");
	let url = new URL(location.href);
	url.hash = item["SourceFile"];
	name.href = url.href;
	name.textContent = item["ImageDescription"] || "n/a";
	name.addEventListener("click", _ => showPano(item));

	let date = document.createElement("div");
	date.append(dateFormat.format(new Date(item["CreateDate"] * 1000)));

	let altitude = document.createElement("div");
	altitude.append(`Altitude: ${item["GPSAltitude"]} m`);

	frag.append(name, date, altitude);
	return frag;
}

function itemToMarker(item) {
	let panoIcon = new PanoIcon();
	let iconSize = [ICON_SIZE, ICON_SIZE];
	let popupAnchor = [0, -ICON_SIZE/2];
	let icon = L.divIcon({html:panoIcon, popupAnchor, iconSize, className:""});
	let marker = L.marker([item["GPSLatitude"], item["GPSLongitude"]], {title:item["ImageDescription"] || "", icon});
	item.marker = marker;
	item.panoIcon = panoIcon;
	marker.bindPopup(() => buildPopup(item));
	return marker;
}

function syncSize() {
	littlePlanet.width = littlePlanet.clientWidth * DPR;
	littlePlanet.height = littlePlanet.clientHeight * DPR;
	map.invalidateSize();
}

function fromURL(items) {
	let str = location.hash.substring(1);
	if (!str) { return; }

	let item = items.filter(item => item["SourceFile"] == str)[0];
	if (!item) { return; }

	map.setView([item["GPSLatitude"], item["GPSLongitude"]], 17);
	item.marker.openPopup();
	showPano(item);
}

function addLayers() {
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

async function init() {
	window.addEventListener("resize", syncSize);
	syncSize();
	addLayers();

	let response = await fetch("data.json");
	let data = await response.json();

	let group = L.markerClusterGroup({showCoverageOnHover:false, animate:false, maxClusterRadius:40});
	data.map(itemToMarker).forEach(m => group.addLayer(m));

	map.addLayer(group);

	let bounds = group.getBounds();
	if (bounds.isValid()) {
		map.fitBounds(bounds);
	} else {
		map.setView([0, 0], 2);
	}

	littlePlanet.addEventListener("change", e => {
		if (!currentItem) { return; }
		if (!("FlightYawDegree" in currentItem)) { return; }

		const { mode, camera } = e.target;
		switch (mode) {
			case "pano":
				let angle = camera.lon + Number(currentItem["FlightYawDegree"]);
				currentItem.panoIcon.drawFov(angle, camera.fov);
			break;

			case "planet":
				currentItem.panoIcon.hideFov();
			break;
		}
	});

	fromURL(data);
}

init();

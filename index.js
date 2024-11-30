import { MAPTILER_KEY } from "./config.js";
import PanoIcon, { SIZE as ICON_SIZE } from "./pano-icon.js";
import PanoScene from "./pano-scene.js";


const dateFormat = new Intl.DateTimeFormat([], {dateStyle:"medium", timeStyle:"short"});
const scene = document.querySelector("pano-scene");
const map = L.map("map");

let allItems = [];


function buildPopup(item) {
	let frag = document.createDocumentFragment();

	let name = document.createElement("a");
	let url = new URL(location.href);
	url.hash = item["SourceFile"];
	name.href = url.href;
	name.textContent = item["ImageDescription"] || "n/a";
	name.addEventListener("click", _ => scene.show(item, allItems));

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
	scene.syncSize();
	map.invalidateSize();
}

function fromURL() {
	let str = location.hash.substring(1);
	if (!str) { return; }

	let item = allItems.filter(item => item["SourceFile"] == str)[0];
	if (!item) { return; }

	map.setView([item["GPSLatitude"], item["GPSLongitude"]], 17);
	item.marker.openPopup();
	scene.show(item, allItems);
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
	allItems = await response.json();

	let group = L.markerClusterGroup({showCoverageOnHover:false, animate:false, maxClusterRadius:40});
	allItems.map(itemToMarker).forEach(m => group.addLayer(m));
	map.addLayer(group);

	let bounds = group.getBounds();
	if (bounds.isValid()) {
		map.fitBounds(bounds);
	} else {
		map.setView([0, 0], 2);
	}

	fromURL();
}

init();

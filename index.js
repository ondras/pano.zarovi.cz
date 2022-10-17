import { MAPTILER_KEY } from "./config.js";


const DPR = devicePixelRatio;
const dateFormat = new Intl.DateTimeFormat([], {dateStyle:"medium", timeStyle:"short"});
const littlePlanet = document.querySelector("little-planet");
const map = L.map("map");

let currentMarker = null;

function showPano(item, marker=null) {
	littlePlanet.src = item["SourceFile"];
	littlePlanet.mode = "planet";
	littlePlanet.camera = {lat:0, lon:0}; // FIXME hfov
	littlePlanet.classList.add("loading");

	if (currentMarker) { currentMarker._icon && currentMarker._icon.classList.remove("active"); }

	currentMarker = marker;
	if (currentMarker) { currentMarker._icon.classList.add("active"); }
}

function buildPopup(item, marker) {
	let frag = document.createDocumentFragment();

	let name = document.createElement("strong");
	name.textContent = item["ImageDescription"] || "n/a";
	name.addEventListener("click", _ => {
		showPano(item, marker);
		toURL(item);
	});

	let date = document.createElement("div");
	date.append(dateFormat.format(new Date(item["CreateDate"] * 1000)));

	let altitude = document.createElement("div");
	altitude.append(`Altitude: ${item["GPSAltitude"]} m`);

	frag.append(name, date, altitude);

	return frag;
}

function itemToMarker(item) {
	let marker = L.marker([item["GPSLatitude"], item["GPSLongitude"]]);
	marker.bindPopup(marker => buildPopup(item, marker));
	return marker;
}

function syncSize() {
	littlePlanet.width = littlePlanet.clientWidth * DPR;
	littlePlanet.height = littlePlanet.clientHeight * DPR;
	map.invalidateSize();
}

function removeLoading(e) {
	e.target.classList.remove("loading");
}

function toURL(item) {
	location.hash = item["SourceFile"];
}

function fromURL(items) {
	let str = location.hash.substring(1);
	if (!str) { return; }

	let item = items.filter(item => item["SourceFile"] == str)[0];
	if (!item) { return; }

	showPano(item);
}

async function init() {
	window.addEventListener("resize", syncSize);
	syncSize();

	littlePlanet.addEventListener("load", removeLoading);
	littlePlanet.addEventListener("error", removeLoading);

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

	let response = await fetch("data.json");
	let data = await response.json();

	let group = L.markerClusterGroup({showCoverageOnHover:false});
	data.map(itemToMarker).forEach(m => group.addLayer(m));

	map.addLayer(topo);
	map.addLayer(group);
	map.fitBounds(group.getBounds());

	fromURL(data);
}

init();

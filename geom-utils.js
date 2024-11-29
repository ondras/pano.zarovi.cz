const earth = 6378*1000;
const D2R = Math.PI/180;

export function great_circle_distance(item_from, item_to) {
	let lat1 = D2R*item_from["GPSLatitude"];
	let lon1 = D2R*item_from["GPSLongitude"];
	let lat2 = D2R*item_to["GPSLatitude"];
	let lon2 = D2R*item_to["GPSLongitude"];

	let dlat = lat2-lat1;
	let dlon = lon2-lon1;
	let a = Math.sin(dlat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlon/2)**2;
	return 2*earth*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function azimuth(item_from, item_to) {
	let lat1 = D2R*item_from["GPSLatitude"];
	let lon1 = D2R*item_from["GPSLongitude"];
	let lat2 = D2R*item_to["GPSLatitude"];
	let lon2 = D2R*item_to["GPSLongitude"];
	let dlat = lat2 - lat1;
	let dlon = lon2 - lon1;

	return Math.atan2(
		Math.sin(dlon)*Math.cos(lat2),
		Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dlat)
	);
}

export function angular_distance(item_from, item_to) {
	let lat1 = D2R*item_from["GPSLatitude"];
	let lon1 = D2R*item_from["GPSLongitude"];
	let lat2 = D2R*item_to["GPSLatitude"];
	let lon2 = D2R*item_to["GPSLongitude"];
	let dlon = lon2 - lon1;
	return Math.acos(
		Math.sin(lat1)*Math.sin(lat2) +
		Math.cos(lat1)*Math.cos(lat2)*Math.cos(dlon)
	);
}

export function vertical_azimuth_1(item_from, item_to) {
	let a1 = item_from["GPSAltitude"];
	let a2 = item_to["GPSAltitude"];
	let d = great_circle_distance(item_from, item_to);
	return -Math.atan((a1-a2)/d);
}

export function vertical_azimuth_2(item_from, item_to) {
	let phi = angular_distance(item_from, item_to);
	let a1 = item_from["GPSAltitude"];
	let a2 = item_to["GPSAltitude"];
	let A1 = a1 + earth;
	let A2 = a2 + earth;
	let D = Math.sqrt(A1**2 + A2**2 - 2*A1*A2*Math.cos(phi))
	return Math.acos((A2**2 - A1**2 - D**2)/(-2*A1*D)) - Math.PI/2;
}

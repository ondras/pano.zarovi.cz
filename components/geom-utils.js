const { sin, asin, cos, acos, tan, atan, atan2, sqrt, abs, PI } = Math;


const earth = 6378*1000;
const D2R = PI/180;

export function great_circle_distance(item_from, item_to) {
	let lat1 = D2R*item_from["GPSLatitude"];
	let lon1 = D2R*item_from["GPSLongitude"];
	let lat2 = D2R*item_to["GPSLatitude"];
	let lon2 = D2R*item_to["GPSLongitude"];

	let dlat = lat2-lat1;
	let dlon = lon2-lon1;
	let a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2;
	return 2*earth*atan2(sqrt(a), sqrt(1-a));
}

export function azimuth(item_from, item_to) {
	let lat1 = D2R*item_from["GPSLatitude"];
	let lon1 = D2R*item_from["GPSLongitude"];
	let lat2 = D2R*item_to["GPSLatitude"];
	let lon2 = D2R*item_to["GPSLongitude"];
	let dlat = lat2 - lat1;
	let dlon = lon2 - lon1;

	return atan2(
		sin(dlon)*cos(lat2),
		cos(lat1)*sin(lat2) - sin(lat1)*cos(lat2)*cos(dlat)
	);
}

export function angular_distance(item_from, item_to) {
	let lat1 = D2R*item_from["GPSLatitude"];
	let lon1 = D2R*item_from["GPSLongitude"];
	let lat2 = D2R*item_to["GPSLatitude"];
	let lon2 = D2R*item_to["GPSLongitude"];
	let dlon = lon2 - lon1;
	return acos(
		sin(lat1)*sin(lat2) +
		cos(lat1)*cos(lat2)*cos(dlon)
	);
}

export function vertical_azimuth_1(item_from, item_to) {
	let a1 = item_from["GPSAltitude"];
	let a2 = item_to["GPSAltitude"];
	let d = great_circle_distance(item_from, item_to);
	return -atan((a1-a2)/d);
}

export function vertical_azimuth_2(item_from, item_to) {
	let phi = angular_distance(item_from, item_to);
	let a1 = item_from["GPSAltitude"];
	let a2 = item_to["GPSAltitude"];
	let A1 = a1 + earth;
	let A2 = a2 + earth;
	let D = sqrt(A1**2 + A2**2 - 2*A1*A2*cos(phi))
	return acos((A2**2 - A1**2 - D**2)/(-2*A1*D)) - PI/2;
}

export function rotate_xy(point_r, rotation_r) {
	let { lon, lat } = point_r;
	lon += rotation_r.lon;

	let phi = rotation_r.lat;
	let lat_rotated = asin(cos(lat) * cos(lon) * sin(phi) + sin(lat) * cos(phi));
	let lon_rotated = atan2(
		cos(lat) * sin(lon),
		cos(lat) * cos(lon) * cos(phi) - sin(lat) * sin(phi)
	);

	return {
		lon: lon_rotated,
		lat: lat_rotated
	}
}

export function project_gnomonic(point_r, fov_r) {
	let x = tan(point_r.lon) / tan(fov_r.h);
	let y = tan(point_r.lat)/cos(point_r.lon) / tan(fov_r.v);

	return [(x+1)/2,(y+1)/2];
}

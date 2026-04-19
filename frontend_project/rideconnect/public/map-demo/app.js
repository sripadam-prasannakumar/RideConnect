// RideConnect Map System - Standalone (app.js)

// 1. Initial Locations (Simulation center)
const userStart = [17.3850, 78.4867]; // Hyderabad, India
const driverStart = [17.4000, 78.5000]; 

// 2. Map Setup
const map = L.map('map', {
    zoomControl: false,
    scrollWheelZoom: true
}).setView(userStart, 14);

// Tile Layer (Dark Mode)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 20
}).addTo(map);

// 3. Custom Icons
const createIcon = (url, size) => L.icon({
    iconUrl: url,
    iconSize: [size, size],
    iconAnchor: [size / 2, size]
});

const userIcon = createIcon('https://cdn-icons-png.flaticon.com/512/709/709722.png', 40);
const driverIcon = createIcon('https://cdn-icons-png.flaticon.com/512/3204/3204008.png', 50);
const pinIcon = createIcon('https://cdn-icons-png.flaticon.com/512/149/149059.png', 40);

// 4. Markers
const userMarker = L.marker(userStart, { icon: userIcon }).addTo(map).bindPopup("You are here");
const driverMarker = L.marker(driverStart, { icon: driverIcon }).addTo(map).bindPopup("Driver: Sarah J.");
const pickupMarker = L.marker(userStart, { icon: pinIcon }).addTo(map).bindPopup("Pickup point");

// 5. Routing (OSRM)
let routeLayer;
async function fetchRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
            if (routeLayer) map.removeLayer(routeLayer);
            routeLayer = L.geoJSON(data.routes[0].geometry, {
                style: { color: '#0dccf2', weight: 6, opacity: 0.6 }
            }).addTo(map);
            map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
        }
    } catch (e) { console.error("Routing error:", e); }
}

fetchRoute(driverStart, userStart);

// 6. Real-time User Tracking
if (navigator.geolocation) {
    navigator.geolocation.watchPosition((pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        userMarker.setLatLng(latlng);
        pickupMarker.setLatLng(latlng);
        // fetchRoute(driverMarker.getLatLng(), latlng); // Uncomment for continuous road update
    }, (err) => console.error(err), { enableHighAccuracy: true });
}

// 7. Simulation Mode
let currentDriverPos = [...driverStart];
function simulateMove() {
    const target = userMarker.getLatLng();
    const dLat = (target.lat - currentDriverPos[0]) / 100; // Divide by steps
    const dLng = (target.lng - currentDriverPos[1]) / 100;
    
    let step = 0;
    const interval = setInterval(() => {
        currentDriverPos[0] += dLat;
        currentDriverPos[1] += dLng;
        driverMarker.setLatLng(currentDriverPos);
        step++;
        if (step >= 100) clearInterval(interval);
    }, 100);
}

console.log("RideConnect Map System initialized.");

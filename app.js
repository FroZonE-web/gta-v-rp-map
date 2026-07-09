// Dimensions virtuelles de la carte. Si votre image est déformée, ajustez ces valeurs.
const MAP_WIDTH = 8192;
const MAP_HEIGHT = 8192;
const imageUrl = "assets/gta-v-map.jpg";
const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];

const map = L.map("map", {
  crs: L.CRS.Simple,
  minZoom: -4,
  maxZoom: 2,
  zoomSnap: 0.25,
  attributionControl: false
});

L.imageOverlay(imageUrl, bounds).addTo(map);
map.fitBounds(bounds);

const iconByCategory = {
  police: "🚓",
  ems: "🚑",
  entreprise: "🏢",
  gang: "🔴",
  event: "🎭",
  autre: "📍"
};

const markersLayer = L.layerGroup().addTo(map);
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  draw: {
    marker: false,
    circle: false,
    circlemarker: false,
    polyline: true,
    polygon: true,
    rectangle: true
  },
  edit: { featureGroup: drawnItems }
});
map.addControl(drawControl);
map.on(L.Draw.Event.CREATED, event => drawnItems.addLayer(event.layer));

let places = [...(window.PLACES || [])];
let pendingClick = null;

function percentToLatLng(x, y) {
  return [MAP_HEIGHT * y / 100, MAP_WIDTH * x / 100];
}

function latLngToPercent(latlng) {
  return {
    x: +(latlng.lng / MAP_WIDTH * 100).toFixed(2),
    y: +(latlng.lat / MAP_HEIGHT * 100).toFixed(2)
  };
}

function makeIcon(category) {
  return L.divIcon({
    className: "rp-marker",
    html: `<span>${iconByCategory[category] || "📍"}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}

function renderMarkers() {
  markersLayer.clearLayers();
  const active = new Set([...document.querySelectorAll(".filter:checked")].map(el => el.value));
  places.filter(place => active.has(place.category)).forEach(place => {
    const marker = L.marker(percentToLatLng(place.x, place.y), { icon: makeIcon(place.category) });
    marker.bindPopup(`
      <strong>${place.name}</strong><br>
      <em>${place.category}</em><br>
      <p>${place.description || "Aucune description."}</p>
      <small>x: ${place.x} / y: ${place.y}</small>
    `);
    marker.addTo(markersLayer);
  });
}

map.on("click", e => {
  pendingClick = e.latlng;
  document.getElementById("place-name").focus();
});

document.getElementById("place-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!pendingClick) {
    alert("Clique d'abord sur la carte pour choisir l'emplacement.");
    return;
  }

  const coords = latLngToPercent(pendingClick);
  places.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: document.getElementById("place-name").value,
    category: document.getElementById("place-category").value,
    description: document.getElementById("place-description").value,
    x: coords.x,
    y: coords.y
  });

  event.target.reset();
  pendingClick = null;
  renderMarkers();
});

document.querySelectorAll(".filter").forEach(input => input.addEventListener("change", renderMarkers));

document.getElementById("export-json").addEventListener("click", () => {
  const content = "window.PLACES = " + JSON.stringify(places, null, 2) + ";\n";
  const blob = new Blob([content], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "places.js";
  a.click();
  URL.revokeObjectURL(url);
});

renderMarkers();

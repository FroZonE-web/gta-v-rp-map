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
  edit: {
    featureGroup: drawnItems
  }
});

map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, event => {
  drawnItems.addLayer(event.layer);
});

let places = [];
let pendingClick = null;

function getPlayerName() {
  let name = localStorage.getItem("rp_player_name");

  if (!name) {
    name = prompt("Entre ton pseudo RP :");

    if (!name || !name.trim()) {
      name = "Anonyme";
    }

    localStorage.setItem("rp_player_name", name.trim());
  }

  const playerNameElement = document.getElementById("player-name");

  if (playerNameElement) {
    playerNameElement.textContent = name;
  }

  return name;
}

let playerName = getPlayerName();

const changeNameButton = document.getElementById("change-name");

if (changeNameButton) {
  changeNameButton.addEventListener("click", () => {
    const newName = prompt("Nouveau pseudo RP :", playerName);

    if (newName && newName.trim()) {
      playerName = newName.trim();
      localStorage.setItem("rp_player_name", playerName);

      const playerNameElement = document.getElementById("player-name");

      if (playerNameElement) {
        playerNameElement.textContent = playerName;
      }
    }
  });
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

  const activeCategories = new Set(
    [...document.querySelectorAll(".filter:checked")].map(input => input.value)
  );

  places
    .filter(place => activeCategories.has(place.category))
    .forEach(place => {
      const marker = L.marker([place.lat, place.lng], {
        icon: makeIcon(place.category)
      });

      marker.bindPopup(`
        <strong>${place.name}</strong><br>
        <em>${place.category}</em><br>
        <p>${place.description || "Aucune description."}</p>
        <small>Ajouté par : ${place.author || "Inconnu"}</small><br>
        <small>lat : ${Math.round(place.lat)} / lng : ${Math.round(place.lng)}</small>
      `);

      marker.addTo(markersLayer);
    });
}

async function loadMarkers() {
  const { data, error } = await supabaseClient
    .from("markers")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    alert("Erreur chargement Supabase : " + error.message);
    console.error(error);
    return;
  }

  places = data || [];
  renderMarkers();
}

async function addMarker(place) {
  const { error } = await supabaseClient
    .from("markers")
    .insert([place]);

  if (error) {
    alert("Erreur ajout Supabase : " + error.message);
    console.error(error);
    return false;
  }

  return true;
}

map.on("click", event => {
  pendingClick = event.latlng;

  const nameInput = document.getElementById("place-name");

  if (nameInput) {
    nameInput.focus();
  }
});

const placeForm = document.getElementById("place-form");

if (placeForm) {
  placeForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!pendingClick) {
      alert("Clique d'abord sur la carte pour choisir l'emplacement.");
      return;
    }

    const place = {
      name: document.getElementById("place-name").value,
      category: document.getElementById("place-category").value,
      description: document.getElementById("place-description").value,
      lat: pendingClick.lat,
      lng: pendingClick.lng,
      author: playerName
    };

    const success = await addMarker(place);

    if (success) {
      event.target.reset();
      pendingClick = null;
    }
  });
}

document.querySelectorAll(".filter").forEach(input => {
  input.addEventListener("change", renderMarkers);
});

supabaseClient
  .channel("markers-realtime")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "markers"
    },
    () => {
      loadMarkers();
    }
  )
  .subscribe();

loadMarkers();
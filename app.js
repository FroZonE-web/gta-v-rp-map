"use strict";

/* =========================================================
   CONFIGURATION DE LA CARTE
   ========================================================= */

const MAP_WIDTH = 8192;
const MAP_HEIGHT = 8192;
const MAP_IMAGE_URL = "assets/gta-v-map.jpg";
const MAP_BOUNDS = [
  [0, 0],
  [MAP_HEIGHT, MAP_WIDTH]
];

/* =========================================================
   CATÉGORIES
   Pour ajouter une catégorie plus tard, il suffira
   principalement de la déclarer ici.
   ========================================================= */

const CATEGORIES = {
  police: {
    label: "Police / Justice",
    icon: "🚓",
    subcategories: []
  },

  ems: {
    label: "EMS",
    icon: "🚑",
    subcategories: []
  },

  entreprise: {
    label: "Entreprises",
    icon: "🏢",
    subcategories: []
  },

  production: {
    label: "Production",
    icon: "🌱",
    subcategories: [
      "Zeed",
      "Viande",
      "Champignons"
    ]
  },

  habitation: {
    label: "Habitations",
    icon: "🏠",
    subcategories: []
  },

  gang: {
    label: "Gang",
    icon: "👥",
    subcategories: [
      "B2MC",
      "Mirrage",
      "Obsidian",
      "Glory",
      "88ers",
      "G7"
    ]
  },

  zone_interdite: {
    label: "Zone interdite",
    icon: "⛔",
    subcategories: []
  },

  event: {
    label: "Événements",
    icon: "🎭",
    subcategories: []
  },

  autre: {
    label: "Autres",
    icon: "📍",
    subcategories: []
  }
};

/* =========================================================
   ÉLÉMENTS HTML
   ========================================================= */

const playerNameElement = document.getElementById("player-name");
const changeNameButton = document.getElementById("change-name");

const filtersContainer = document.getElementById("filters-container");

const placeForm = document.getElementById("place-form");
const placeNameInput = document.getElementById("place-name");
const placeCategorySelect = document.getElementById("place-category");
const placeDescriptionInput = document.getElementById("place-description");

const subcategoryField = document.getElementById("subcategory-field");
const placeSubcategorySelect =
  document.getElementById("place-subcategory");

const locationStatus = document.getElementById("location-status");
const addMarkerButton = document.getElementById("add-marker-button");

const exportButton = document.getElementById("export-json");
const notificationElement = document.getElementById("notification");

/* =========================================================
   ÉTAT DE L’APPLICATION
   ========================================================= */

let places = [];
let pendingClick = null;
let playerName = "";

/* =========================================================
   CRÉATION DE LA CARTE LEAFLET
   ========================================================= */

const map = L.map("map", {
  crs: L.CRS.Simple,
  minZoom: -4,
  maxZoom: 2,
  zoomSnap: 0.25,
  attributionControl: false
});

L.imageOverlay(MAP_IMAGE_URL, MAP_BOUNDS).addTo(map);
map.fitBounds(MAP_BOUNDS);

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

map.on(L.Draw.Event.CREATED, (event) => {
  drawnItems.addLayer(event.layer);
});

/* =========================================================
   OUTILS DE SÉCURISATION DU TEXTE
   Empêche du HTML indésirable dans les noms et descriptions.
   ========================================================= */

function escapeHtml(value) {
  const text = String(value ?? "");

  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

let notificationTimeout = null;

function showNotification(message, type = "success") {
  if (!notificationElement) {
    return;
  }

  window.clearTimeout(notificationTimeout);

  notificationElement.textContent = message;
  notificationElement.className = `notification notification-${type}`;
  notificationElement.hidden = false;

  notificationTimeout = window.setTimeout(() => {
    notificationElement.hidden = true;
  }, 4000);
}

/* =========================================================
   PSEUDO DU JOUEUR
   ========================================================= */

function askForPlayerName(defaultValue = "") {
  const answer = window.prompt(
    "Entre ton pseudo RP :",
    defaultValue
  );

  if (!answer || !answer.trim()) {
    return defaultValue || "Anonyme";
  }

  return answer.trim().slice(0, 50);
}

function initializePlayerName() {
  const savedName = localStorage.getItem("rp_player_name");

  if (savedName && savedName.trim()) {
    playerName = savedName.trim();
  } else {
    playerName = askForPlayerName();
    localStorage.setItem("rp_player_name", playerName);
  }

  playerNameElement.textContent = playerName;
}

changeNameButton.addEventListener("click", () => {
  const newName = askForPlayerName(playerName);

  if (!newName) {
    return;
  }

  playerName = newName;
  localStorage.setItem("rp_player_name", playerName);
  playerNameElement.textContent = playerName;

  showNotification(`Pseudo modifié : ${playerName}`);
});

/* =========================================================
   MENU DES CATÉGORIES
   ========================================================= */

function createCategoryOptions() {
  placeCategorySelect.innerHTML = "";

  for (const [categoryKey, categoryData] of Object.entries(CATEGORIES)) {
    const option = document.createElement("option");

    option.value = categoryKey;
    option.textContent =
      `${categoryData.icon} ${categoryData.label}`;

    placeCategorySelect.appendChild(option);
  }

  updateSubcategorySelect();
}

function updateSubcategorySelect() {
  const categoryKey = placeCategorySelect.value;
  const categoryData = CATEGORIES[categoryKey];

  placeSubcategorySelect.innerHTML = "";

  if (
    !categoryData ||
    !Array.isArray(categoryData.subcategories) ||
    categoryData.subcategories.length === 0
  ) {
    subcategoryField.hidden = true;
    placeSubcategorySelect.required = false;
    return;
  }

  subcategoryField.hidden = false;
  placeSubcategorySelect.required = true;

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Choisir une sous-catégorie";
  emptyOption.disabled = true;
  emptyOption.selected = true;

  placeSubcategorySelect.appendChild(emptyOption);

  for (const subcategory of categoryData.subcategories) {
    const option = document.createElement("option");

    option.value = subcategory;
    option.textContent = subcategory;

    placeSubcategorySelect.appendChild(option);
  }
}

placeCategorySelect.addEventListener(
  "change",
  updateSubcategorySelect
);

/* =========================================================
   FILTRES
   ========================================================= */

function createFilters() {
  filtersContainer.innerHTML = "";

  for (const [categoryKey, categoryData] of Object.entries(CATEGORIES)) {
    const categoryBlock = document.createElement("div");
    categoryBlock.className = "filter-group";

    const categoryLabel = document.createElement("label");
    categoryLabel.className = "filter-category";

    const categoryCheckbox = document.createElement("input");
    categoryCheckbox.type = "checkbox";
    categoryCheckbox.className = "category-filter";
    categoryCheckbox.value = categoryKey;
    categoryCheckbox.checked = true;

    categoryLabel.appendChild(categoryCheckbox);

    const categoryText = document.createElement("span");
    categoryText.textContent =
      `${categoryData.icon} ${categoryData.label}`;

    categoryLabel.appendChild(categoryText);
    categoryBlock.appendChild(categoryLabel);

    if (categoryData.subcategories.length > 0) {
      const childrenContainer = document.createElement("div");
      childrenContainer.className = "subcategory-filters";

      for (const subcategory of categoryData.subcategories) {
        const childLabel = document.createElement("label");
        childLabel.className = "filter-subcategory";

        const childCheckbox = document.createElement("input");
        childCheckbox.type = "checkbox";
        childCheckbox.className = "subcategory-filter";
        childCheckbox.dataset.category = categoryKey;
        childCheckbox.value = subcategory;
        childCheckbox.checked = true;

        childLabel.appendChild(childCheckbox);

        const childText = document.createElement("span");
        childText.textContent = subcategory;

        childLabel.appendChild(childText);
        childrenContainer.appendChild(childLabel);
      }

      categoryBlock.appendChild(childrenContainer);

      categoryCheckbox.addEventListener("change", () => {
        const childCheckboxes =
          childrenContainer.querySelectorAll(".subcategory-filter");

        childCheckboxes.forEach((checkbox) => {
          checkbox.checked = categoryCheckbox.checked;
        });

        renderMarkers();
      });
    } else {
      categoryCheckbox.addEventListener("change", renderMarkers);
    }

    filtersContainer.appendChild(categoryBlock);
  }

  document
    .querySelectorAll(".subcategory-filter")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        synchronizeParentCategoryFilter(checkbox.dataset.category);
        renderMarkers();
      });
    });
}

function synchronizeParentCategoryFilter(categoryKey) {
  const parentCheckbox = document.querySelector(
    `.category-filter[value="${categoryKey}"]`
  );

  const childCheckboxes = Array.from(
    document.querySelectorAll(
      `.subcategory-filter[data-category="${categoryKey}"]`
    )
  );

  if (!parentCheckbox || childCheckboxes.length === 0) {
    return;
  }

  const selectedChildren = childCheckboxes.filter(
    (checkbox) => checkbox.checked
  );

  parentCheckbox.checked = selectedChildren.length > 0;
  parentCheckbox.indeterminate =
    selectedChildren.length > 0 &&
    selectedChildren.length < childCheckboxes.length;
}

function isPlaceVisible(place) {
  const categoryCheckbox = document.querySelector(
    `.category-filter[value="${place.category}"]`
  );

  if (!categoryCheckbox || !categoryCheckbox.checked) {
    return false;
  }

  const categoryData = CATEGORIES[place.category];

  if (
    !categoryData ||
    categoryData.subcategories.length === 0
  ) {
    return true;
  }

  /*
   * Les anciens marqueurs Gang ont subcategory = NULL.
   * Ils restent visibles dès que leur catégorie principale
   * est activée.
   */
  if (!place.subcategory) {
    return true;
  }

  const subcategoryCheckbox = Array.from(
    document.querySelectorAll(
      `.subcategory-filter[data-category="${place.category}"]`
    )
  ).find((checkbox) => checkbox.value === place.subcategory);

  /*
   * Une sous-catégorie inconnue reste visible.
   * Cela évite de perdre visuellement d’anciennes données.
   */
  if (!subcategoryCheckbox) {
    return true;
  }

  return subcategoryCheckbox.checked;
}

/* =========================================================
   MARQUEURS
   ========================================================= */

function makeMarkerIcon(categoryKey) {
  const categoryData = CATEGORIES[categoryKey];
  const icon = categoryData?.icon || "📍";

  return L.divIcon({
    className: "rp-marker",
    html: `<span>${icon}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -18]
  });
}

function getCategoryLabel(categoryKey) {
  return CATEGORIES[categoryKey]?.label || categoryKey || "Inconnue";
}

function createPopupContent(place) {
  const categoryData = CATEGORIES[place.category];

  const icon = categoryData?.icon || "📍";
  const categoryLabel = getCategoryLabel(place.category);

  const subcategoryLine = place.subcategory
    ? `
      <div class="popup-row">
        <span>Sous-catégorie</span>
        <strong>${escapeHtml(place.subcategory)}</strong>
      </div>
    `
    : "";

  const description = place.description
    ? escapeHtml(place.description).replaceAll("\n", "<br>")
    : "Aucune description.";

  const createdDate = place.created_at
    ? new Date(place.created_at).toLocaleString("fr-FR")
    : "Date inconnue";

  return `
    <article class="marker-popup">
      <header class="marker-popup-header">
        <span class="marker-popup-icon">${icon}</span>

        <div>
          <h3>${escapeHtml(place.name)}</h3>
          <p>${escapeHtml(categoryLabel)}</p>
        </div>
      </header>

      ${subcategoryLine}

      <div class="popup-description">
        ${description}
      </div>

      <footer class="marker-popup-footer">
        <span>
          Ajouté par
          <strong>${escapeHtml(place.author || "Inconnu")}</strong>
        </span>

        <span>${escapeHtml(createdDate)}</span>
      </footer>
    </article>
  `;
}

function renderMarkers() {
  markersLayer.clearLayers();

  for (const place of places) {
    if (!isPlaceVisible(place)) {
      continue;
    }

    const latitude = Number(place.lat);
    const longitude = Number(place.lng);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      console.warn(
        "Marqueur ignoré car ses coordonnées sont invalides :",
        place
      );

      continue;
    }

    const marker = L.marker(
      [latitude, longitude],
      {
        icon: makeMarkerIcon(place.category)
      }
    );

    marker.bindPopup(
      createPopupContent(place),
      {
        maxWidth: 340
      }
    );

    marker.addTo(markersLayer);
  }
}

/* =========================================================
   SUPABASE
   ========================================================= */

async function loadMarkers() {
  const { data, error } = await supabaseClient
    .from("markers")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erreur de chargement Supabase :", error);

    showNotification(
      `Impossible de charger les marqueurs : ${error.message}`,
      "error"
    );

    return;
  }

  places = Array.isArray(data) ? data : [];
  renderMarkers();
}

async function addMarker(place) {
  addMarkerButton.disabled = true;
  addMarkerButton.textContent = "Enregistrement...";

  const { data, error } = await supabaseClient
    .from("markers")
    .insert([place])
    .select()
    .single();

  addMarkerButton.disabled = false;
  addMarkerButton.textContent = "Ajouter le marqueur";

  if (error) {
    console.error("Erreur d’ajout Supabase :", error);

    showNotification(
      `Impossible d’ajouter le marqueur : ${error.message}`,
      "error"
    );

    return null;
  }

  return data;
}

/* =========================================================
   SÉLECTION DE L’EMPLACEMENT
   ========================================================= */

map.on("click", (event) => {
  pendingClick = event.latlng;

  locationStatus.textContent =
    `Emplacement sélectionné — lat ${Math.round(
      pendingClick.lat
    )}, lng ${Math.round(pendingClick.lng)}`;

  locationStatus.classList.add("location-selected");
  placeNameInput.focus();
});

/* =========================================================
   AJOUT D’UN MARQUEUR
   ========================================================= */

placeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!pendingClick) {
    showNotification(
      "Clique d’abord sur la carte pour choisir l’emplacement.",
      "error"
    );

    return;
  }

  const name = placeNameInput.value.trim();
  const category = placeCategorySelect.value;

  const categoryData = CATEGORIES[category];

  let subcategory = null;

  if (
    categoryData &&
    categoryData.subcategories.length > 0
  ) {
    subcategory = placeSubcategorySelect.value || null;

    if (!subcategory) {
      showNotification(
        "Choisis une sous-catégorie.",
        "error"
      );

      return;
    }
  }

  const place = {
    name,
    category,
    subcategory,
    description: placeDescriptionInput.value.trim(),
    lat: pendingClick.lat,
    lng: pendingClick.lng,
    author: playerName
  };

  const insertedPlace = await addMarker(place);

  if (!insertedPlace) {
    return;
  }

  /*
   * On ajoute immédiatement le résultat à l’écran.
   * Le temps réel actualisera ensuite la liste complète.
   */
  places.push(insertedPlace);
  renderMarkers();

  placeForm.reset();
  createCategoryOptions();

  pendingClick = null;

  locationStatus.textContent =
    "Clique sur la carte pour choisir un emplacement.";

  locationStatus.classList.remove("location-selected");

  showNotification(
    `Le marqueur « ${insertedPlace.name} » a été ajouté.`
  );
});

/* =========================================================
   EXPORT JSON DE SÉCURITÉ
   ========================================================= */

exportButton.addEventListener("click", () => {
  const exportData = {
    exported_at: new Date().toISOString(),
    marker_count: places.length,
    markers: places
  };

  const blob = new Blob(
    [JSON.stringify(exportData, null, 2)],
    {
      type: "application/json"
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    `atlas-rp-markers-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showNotification(
    `${places.length} marqueur(s) exporté(s).`
  );
});

/* =========================================================
   TEMPS RÉEL
   ========================================================= */

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
  .subscribe((status) => {
    console.log("Statut Supabase Realtime :", status);
  });

/* =========================================================
   DÉMARRAGE
   ========================================================= */

async function initializeApplication() {
  initializePlayerName();
  createCategoryOptions();
  createFilters();
  await loadMarkers();
}

initializeApplication();
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
      "Obsidian",
      "Glory",
      "B2MC",
      "G7",
      "88ers",
      "Mirrage"
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

const ZONE_COLORS = {
  gang: {
    Obsidian: "#111111",
    Glory: "#FFFFFF",
    B2MC: "#6F4E37",
    G7: "#4FC3F7",
    "88ers": "#39FF14",
    Mirrage: "#D50000"
  },
  production: {
    Zeed: "#228B22",
    Viande: "#8A0303",
    Champignons: "#0F6A73"
  },
  habitation: { default: "#C792EA" },
  zone_interdite: { default: "#FF8C00" },
  autre: { default: "#708090" }
};

/* =========================================================
   ÉLÉMENTS HTML
   ========================================================= */

const playerNameElement =
  document.getElementById("player-name");

const changeNameButton =
  document.getElementById("change-name");

const filtersContainer =
  document.getElementById("filters-container");

const placeForm =
  document.getElementById("place-form");

const placeNameInput =
  document.getElementById("place-name");

const placeCategorySelect =
  document.getElementById("place-category");

const placeDescriptionInput =
  document.getElementById("place-description");

const subcategoryField =
  document.getElementById("subcategory-field");

const placeSubcategorySelect =
  document.getElementById("place-subcategory");

const locationStatus =
  document.getElementById("location-status");

const addMarkerButton =
  document.getElementById("add-marker-button");

const exportButton =
  document.getElementById("export-json");

const notificationElement =
  document.getElementById("notification");

const placeSearchInput =
  document.getElementById("place-search");

const clearSearchButton =
  document.getElementById("clear-search");

const searchResultsContainer =
  document.getElementById("search-results");

const visibleMarkerCountElement =
  document.getElementById("visible-marker-count");

const favoriteCountElement =
  document.getElementById("favorite-count");

const favoritesOnlyCheckbox =
  document.getElementById("favorites-only");

const favoritesListContainer =
  document.getElementById("favorites-list");

const adminBadge = document.getElementById("admin-badge");
const adminLoginForm = document.getElementById("admin-login-form");
const adminEmailInput = document.getElementById("admin-email");
const adminPasswordInput = document.getElementById("admin-password");
const adminLoginButton = document.getElementById("admin-login-button");
const adminSession = document.getElementById("admin-session");
const adminEmailDisplay = document.getElementById("admin-email-display");
const adminLogoutButton = document.getElementById("admin-logout-button");

const zoneForm = document.getElementById("zone-form");
const zoneNameInput = document.getElementById("zone-name");
const zoneCategorySelect = document.getElementById("zone-category");
const zoneSubcategoryField = document.getElementById("zone-subcategory-field");
const zoneSubcategorySelect = document.getElementById("zone-subcategory");
const zoneDescriptionInput = document.getElementById("zone-description");
const zoneStatus = document.getElementById("zone-status");
const zoneColorPreview = document.getElementById("zone-color-preview");
const saveZoneButton = document.getElementById("save-zone-button");
const cancelZoneButton = document.getElementById("cancel-zone-button");
const showZonesCheckbox = document.getElementById("show-zones");
const zoneCountElement = document.getElementById("zone-count");

/* =========================================================
   ÉTAT DE L’APPLICATION
   ========================================================= */

let places = [];
let pendingClick = null;
let playerName = "";
let currentSearch = "";
let favoriteIds = new Set();
let adminUser = null;
let isAdmin = false;
let movingMarkerId = null;
let zones = [];
let pendingZoneLayer = null;
let isDrawingZone = false;

const markerInstances = new Map();
const zoneInstances = new Map();

/* =========================================================
   CRÉATION DE LA CARTE
   ========================================================= */

const map = L.map("map", {
  crs: L.CRS.Simple,
  minZoom: -4,
  maxZoom: 2,
  zoomSnap: 0.25,
  attributionControl: false
});

L.imageOverlay(
  MAP_IMAGE_URL,
  MAP_BOUNDS
).addTo(map);

map.fitBounds(MAP_BOUNDS);

const markersLayer = L.layerGroup().addTo(map);

const zonesLayer = L.layerGroup().addTo(map);
const temporaryZoneLayer = L.layerGroup().addTo(map);

const drawControl = new L.Control.Draw({
  draw: {
    marker: false,
    circle: false,
    circlemarker: false,
    polyline: false,
    polygon: {
      allowIntersection: false,
      showArea: true,
      shapeOptions: { color: "#3273ea", weight: 3, fillOpacity: 0.22 }
    },
    rectangle: {
      shapeOptions: { color: "#3273ea", weight: 3, fillOpacity: 0.22 }
    }
  },
  edit: false
});

map.addControl(drawControl);
map.on(L.Draw.Event.DRAWSTART, () => { isDrawingZone = true; });
map.on(L.Draw.Event.DRAWSTOP, () => { window.setTimeout(() => { isDrawingZone = false; }, 100); });
map.on(L.Draw.Event.CREATED, (event) => {
  cancelPendingZone(false);
  pendingZoneLayer = event.layer;
  temporaryZoneLayer.addLayer(pendingZoneLayer);
  zoneForm.hidden = false;
  zoneStatus.textContent = "Forme prête : complète les informations puis enregistre.";
  zoneStatus.classList.add("location-selected");
  updateZoneSubcategorySelect();
  applyPendingZoneStyle();
  zoneNameInput.focus();
});

/* =========================================================
   OUTILS
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

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getPlaceIdentifier(place, index = 0) {
  if (place.id !== null && place.id !== undefined) {
    return String(place.id);
  }

  return [
    place.name,
    place.lat,
    place.lng,
    index
  ].join("-");
}

function getCategoryData(categoryKey) {
  return CATEGORIES[categoryKey] || {
    label: categoryKey || "Inconnue",
    icon: "📍",
    subcategories: []
  };
}

function getCategoryLabel(categoryKey) {
  return getCategoryData(categoryKey).label;
}

function getCategoryIcon(categoryKey) {
  return getCategoryData(categoryKey).icon;
}

function loadFavorites() {
  try {
    const savedFavorites = JSON.parse(
      localStorage.getItem("atlas_rp_favorites") || "[]"
    );

    favoriteIds = new Set(
      Array.isArray(savedFavorites)
        ? savedFavorites.map(String)
        : []
    );
  } catch (error) {
    console.warn("Favoris invalides dans le navigateur :", error);
    favoriteIds = new Set();
  }
}

function saveFavorites() {
  localStorage.setItem(
    "atlas_rp_favorites",
    JSON.stringify(Array.from(favoriteIds))
  );
}

function isFavorite(place, index = 0) {
  return favoriteIds.has(getPlaceIdentifier(place, index));
}

function toggleFavorite(identifier) {
  const id = String(identifier);

  if (favoriteIds.has(id)) {
    favoriteIds.delete(id);
    showNotification("Lieu retiré des favoris.");
  } else {
    favoriteIds.add(id);
    showNotification("Lieu ajouté aux favoris.");
  }

  saveFavorites();
  refreshInterface();
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

let notificationTimeout = null;

function showNotification(
  message,
  type = "success"
) {
  if (!notificationElement) {
    return;
  }

  window.clearTimeout(notificationTimeout);

  notificationElement.textContent = message;

  notificationElement.className =
    `notification notification-${type}`;

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
  const savedName =
    localStorage.getItem("rp_player_name");

  if (savedName && savedName.trim()) {
    playerName = savedName.trim();
  } else {
    playerName = askForPlayerName();

    localStorage.setItem(
      "rp_player_name",
      playerName
    );
  }

  playerNameElement.textContent = playerName;
}

changeNameButton.addEventListener("click", () => {
  const newName =
    askForPlayerName(playerName);

  if (!newName) {
    return;
  }

  playerName = newName;

  localStorage.setItem(
    "rp_player_name",
    playerName
  );

  playerNameElement.textContent = playerName;

  showNotification(
    `Pseudo modifié : ${playerName}`
  );
});

/* =========================================================
   ADMINISTRATION
   ========================================================= */

function updateAdminInterface() {
  adminLoginForm.hidden = isAdmin;
  adminSession.hidden = !isAdmin;
  adminBadge.textContent = isAdmin ? "Admin connecté" : "Déconnecté";
  adminBadge.classList.toggle("is-connected", isAdmin);
  adminEmailDisplay.textContent = adminUser?.email || "";
  refreshInterface();
}

async function checkAdminSession() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  adminUser = sessionData.session?.user || null;
  isAdmin = false;

  if (adminUser) {
    const { data, error } = await supabaseClient.rpc("is_admin");
    if (error) {
      console.error("Vérification admin impossible :", error);
    } else {
      isAdmin = data === true;
    }
  }

  updateAdminInterface();
}

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminLoginButton.disabled = true;
  adminLoginButton.textContent = "Connexion...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: adminEmailInput.value.trim(),
    password: adminPasswordInput.value
  });

  adminLoginButton.disabled = false;
  adminLoginButton.textContent = "Se connecter";

  if (error) {
    showNotification(`Connexion refusée : ${error.message}`, "error");
    return;
  }

  adminUser = data.user;
  const { data: allowed, error: roleError } = await supabaseClient.rpc("is_admin");

  if (roleError || allowed !== true) {
    await supabaseClient.auth.signOut();
    adminUser = null;
    isAdmin = false;
    updateAdminInterface();
    showNotification("Ce compte n'est pas autorisé comme administrateur.", "error");
    return;
  }

  isAdmin = true;
  adminPasswordInput.value = "";
  updateAdminInterface();
  showNotification("Connexion administrateur réussie.");
});

adminLogoutButton.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  adminUser = null;
  isAdmin = false;
  movingMarkerId = null;
  updateAdminInterface();
  showNotification("Administrateur déconnecté.");
});

supabaseClient.auth.onAuthStateChange(() => {
  window.setTimeout(checkAdminSession, 0);
});

function findPlaceByIdentifier(identifier) {
  return places.find((place, index) =>
    getPlaceIdentifier(place, index) === String(identifier)
  );
}

async function updateMarkerRecord(id, changes) {
  const { error } = await supabaseClient
    .from("markers")
    .update(changes)
    .eq("id", id);

  if (error) {
    showNotification(`Modification impossible : ${error.message}`, "error");
    return false;
  }

  await loadMarkers();
  return true;
}

async function editMarker(identifier) {
  if (!isAdmin) return;
  const place = findPlaceByIdentifier(identifier);
  if (!place) return;

  const name = window.prompt("Nom du lieu :", place.name || "");
  if (name === null || !name.trim()) return;

  const categoryList = Object.keys(CATEGORIES).join(", ");
  const categoryAnswer = window.prompt(
    `Catégorie (${categoryList}) :`,
    place.category || "autre"
  );
  if (categoryAnswer === null) return;
  const category = categoryAnswer.trim();
  if (!CATEGORIES[category]) {
    showNotification("Catégorie inconnue.", "error");
    return;
  }

  let subcategory = null;
  const subs = CATEGORIES[category].subcategories;
  if (subs.length > 0) {
    const subAnswer = window.prompt(
      `Sous-catégorie (${subs.join(", ")}) :`,
      place.subcategory || subs[0]
    );
    if (subAnswer === null) return;
    subcategory = subAnswer.trim();
    if (!subs.includes(subcategory)) {
      showNotification("Sous-catégorie inconnue.", "error");
      return;
    }
  }

  const description = window.prompt(
    "Description :",
    place.description || ""
  );
  if (description === null) return;

  const success = await updateMarkerRecord(place.id, {
    name: name.trim(),
    category,
    subcategory,
    description: description.trim()
  });

  if (success) showNotification("Marqueur modifié.");
}

function startMovingMarker(identifier) {
  if (!isAdmin) return;
  const place = findPlaceByIdentifier(identifier);
  if (!place) return;
  movingMarkerId = place.id;
  map.closePopup();
  locationStatus.textContent = `Déplacement de « ${place.name} » : clique sur sa nouvelle position.`;
  locationStatus.classList.add("location-selected", "admin-moving");
  showNotification("Clique sur la nouvelle position du marqueur.");
}

async function deleteMarker(identifier) {
  if (!isAdmin) return;
  const place = findPlaceByIdentifier(identifier);
  if (!place) return;

  if (!window.confirm(`Supprimer définitivement « ${place.name} » ?`)) return;

  const { error } = await supabaseClient
    .from("markers")
    .delete()
    .eq("id", place.id);

  if (error) {
    showNotification(`Suppression impossible : ${error.message}`, "error");
    return;
  }

  favoriteIds.delete(String(place.id));
  saveFavorites();
  await loadMarkers();
  showNotification("Marqueur supprimé.");
}

/* =========================================================
   MENU DES CATÉGORIES
   ========================================================= */

function createCategoryOptions() {
  placeCategorySelect.innerHTML = "";

  for (
    const [categoryKey, categoryData]
    of Object.entries(CATEGORIES)
  ) {
    const option =
      document.createElement("option");

    option.value = categoryKey;

    option.textContent =
      `${categoryData.icon} ${categoryData.label}`;

    placeCategorySelect.appendChild(option);
  }

  updateSubcategorySelect();
}

function updateSubcategorySelect() {
  const categoryKey =
    placeCategorySelect.value;

  const categoryData =
    CATEGORIES[categoryKey];

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

  const emptyOption =
    document.createElement("option");

  emptyOption.value = "";

  emptyOption.textContent =
    "Choisir une sous-catégorie";

  emptyOption.disabled = true;
  emptyOption.selected = true;

  placeSubcategorySelect.appendChild(
    emptyOption
  );

  for (
    const subcategory
    of categoryData.subcategories
  ) {
    const option =
      document.createElement("option");

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

  for (
    const [categoryKey, categoryData]
    of Object.entries(CATEGORIES)
  ) {
    const categoryBlock =
      document.createElement("div");

    categoryBlock.className =
      "filter-group";

    const categoryLabel =
      document.createElement("label");

    categoryLabel.className =
      "filter-category";

    const categoryCheckbox =
      document.createElement("input");

    categoryCheckbox.type = "checkbox";

    categoryCheckbox.className =
      "category-filter";

    categoryCheckbox.value = categoryKey;
    categoryCheckbox.checked = true;

    categoryLabel.appendChild(
      categoryCheckbox
    );

    const categoryText =
      document.createElement("span");

    categoryText.textContent =
      `${categoryData.icon} ${categoryData.label}`;

    categoryLabel.appendChild(
      categoryText
    );

    categoryBlock.appendChild(
      categoryLabel
    );

    if (
      categoryData.subcategories.length > 0
    ) {
      const childrenContainer =
        document.createElement("div");

      childrenContainer.className =
        "subcategory-filters";

      for (
        const subcategory
        of categoryData.subcategories
      ) {
        const childLabel =
          document.createElement("label");

        childLabel.className =
          "filter-subcategory";

        const childCheckbox =
          document.createElement("input");

        childCheckbox.type = "checkbox";

        childCheckbox.className =
          "subcategory-filter";

        childCheckbox.dataset.category =
          categoryKey;

        childCheckbox.value =
          subcategory;

        childCheckbox.checked = true;

        childLabel.appendChild(
          childCheckbox
        );

        const childText =
          document.createElement("span");

        childText.textContent =
          subcategory;

        childLabel.appendChild(
          childText
        );

        childrenContainer.appendChild(
          childLabel
        );
      }

      categoryBlock.appendChild(
        childrenContainer
      );

      categoryCheckbox.addEventListener(
        "change",
        () => {
          const childCheckboxes =
            childrenContainer.querySelectorAll(
              ".subcategory-filter"
            );

          childCheckboxes.forEach(
            (checkbox) => {
              checkbox.checked =
                categoryCheckbox.checked;
            }
          );

          refreshInterface();
        }
      );
    } else {
      categoryCheckbox.addEventListener(
        "change",
        refreshInterface
      );
    }

    filtersContainer.appendChild(
      categoryBlock
    );
  }

  document
    .querySelectorAll(".subcategory-filter")
    .forEach((checkbox) => {
      checkbox.addEventListener(
        "change",
        () => {
          synchronizeParentCategoryFilter(
            checkbox.dataset.category
          );

          refreshInterface();
        }
      );
    });
}

function synchronizeParentCategoryFilter(
  categoryKey
) {
  const parentCheckbox =
    document.querySelector(
      `.category-filter[value="${categoryKey}"]`
    );

  const childCheckboxes =
    Array.from(
      document.querySelectorAll(
        `.subcategory-filter[data-category="${categoryKey}"]`
      )
    );

  if (
    !parentCheckbox ||
    childCheckboxes.length === 0
  ) {
    return;
  }

  const selectedChildren =
    childCheckboxes.filter(
      (checkbox) => checkbox.checked
    );

  parentCheckbox.checked =
    selectedChildren.length > 0;

  parentCheckbox.indeterminate =
    selectedChildren.length > 0 &&
    selectedChildren.length <
      childCheckboxes.length;
}

function passesCategoryFilters(place) {
  const categoryCheckbox =
    document.querySelector(
      `.category-filter[value="${place.category}"]`
    );

  if (
    !categoryCheckbox ||
    !categoryCheckbox.checked
  ) {
    return false;
  }

  const categoryData =
    CATEGORIES[place.category];

  if (
    !categoryData ||
    categoryData.subcategories.length === 0
  ) {
    return true;
  }

  /*
   * Les anciens marqueurs sans sous-catégorie
   * restent visibles.
   */
  if (!place.subcategory) {
    return true;
  }

  const subcategoryCheckbox =
    Array.from(
      document.querySelectorAll(
        `.subcategory-filter[data-category="${place.category}"]`
      )
    ).find(
      (checkbox) =>
        checkbox.value === place.subcategory
    );

  /*
   * Une ancienne sous-catégorie inconnue
   * reste également visible.
   */
  if (!subcategoryCheckbox) {
    return true;
  }

  return subcategoryCheckbox.checked;
}

/* =========================================================
   RECHERCHE
   ========================================================= */

function buildSearchableText(place) {
  const categoryLabel =
    getCategoryLabel(place.category);

  return normalizeText([
    place.name,
    place.description,
    place.author,
    place.category,
    categoryLabel,
    place.subcategory
  ].join(" "));
}

function passesSearch(place) {
  if (!currentSearch) {
    return true;
  }

  return buildSearchableText(place)
    .includes(currentSearch);
}

function isPlaceVisible(place, index = 0) {
  const passesFavoriteFilter =
    !favoritesOnlyCheckbox.checked ||
    isFavorite(place, index);

  return (
    passesCategoryFilters(place) &&
    passesSearch(place) &&
    passesFavoriteFilter
  );
}

function getVisiblePlaces() {
  return places.filter((place, index) =>
    isPlaceVisible(place, index)
  );
}

function updateVisibleMarkerCount() {
  const visibleCount =
    getVisiblePlaces().length;

  const totalCount = places.length;

  visibleMarkerCountElement.textContent =
    currentSearch
      ? `${visibleCount} / ${totalCount}`
      : `${visibleCount} lieu${visibleCount > 1 ? "x" : ""}`;
}

function createSearchResultItem(
  place,
  index
) {
  const identifier =
    getPlaceIdentifier(place, index);

  const categoryData =
    getCategoryData(place.category);

  const button =
    document.createElement("button");

  button.type = "button";
  button.className = "search-result-item";

  const icon =
    document.createElement("span");

  icon.className =
    "search-result-icon";

  icon.textContent =
    categoryData.icon;

  const information =
    document.createElement("span");

  information.className =
    "search-result-information";

  const name =
    document.createElement("strong");

  name.textContent =
    place.name || "Lieu sans nom";

  const details =
    document.createElement("small");

  const detailParts = [
    categoryData.label
  ];

  if (place.subcategory) {
    detailParts.push(
      place.subcategory
    );
  }

  if (place.author) {
    detailParts.push(
      `par ${place.author}`
    );
  }

  details.textContent =
    detailParts.join(" · ");

  information.appendChild(name);
  information.appendChild(details);

  const arrow =
    document.createElement("span");

  arrow.className =
    "search-result-arrow";

  arrow.textContent = "›";

  button.appendChild(icon);
  button.appendChild(information);
  button.appendChild(arrow);

  button.addEventListener("click", () => {
    focusMarker(identifier);
  });

  return button;
}

function renderSearchResults() {
  searchResultsContainer.innerHTML = "";

  if (!currentSearch) {
    const message =
      document.createElement("p");

    message.className =
      "empty-results";

    message.textContent =
      "Saisis un mot pour rechercher un lieu.";

    searchResultsContainer.appendChild(
      message
    );

    return;
  }

  const results =
    getVisiblePlaces();

  if (results.length === 0) {
    const message =
      document.createElement("p");

    message.className =
      "empty-results";

    message.textContent =
      "Aucun lieu ne correspond à cette recherche et aux filtres sélectionnés.";

    searchResultsContainer.appendChild(
      message
    );

    return;
  }

  const resultLimit = 30;

  results
    .slice(0, resultLimit)
    .forEach((place) => {
      const originalIndex =
        places.indexOf(place);

      searchResultsContainer.appendChild(
        createSearchResultItem(
          place,
          originalIndex
        )
      );
    });

  if (results.length > resultLimit) {
    const remainingMessage =
      document.createElement("p");

    remainingMessage.className =
      "remaining-results";

    remainingMessage.textContent =
      `${results.length - resultLimit} autre(s) résultat(s) non affiché(s).`;

    searchResultsContainer.appendChild(
      remainingMessage
    );
  }
}

function focusMarker(identifier) {
  const marker =
    markerInstances.get(
      String(identifier)
    );

  if (!marker) {
    showNotification(
      "Ce marqueur est actuellement masqué par un filtre.",
      "error"
    );

    return;
  }

  const position =
    marker.getLatLng();

  map.setView(
    position,
    Math.max(map.getZoom(), 0),
    {
      animate: true
    }
  );

  window.setTimeout(() => {
    marker.openPopup();
  }, 300);

  if (window.innerWidth <= 850) {
    document
      .getElementById("map")
      .scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }
}

function synchronizeSearchFromInput() {
  currentSearch = normalizeText(placeSearchInput.value);
  clearSearchButton.hidden = !currentSearch;
  refreshInterface();
}

/*
 * Plusieurs événements sont écoutés volontairement :
 * certains navigateurs restaurent automatiquement la valeur
 * d'un champ après un rechargement sans déclencher "input".
 */
["input", "keyup", "change", "search"].forEach((eventName) => {
  placeSearchInput.addEventListener(
    eventName,
    synchronizeSearchFromInput
  );
});

clearSearchButton.addEventListener(
  "click",
  () => {
    placeSearchInput.value = "";
    currentSearch = "";
    clearSearchButton.hidden = true;

    refreshInterface();

    placeSearchInput.focus();
  }
);

/* =========================================================
   FAVORIS
   ========================================================= */

function createFavoriteItem(place, index) {
  const identifier = getPlaceIdentifier(place, index);
  const categoryData = getCategoryData(place.category);

  const row = document.createElement("div");
  row.className = "favorite-item";

  const focusButton = document.createElement("button");
  focusButton.type = "button";
  focusButton.className = "favorite-focus-button";

  const icon = document.createElement("span");
  icon.className = "favorite-item-icon";
  icon.textContent = categoryData.icon;

  const info = document.createElement("span");
  info.className = "favorite-item-information";

  const name = document.createElement("strong");
  name.textContent = place.name || "Lieu sans nom";

  const details = document.createElement("small");
  details.textContent = [
    categoryData.label,
    place.subcategory
  ].filter(Boolean).join(" · ");

  info.appendChild(name);
  info.appendChild(details);
  focusButton.appendChild(icon);
  focusButton.appendChild(info);

  focusButton.addEventListener("click", () => {
    focusMarker(identifier);
  });

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "favorite-remove-button";
  removeButton.title = "Retirer des favoris";
  removeButton.setAttribute("aria-label", "Retirer des favoris");
  removeButton.textContent = "★";

  removeButton.addEventListener("click", () => {
    toggleFavorite(identifier);
  });

  row.appendChild(focusButton);
  row.appendChild(removeButton);

  return row;
}

function renderFavorites() {
  favoritesListContainer.innerHTML = "";

  const favorites = places
    .map((place, index) => ({ place, index }))
    .filter(({ place, index }) => isFavorite(place, index));

  favoriteCountElement.textContent =
    `${favorites.length} favori${favorites.length > 1 ? "s" : ""}`;

  if (favorites.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-results";
    message.textContent = "Aucun lieu favori pour le moment.";
    favoritesListContainer.appendChild(message);
    return;
  }

  favorites.forEach(({ place, index }) => {
    favoritesListContainer.appendChild(
      createFavoriteItem(place, index)
    );
  });
}

favoritesOnlyCheckbox.addEventListener("change", refreshInterface);

/* =========================================================
   MARQUEURS
   ========================================================= */

function makeMarkerIcon(categoryKey) {
  const icon =
    getCategoryIcon(categoryKey);

  return L.divIcon({
    className: "rp-marker",
    html: `<span>${icon}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -18]
  });
}

function createPopupContent(place, identifier, favorite) {
  const categoryData =
    getCategoryData(place.category);

  const subcategoryLine =
    place.subcategory
      ? `
        <div class="popup-row">
          <span>Sous-catégorie</span>
          <strong>
            ${escapeHtml(place.subcategory)}
          </strong>
        </div>
      `
      : "";

  const description =
    place.description
      ? escapeHtml(place.description)
          .replaceAll("\n", "<br>")
      : "Aucune description.";

  const createdDate =
    place.created_at
      ? new Date(
          place.created_at
        ).toLocaleString("fr-FR")
      : "Date inconnue";

  return `
    <article class="marker-popup">
      <header class="marker-popup-header">
        <span class="marker-popup-icon">
          ${categoryData.icon}
        </span>

        <div class="marker-popup-title">
          <h3>
            ${escapeHtml(place.name)}
          </h3>

          <p>
            ${escapeHtml(categoryData.label)}
          </p>
        </div>

        <button
          type="button"
          class="popup-star-button${favorite ? " is-favorite" : ""}"
          data-favorite-id="${escapeHtml(identifier)}"
          title="${favorite ? "Retirer des favoris" : "Ajouter aux favoris"}"
          aria-label="${favorite ? "Retirer des favoris" : "Ajouter aux favoris"}"
        >
          ${favorite ? "★" : "☆"}
        </button>
      </header>

      ${subcategoryLine}

      <div class="popup-description">
        ${description}
      </div>

      ${isAdmin ? `
        <div class="popup-admin-actions">
          <button type="button" data-admin-edit="${escapeHtml(identifier)}">Modifier</button>
          <button type="button" data-admin-move="${escapeHtml(identifier)}">Déplacer</button>
          <button type="button" class="danger-button" data-admin-delete="${escapeHtml(identifier)}">Supprimer</button>
        </div>
      ` : ""}

      <footer class="marker-popup-footer">
        <span>
          Ajouté par
          <strong>
            ${escapeHtml(
              place.author || "Inconnu"
            )}
          </strong>
        </span>

        <span>
          ${escapeHtml(createdDate)}
        </span>
      </footer>
    </article>
  `;
}

function renderMarkers() {
  markersLayer.clearLayers();
  markerInstances.clear();

  places.forEach((place, index) => {
    if (!isPlaceVisible(place, index)) {
      return;
    }

    const latitude =
      Number(place.lat);

    const longitude =
      Number(place.lng);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      console.warn(
        "Marqueur ignoré car ses coordonnées sont invalides :",
        place
      );

      return;
    }

    const identifier =
      getPlaceIdentifier(place, index);

    const marker = L.marker(
      [latitude, longitude],
      {
        icon: makeMarkerIcon(
          place.category
        )
      }
    );

    marker.bindPopup(
      createPopupContent(
        place,
        identifier,
        isFavorite(place, index)
      ),
      {
        maxWidth: 340
      }
    );

    marker.addTo(markersLayer);

    markerInstances.set(
      identifier,
      marker
    );
  });
}

map.on("popupopen", (event) => {
  const popupElement = event.popup.getElement();
  const favoriteButton = popupElement?.querySelector("[data-favorite-id]");

  favoriteButton?.addEventListener("click", () => {
    toggleFavorite(favoriteButton.dataset.favoriteId);
    map.closePopup();
  });

  popupElement?.querySelector("[data-admin-edit]")?.addEventListener("click", (e) => {
    editMarker(e.currentTarget.dataset.adminEdit);
  });

  popupElement?.querySelector("[data-admin-move]")?.addEventListener("click", (e) => {
    startMovingMarker(e.currentTarget.dataset.adminMove);
  });

  popupElement?.querySelector("[data-admin-delete]")?.addEventListener("click", (e) => {
    deleteMarker(e.currentTarget.dataset.adminDelete);
  });

  popupElement?.querySelector("[data-zone-delete]")?.addEventListener("click", (e) => {
    deleteZone(e.currentTarget.dataset.zoneDelete);
  });
});

function refreshInterface() {
  renderMarkers();
  renderSearchResults();
  renderFavorites();
  updateVisibleMarkerCount();
}

/* =========================================================
   SUPABASE
   ========================================================= */

async function loadMarkers() {
  const { data, error } =
    await supabaseClient
      .from("markers")
      .select("*")
      .order(
        "created_at",
        {
          ascending: true
        }
      );

  if (error) {
    console.error(
      "Erreur de chargement Supabase :",
      error
    );

    showNotification(
      `Impossible de charger les marqueurs : ${error.message}`,
      "error"
    );

    return;
  }

  places =
    Array.isArray(data)
      ? data
      : [];

  refreshInterface();
}

async function addMarker(place) {
  addMarkerButton.disabled = true;

  addMarkerButton.textContent =
    "Enregistrement...";

  const { data, error } =
    await supabaseClient
      .from("markers")
      .insert([place])
      .select()
      .single();

  addMarkerButton.disabled = false;

  addMarkerButton.textContent =
    "Ajouter le marqueur";

  if (error) {
    console.error(
      "Erreur d’ajout Supabase :",
      error
    );

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

map.on("click", async (event) => {
  if (isDrawingZone || pendingZoneLayer) return;

  if (movingMarkerId !== null) {
    const markerId = movingMarkerId;
    movingMarkerId = null;

    const success = await updateMarkerRecord(markerId, {
      lat: event.latlng.lat,
      lng: event.latlng.lng
    });

    locationStatus.textContent = "Clique sur la carte pour choisir un emplacement.";
    locationStatus.classList.remove("location-selected", "admin-moving");

    if (success) showNotification("Marqueur déplacé.");
    return;
  }

  pendingClick = event.latlng;

  locationStatus.textContent =
    `Emplacement sélectionné — lat ${Math.round(
      pendingClick.lat
    )}, lng ${Math.round(
      pendingClick.lng
    )}`;

  locationStatus.classList.add(
    "location-selected"
  );

  placeNameInput.focus();
});

/* =========================================================
   AJOUT D’UN MARQUEUR
   ========================================================= */

placeForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!pendingClick) {
      showNotification(
        "Clique d’abord sur la carte pour choisir l’emplacement.",
        "error"
      );

      return;
    }

    const name =
      placeNameInput.value.trim();

    const category =
      placeCategorySelect.value;

    const categoryData =
      CATEGORIES[category];

    let subcategory = null;

    if (
      categoryData &&
      categoryData.subcategories.length > 0
    ) {
      subcategory =
        placeSubcategorySelect.value ||
        null;

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

      description:
        placeDescriptionInput
          .value
          .trim(),

      lat: pendingClick.lat,
      lng: pendingClick.lng,
      author: playerName
    };

    const insertedPlace =
      await addMarker(place);

    if (!insertedPlace) {
      return;
    }

    places.push(insertedPlace);

    refreshInterface();

    placeForm.reset();
    createCategoryOptions();

    pendingClick = null;

    locationStatus.textContent =
      "Clique sur la carte pour choisir un emplacement.";

    locationStatus.classList.remove(
      "location-selected"
    );

    showNotification(
      `Le marqueur « ${insertedPlace.name} » a été ajouté.`
    );
  }
);

/* =========================================================
   POLYZONES PERSISTANTES
   ========================================================= */

function getZoneSubcategories(category) {
  if (category === "gang") return CATEGORIES.gang.subcategories;
  if (category === "production") return CATEGORIES.production.subcategories;
  return [];
}

function getZoneColor(category, subcategory) {
  const palette = ZONE_COLORS[category] || ZONE_COLORS.autre;
  return palette[subcategory] || palette.default || "#708090";
}

function updateZoneSubcategorySelect() {
  const values = getZoneSubcategories(zoneCategorySelect.value);
  zoneSubcategorySelect.innerHTML = "";

  if (values.length === 0) {
    zoneSubcategoryField.hidden = true;
    zoneSubcategorySelect.required = false;
  } else {
    zoneSubcategoryField.hidden = false;
    zoneSubcategorySelect.required = true;
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      zoneSubcategorySelect.appendChild(option);
    });
  }

  updateZoneColorPreview();
  applyPendingZoneStyle();
}

function updateZoneColorPreview() {
  const color = getZoneColor(zoneCategorySelect.value, zoneSubcategorySelect.value);
  zoneColorPreview.style.backgroundColor = color;
  zoneColorPreview.style.borderColor = color.toUpperCase() === "#FFFFFF" ? "#7b8491" : color;
}

function zoneStyle(zone) {
  return {
    color: zone.color || getZoneColor(zone.category, zone.subcategory),
    weight: 3,
    opacity: 0.95,
    fillColor: zone.color || getZoneColor(zone.category, zone.subcategory),
    fillOpacity: 0.24
  };
}

function applyPendingZoneStyle() {
  if (!pendingZoneLayer?.setStyle) return;
  pendingZoneLayer.setStyle(zoneStyle({
    category: zoneCategorySelect.value,
    subcategory: zoneSubcategorySelect.value,
    color: getZoneColor(zoneCategorySelect.value, zoneSubcategorySelect.value)
  }));
}

function cancelPendingZone(resetForm = true) {
  if (pendingZoneLayer) temporaryZoneLayer.removeLayer(pendingZoneLayer);
  pendingZoneLayer = null;
  zoneForm.hidden = true;
  zoneStatus.textContent = "Dessine une forme avec la barre d’outils de la carte.";
  zoneStatus.classList.remove("location-selected");
  if (resetForm) zoneForm.reset();
}

function serializeZoneCoordinates(layer) {
  const latLngs = layer.getLatLngs();
  const ring = Array.isArray(latLngs[0]) ? latLngs[0] : latLngs;
  return ring.map((point) => [Number(point.lat), Number(point.lng)]);
}

function createZonePopup(zone) {
  const category = getCategoryData(zone.category);
  const description = zone.description
    ? escapeHtml(zone.description).replaceAll("\n", "<br>")
    : "Aucune description.";

  return `
    <article class="marker-popup zone-popup">
      <header class="marker-popup-header" style="border-left: 6px solid ${escapeHtml(zone.color)}">
        <span class="marker-popup-icon">${category.icon}</span>
        <div class="marker-popup-title">
          <h3>${escapeHtml(zone.name)}</h3>
          <p>${escapeHtml(category.label)}${zone.subcategory ? ` · ${escapeHtml(zone.subcategory)}` : ""}</p>
        </div>
      </header>
      <div class="popup-description">${description}</div>
      ${isAdmin ? `<div class="popup-admin-actions zone-admin-actions"><button type="button" class="danger-button" data-zone-delete="${zone.id}">Supprimer la zone</button></div>` : ""}
      <footer class="marker-popup-footer"><span>Ajoutée par <strong>${escapeHtml(zone.author || "Inconnu")}</strong></span></footer>
    </article>`;
}

function renderZones() {
  zonesLayer.clearLayers();
  zoneInstances.clear();
  zoneCountElement.textContent = `${zones.length} zone${zones.length > 1 ? "s" : ""}`;
  if (!showZonesCheckbox.checked) return;

  zones.forEach((zone) => {
    if (!Array.isArray(zone.coordinates) || zone.coordinates.length < 3) return;
    const polygon = L.polygon(zone.coordinates, zoneStyle(zone));
    polygon.bindPopup(createZonePopup(zone), { maxWidth: 340 });
    polygon.bindTooltip(escapeHtml(zone.name), { permanent: false, direction: "center", className: "zone-tooltip" });
    polygon.addTo(zonesLayer);
    zoneInstances.set(String(zone.id), polygon);
  });
}

async function loadZones() {
  const { data, error } = await supabaseClient.from("zones").select("*").order("created_at", { ascending: true });
  if (error) {
    console.error("Erreur chargement zones :", error);
    showNotification(`Impossible de charger les zones : ${error.message}`, "error");
    return;
  }
  zones = Array.isArray(data) ? data : [];
  renderZones();
}

zoneCategorySelect.addEventListener("change", updateZoneSubcategorySelect);
zoneSubcategorySelect.addEventListener("change", () => {
  updateZoneColorPreview();
  applyPendingZoneStyle();
});
showZonesCheckbox.addEventListener("change", renderZones);
cancelZoneButton.addEventListener("click", () => cancelPendingZone());

zoneForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!pendingZoneLayer) {
    showNotification("Dessine d’abord une zone sur la carte.", "error");
    return;
  }

  const category = zoneCategorySelect.value;
  const subcategory = zoneSubcategoryField.hidden ? null : zoneSubcategorySelect.value;
  const payload = {
    name: zoneNameInput.value.trim(),
    description: zoneDescriptionInput.value.trim(),
    category,
    subcategory,
    color: getZoneColor(category, subcategory),
    coordinates: serializeZoneCoordinates(pendingZoneLayer),
    author: playerName,
    created_by: adminUser?.id || null
  };

  saveZoneButton.disabled = true;
  saveZoneButton.textContent = "Enregistrement...";
  const { error } = await supabaseClient.from("zones").insert([payload]);
  saveZoneButton.disabled = false;
  saveZoneButton.textContent = "Enregistrer la zone";

  if (error) {
    console.error("Erreur ajout zone :", error);
    showNotification(`Impossible d’ajouter la zone : ${error.message}`, "error");
    return;
  }

  cancelPendingZone();
  showNotification(`La zone « ${payload.name} » a été ajoutée.`);
  await loadZones();
});

async function deleteZone(id) {
  if (!isAdmin) return;
  const zone = zones.find((item) => String(item.id) === String(id));
  if (!zone || !window.confirm(`Supprimer définitivement la zone « ${zone.name} » ?`)) return;
  const { error } = await supabaseClient.from("zones").delete().eq("id", zone.id);
  if (error) {
    showNotification(`Suppression impossible : ${error.message}`, "error");
    return;
  }
  map.closePopup();
  showNotification("Zone supprimée.");
  await loadZones();
}

/* =========================================================
   EXPORT JSON
   ========================================================= */

exportButton.addEventListener(
  "click",
  () => {
    const exportData = {
      exported_at:
        new Date().toISOString(),

      marker_count:
        places.length,

      markers:
        places
    };

    const blob = new Blob(
      [
        JSON.stringify(
          exportData,
          null,
          2
        )
      ],
      {
        type: "application/json"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

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
  }
);

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
    console.log(
      "Statut Supabase Realtime :",
      status
    );
  });

supabaseClient
  .channel("zones-realtime")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "zones" },
    () => loadZones()
  )
  .subscribe((status) => console.log("Statut zones Realtime :", status));

/* =========================================================
   DÉMARRAGE
   ========================================================= */

async function initializeApplication() {
  initializePlayerName();
  loadFavorites();
  await checkAdminSession();
  createCategoryOptions();
  createFilters();
  updateZoneSubcategorySelect();

  /*
   * Prend immédiatement en compte une valeur de recherche
   * éventuellement restaurée par le navigateur.
   */
  currentSearch = normalizeText(placeSearchInput.value);
  clearSearchButton.hidden = !currentSearch;

  await Promise.all([loadMarkers(), loadZones()]);

  /*
   * Force une synchronisation finale après le chargement
   * des marqueurs depuis Supabase.
   */
  synchronizeSearchFromInput();
}

initializeApplication();

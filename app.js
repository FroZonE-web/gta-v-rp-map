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

const adminStatusBadge =
  document.getElementById("admin-status-badge");

const adminStatusText =
  document.getElementById("admin-status-text");

const adminLoginForm =
  document.getElementById("admin-login-form");

const adminEmailInput =
  document.getElementById("admin-email");

const adminPasswordInput =
  document.getElementById("admin-password");

const adminLoginButton =
  document.getElementById("admin-login-button");

const adminConnectedActions =
  document.getElementById("admin-connected-actions");

const adminLogoutButton =
  document.getElementById("admin-logout-button");

const editMarkerModal =
  document.getElementById("edit-marker-modal");

const editMarkerForm =
  document.getElementById("edit-marker-form");

const editMarkerIdInput =
  document.getElementById("edit-marker-id");

const editPlaceNameInput =
  document.getElementById("edit-place-name");

const editPlaceCategorySelect =
  document.getElementById("edit-place-category");

const editSubcategoryField =
  document.getElementById("edit-subcategory-field");

const editPlaceSubcategorySelect =
  document.getElementById("edit-place-subcategory");

const editPlaceDescriptionInput =
  document.getElementById("edit-place-description");

const editModalCloseButton =
  document.getElementById("edit-modal-close");

const editModalCancelButton =
  document.getElementById("edit-modal-cancel");

const editModalSaveButton =
  document.getElementById("edit-modal-save");

/* =========================================================
   ÉTAT DE L’APPLICATION
   ========================================================= */

let places = [];
let pendingClick = null;
let playerName = "";
let currentSearch = "";
let favoriteIds = new Set();
let currentAdminUser = null;
let isAdmin = false;
let movingMarkerId = null;

const markerInstances = new Map();

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
   ADMINISTRATION SUPABASE
   ========================================================= */

function updateAdminInterface() {
  adminLoginForm.hidden = isAdmin;
  adminConnectedActions.hidden = !isAdmin;

  adminStatusBadge.textContent = isAdmin ? "Admin" : "Hors ligne";
  adminStatusBadge.classList.toggle("is-connected", isAdmin);

  adminStatusText.textContent = isAdmin
    ? `Compte connecté : ${currentAdminUser?.email || "administrateur"}`
    : "Connecte-toi avec ton compte administrateur Supabase pour modifier, déplacer ou supprimer des lieux.";

  refreshInterface();
}

async function verifyAdminStatus(user) {
  currentAdminUser = user || null;
  isAdmin = false;

  if (user) {
    const { data, error } = await supabaseClient.rpc("is_admin");

    if (error) {
      console.error("Vérification administrateur impossible :", error);
      showNotification(`Vérification admin impossible : ${error.message}`, "error");
    } else {
      isAdmin = data === true;

      if (!isAdmin) {
        showNotification("Ce compte est connecté, mais il n'est pas déclaré administrateur.", "error");
      }
    }
  }

  updateAdminInterface();
}

async function initializeAdminAuthentication() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Lecture de la session admin impossible :", error);
  }

  await verifyAdminStatus(data?.session?.user || null);

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => {
      verifyAdminStatus(session?.user || null);
    }, 0);
  });
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
  adminLoginButton.textContent = "Connexion administrateur";

  if (error) {
    showNotification(`Connexion impossible : ${error.message}`, "error");
    return;
  }

  adminPasswordInput.value = "";
  await verifyAdminStatus(data.user);

  if (isAdmin) {
    showNotification("Connexion administrateur réussie.");
  }
});

adminLogoutButton.addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    showNotification(`Déconnexion impossible : ${error.message}`, "error");
    return;
  }

  currentAdminUser = null;
  isAdmin = false;
  movingMarkerId = null;
  updateAdminInterface();
  showNotification("Administrateur déconnecté.");
});

function populateEditCategoryOptions(selectedCategory) {
  editPlaceCategorySelect.innerHTML = "";

  for (const [categoryKey, categoryData] of Object.entries(CATEGORIES)) {
    const option = document.createElement("option");
    option.value = categoryKey;
    option.textContent = `${categoryData.icon} ${categoryData.label}`;
    option.selected = categoryKey === selectedCategory;
    editPlaceCategorySelect.appendChild(option);
  }
}

function updateEditSubcategoryOptions(selectedSubcategory = "") {
  const categoryData = CATEGORIES[editPlaceCategorySelect.value];
  editPlaceSubcategorySelect.innerHTML = "";

  if (!categoryData || categoryData.subcategories.length === 0) {
    editSubcategoryField.hidden = true;
    editPlaceSubcategorySelect.required = false;
    return;
  }

  editSubcategoryField.hidden = false;
  editPlaceSubcategorySelect.required = true;

  for (const subcategory of categoryData.subcategories) {
    const option = document.createElement("option");
    option.value = subcategory;
    option.textContent = subcategory;
    option.selected = subcategory === selectedSubcategory;
    editPlaceSubcategorySelect.appendChild(option);
  }
}

function openEditMarkerModal(markerId) {
  if (!isAdmin) return;

  const place = places.find((item) => String(item.id) === String(markerId));
  if (!place) {
    showNotification("Lieu introuvable.", "error");
    return;
  }

  editMarkerIdInput.value = place.id;
  editPlaceNameInput.value = place.name || "";
  editPlaceDescriptionInput.value = place.description || "";
  populateEditCategoryOptions(place.category);
  updateEditSubcategoryOptions(place.subcategory || "");
  editMarkerModal.hidden = false;
  editPlaceNameInput.focus();
}

function closeEditMarkerModal() {
  editMarkerModal.hidden = true;
  editMarkerForm.reset();
}

editPlaceCategorySelect.addEventListener("change", () => {
  updateEditSubcategoryOptions();
});

editModalCloseButton.addEventListener("click", closeEditMarkerModal);
editModalCancelButton.addEventListener("click", closeEditMarkerModal);
editMarkerModal.addEventListener("click", (event) => {
  if (event.target === editMarkerModal) closeEditMarkerModal();
});

editMarkerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!isAdmin) return;

  const category = editPlaceCategorySelect.value;
  const categoryData = CATEGORIES[category];
  const subcategory = categoryData?.subcategories.length
    ? editPlaceSubcategorySelect.value
    : null;

  editModalSaveButton.disabled = true;
  editModalSaveButton.textContent = "Enregistrement...";

  const { error } = await supabaseClient
    .from("markers")
    .update({
      name: editPlaceNameInput.value.trim(),
      category,
      subcategory,
      description: editPlaceDescriptionInput.value.trim()
    })
    .eq("id", editMarkerIdInput.value);

  editModalSaveButton.disabled = false;
  editModalSaveButton.textContent = "Enregistrer";

  if (error) {
    showNotification(`Modification impossible : ${error.message}`, "error");
    return;
  }

  closeEditMarkerModal();
  await loadMarkers();
  showNotification("Lieu modifié.");
});

async function deleteMarker(markerId) {
  if (!isAdmin) return;

  const place = places.find((item) => String(item.id) === String(markerId));
  const confirmed = window.confirm(`Supprimer définitivement « ${place?.name || "ce lieu"} » ?`);
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("markers")
    .delete()
    .eq("id", markerId);

  if (error) {
    showNotification(`Suppression impossible : ${error.message}`, "error");
    return;
  }

  favoriteIds.delete(String(markerId));
  saveFavorites();
  map.closePopup();
  await loadMarkers();
  showNotification("Lieu supprimé.");
}

function startMovingMarker(markerId) {
  if (!isAdmin) return;

  movingMarkerId = String(markerId);
  map.closePopup();
  locationStatus.textContent = "Mode déplacement admin : clique sur le nouvel emplacement du marqueur.";
  locationStatus.classList.add("location-selected", "admin-moving");
  showNotification("Clique maintenant sur la nouvelle position du marqueur.");
}

async function finishMovingMarker(latlng) {
  const markerId = movingMarkerId;
  movingMarkerId = null;

  const { error } = await supabaseClient
    .from("markers")
    .update({ lat: latlng.lat, lng: latlng.lng })
    .eq("id", markerId);

  locationStatus.textContent = "Clique sur la carte pour choisir un emplacement.";
  locationStatus.classList.remove("location-selected", "admin-moving");

  if (error) {
    showNotification(`Déplacement impossible : ${error.message}`, "error");
    return;
  }

  await loadMarkers();
  showNotification("Marqueur déplacé.");
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

  const adminActions = isAdmin
    ? `
      <div class="popup-admin-actions">
        <button type="button" class="popup-admin-button" data-admin-action="edit" data-marker-id="${escapeHtml(identifier)}">Modifier</button>
        <button type="button" class="popup-admin-button" data-admin-action="move" data-marker-id="${escapeHtml(identifier)}">Déplacer</button>
        <button type="button" class="popup-admin-button danger" data-admin-action="delete" data-marker-id="${escapeHtml(identifier)}">Supprimer</button>
      </div>
    `
    : "";

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

      ${adminActions}

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
  if (!popupElement) return;

  const favoriteButton = popupElement.querySelector("[data-favorite-id]");
  if (favoriteButton) {
    favoriteButton.addEventListener("click", () => {
      toggleFavorite(favoriteButton.dataset.favoriteId);
      map.closePopup();
    });
  }

  popupElement.querySelectorAll("[data-admin-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const markerId = button.dataset.markerId;
      const action = button.dataset.adminAction;

      if (action === "edit") openEditMarkerModal(markerId);
      if (action === "move") startMovingMarker(markerId);
      if (action === "delete") deleteMarker(markerId);
    });
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
  if (movingMarkerId) {
    await finishMovingMarker(event.latlng);
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

/* =========================================================
   DÉMARRAGE
   ========================================================= */

async function initializeApplication() {
  initializePlayerName();
  loadFavorites();
  createCategoryOptions();
  createFilters();

  /*
   * Prend immédiatement en compte une valeur de recherche
   * éventuellement restaurée par le navigateur.
   */
  currentSearch = normalizeText(placeSearchInput.value);
  clearSearchButton.hidden = !currentSearch;

  await loadMarkers();
  await initializeAdminAuthentication();

  /*
   * Force une synchronisation finale après le chargement
   * des marqueurs depuis Supabase.
   */
  synchronizeSearchFromInput();
}

initializeApplication();

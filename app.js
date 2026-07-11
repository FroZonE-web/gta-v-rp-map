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

/* =========================================================
   ÉTAT DE L’APPLICATION
   ========================================================= */

let places = [];
let pendingClick = null;
let playerName = "";
let currentSearch = "";

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

function isPlaceVisible(place) {
  return (
    passesCategoryFilters(place) &&
    passesSearch(place)
  );
}

function getVisiblePlaces() {
  return places.filter(isPlaceVisible);
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

function createPopupContent(place) {
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

        <div>
          <h3>
            ${escapeHtml(place.name)}
          </h3>

          <p>
            ${escapeHtml(categoryData.label)}
          </p>
        </div>
      </header>

      ${subcategoryLine}

      <div class="popup-description">
        ${description}
      </div>

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
    if (!isPlaceVisible(place)) {
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
      createPopupContent(place),
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

function refreshInterface() {
  renderMarkers();
  renderSearchResults();
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

map.on("click", (event) => {
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
  createCategoryOptions();
  createFilters();

  /*
   * Prend immédiatement en compte une valeur de recherche
   * éventuellement restaurée par le navigateur.
   */
  currentSearch = normalizeText(placeSearchInput.value);
  clearSearchButton.hidden = !currentSearch;

  await loadMarkers();

  /*
   * Force une synchronisation finale après le chargement
   * des marqueurs depuis Supabase.
   */
  synchronizeSearchFromInput();
}

initializeApplication();

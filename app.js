"use strict";

console.info("Atlas RP app.js v0.8.0 chargé");

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

const layerMarkersCheckbox = document.getElementById("layer-markers");
const layerZonesCheckbox = document.getElementById("layer-zones");
const layerCategoryList = document.getElementById("layer-category-list");
const resetLayersButton = document.getElementById("reset-layers");

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

const adminExportAtlasButton = document.getElementById("admin-export-atlas");
const adminImportFileInput = document.getElementById("admin-import-file");
const adminImportAtlasButton = document.getElementById("admin-import-atlas");
const adminBackupStatus = document.getElementById("admin-backup-status");
const adminTrashGroup = document.getElementById("admin-trash-group");
const adminTrashList = document.getElementById("admin-trash-list");
const adminTrashCount = document.getElementById("admin-trash-count");
const adminTrashRefreshButton = document.getElementById("admin-trash-refresh");
const adminDeletionRequestsGroup = document.getElementById("admin-deletion-requests-group");
const adminDeletionRequestList = document.getElementById("admin-deletion-request-list");
const adminDeletionRequestCount = document.getElementById("admin-deletion-request-count");
const adminDeletionRequestRefreshButton = document.getElementById("admin-deletion-request-refresh");

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
const adminLogoutButton = document.getElementById("admin-logout-button");
const adminDrawer = document.getElementById("admin-drawer");
const adminDrawerToggle = document.getElementById("admin-drawer-toggle");
const adminDrawerClose = document.getElementById("admin-drawer-close");
const adminModeInput = document.getElementById("admin-mode");
const visitorModeInput = document.getElementById("visitor-mode");
const visitorModeBadge = document.getElementById("visitor-mode-badge");
const showHistoryInput = document.getElementById("show-history");

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
const zoneListElement = document.getElementById("zone-list");
const editSelectedZoneButton = document.getElementById("edit-selected-zone");
const deleteSelectedZoneButton = document.getElementById("delete-selected-zone");
const editZoneShapeButton = document.getElementById("edit-zone-shape");
const saveZoneShapeButton = document.getElementById("save-zone-shape");
const cancelZoneShapeButton = document.getElementById("cancel-zone-shape");
const zoneShapeEditActions = document.getElementById("zone-shape-edit-actions");

const mediaModal = document.getElementById("media-modal");
const mediaDialogTitle = document.getElementById("media-dialog-title");
const mediaEntityLabel = document.getElementById("media-entity-label");
const mediaUploadBlock = document.getElementById("media-upload-block");
const mediaFileInput = document.getElementById("media-file");
const mediaTitleInput = document.getElementById("media-title");
const mediaPrimaryInput = document.getElementById("media-primary");
const mediaPreview = document.getElementById("media-preview");
const mediaPreviewImage = document.getElementById("media-preview-image");
const mediaUploadButton = document.getElementById("media-upload-button");
const mediaGallery = document.getElementById("media-gallery");
const mediaCountElement = document.getElementById("media-count");
const documentUploadBlock = document.getElementById("document-upload-block");
const documentFileInput = document.getElementById("document-file");
const documentTitleInput = document.getElementById("document-title");
const documentUploadButton = document.getElementById("document-upload-button");
const documentList = document.getElementById("document-list");
const documentCountElement = document.getElementById("document-count");


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
let visitorMode = false;
let adminDrawerOpen = false;
let showHistories = false;
let movingMarkerId = null;
let zones = [];
let trashedMarkers = [];
let trashedZones = [];
let deletionRequests = [];
let pendingZoneLayer = null;
let isDrawingZone = false;
let selectedZoneId = null;
let editingZoneId = null;
let geometryEditingZoneId = null;
let geometryEditingLayer = null;
let geometryOriginalCoordinates = null;


const DEFAULT_LAYER_SETTINGS = {
  markers: true,
  zones: true,
  categories: Object.fromEntries(
    Object.keys(CATEGORIES).map((key) => [key, true])
  )
};

let layerSettings = JSON.parse(JSON.stringify(DEFAULT_LAYER_SETTINGS));

const markerInstances = new Map();
const zoneInstances = new Map();

let mediaRecords = [];
let activeMediaEntity = null;
let pendingMediaObjectUrl = null;


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

function revealZoneForm() {
  const liveZoneForm = document.getElementById("zone-form");
  const liveZoneStatus = document.getElementById("zone-status");
  const liveZoneNameInput = document.getElementById("zone-name");

  if (!liveZoneForm || !liveZoneStatus || !liveZoneNameInput) {
    console.error("Interface Polyzone introuvable dans index.html.", {
      zoneForm: liveZoneForm,
      zoneStatus: liveZoneStatus,
      zoneNameInput: liveZoneNameInput
    });
    showNotification("Le formulaire Polyzone est introuvable.", "error");
    return false;
  }

  // Double méthode volontaire : certains navigateurs ou anciennes feuilles
  // de style peuvent conserver l'affichage masqué malgré hidden=false.
  liveZoneForm.hidden = false;
  liveZoneForm.removeAttribute("hidden");
  liveZoneForm.style.display = "block";

  liveZoneStatus.textContent =
    "Forme prête : complète les informations puis enregistre.";
  liveZoneStatus.classList.add("location-selected");

  window.requestAnimationFrame(() => {
    liveZoneForm.scrollIntoView({ behavior: "smooth", block: "center" });
    liveZoneNameInput.focus({ preventScroll: true });
  });

  return true;
}

function handleZoneCreated(event) {
  console.log("Polyzone créée", event);

  cancelPendingZone(false);
  selectedZoneId = null;
  pendingZoneLayer = event?.layer || null;

  if (!pendingZoneLayer) {
    showNotification("La forme dessinée n'a pas pu être récupérée.", "error");
    return;
  }

  temporaryZoneLayer.addLayer(pendingZoneLayer);

  if (!revealZoneForm()) {
    return;
  }

  updateZoneSubcategorySelect();
  applyPendingZoneStyle();

  pendingZoneLayer.on("click", () => {
    revealZoneForm();
  });

  showNotification(
    "Forme créée : complète le formulaire Polyzones puis enregistre-la."
  );
}

map.on(L.Draw.Event.DRAWSTART, () => {
  isDrawingZone = true;
});

map.on(L.Draw.Event.DRAWSTOP, () => {
  window.setTimeout(() => {
    isDrawingZone = false;
  }, 250);
});

// L'événement littéral et la constante correspondent tous deux à
// « draw:created ». Un seul gestionnaire est enregistré pour éviter
// les doubles insertions.
map.on("draw:created", handleZoneCreated);

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
   MÉDIAS DES FICHES v0.8
   ========================================================= */

function getEntityMedia(entityType, entityId) {
  return mediaRecords
    .filter((media) =>
      media.entity_type === entityType &&
      String(media.entity_id) === String(entityId)
    )
    .sort((a, b) =>
      Number(b.is_primary) - Number(a.is_primary) ||
      new Date(a.created_at) - new Date(b.created_at)
    );
}

function getEntityImages(entityType, entityId) {
  return getEntityMedia(entityType, entityId)
    .filter((media) => (media.media_type || "image") === "image");
}

function getEntityDocuments(entityType, entityId) {
  return getEntityMedia(entityType, entityId)
    .filter((media) => media.media_type === "document");
}

function getPrimaryMedia(entityType, entityId) {
  const list = getEntityImages(entityType, entityId);
  return list.find((media) => media.is_primary) || list[0] || null;
}

function createPopupMedia(entityType, entityId) {
  const images = getEntityImages(entityType, entityId);
  const documents = getEntityDocuments(entityType, entityId);
  const primary = images.find((media) => media.is_primary) || images[0];

  const image = primary
    ? `<button type="button" class="popup-media-image" data-media-open="${entityType}" data-media-entity-id="${escapeHtml(entityId)}"><img src="${escapeHtml(primary.public_url)}" alt="${escapeHtml(primary.title || "Image de la fiche")}" loading="lazy"></button>`
    : "";

  const imageLabel = images.length > 0
    ? `${images.length} image${images.length > 1 ? "s" : ""}`
    : "Ajouter une image";

  const documentLabel = documents.length > 0
    ? `${documents.length} document${documents.length > 1 ? "s" : ""}`
    : "Aucun document";

  return `
    ${image}
    <div class="popup-media-actions">
      <button type="button" class="popup-media-button" data-media-open="${entityType}" data-media-entity-id="${escapeHtml(entityId)}">📷 ${imageLabel}</button>
      <button type="button" class="popup-media-button popup-document-button" data-media-open="${entityType}" data-media-entity-id="${escapeHtml(entityId)}">📎 ${documentLabel}</button>
    </div>
  `;
}

function findMediaEntity(entityType, entityId) {
  if (entityType === "marker") {
    return places.find((item) => String(item.id) === String(entityId));
  }
  if (entityType === "zone") {
    return zones.find((item) => String(item.id) === String(entityId));
  }
  return null;
}

function closeMediaModal() {
  mediaModal.hidden = true;
  activeMediaEntity = null;
  mediaFileInput.value = "";
  mediaTitleInput.value = "";
  mediaPrimaryInput.checked = false;
  mediaPreview.hidden = true;
  mediaPreviewImage.removeAttribute("src");
  documentFileInput.value = "";
  documentTitleInput.value = "";
  if (pendingMediaObjectUrl) URL.revokeObjectURL(pendingMediaObjectUrl);
  pendingMediaObjectUrl = null;
}

function openMediaModal(entityType, entityId) {
  const entity = findMediaEntity(entityType, entityId);
  if (!entity) {
    showNotification("Fiche introuvable.", "error");
    return;
  }
  activeMediaEntity = { entityType, entityId: String(entityId), entity };
  mediaDialogTitle.textContent = entityType === "marker" ? "Images du lieu" : "Images de la zone";
  mediaEntityLabel.textContent = entity.name || "Fiche sans nom";
  mediaUploadBlock.hidden = !adminToolsEnabled();
  documentUploadBlock.hidden = !adminToolsEnabled();
  mediaModal.hidden = false;
  renderMediaGallery();
  renderDocumentList();
}

function renderMediaGallery() {
  if (!activeMediaEntity) return;
  const { entityType, entityId } = activeMediaEntity;
  const list = getEntityImages(entityType, entityId);
  mediaCountElement.textContent = `${list.length} image${list.length > 1 ? "s" : ""}`;
  mediaGallery.innerHTML = "";

  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-results";
    empty.textContent = "Aucune image pour cette fiche.";
    mediaGallery.appendChild(empty);
    return;
  }

  list.forEach((media) => {
    const card = document.createElement("article");
    card.className = "media-card";
    if (media.is_primary) card.classList.add("is-primary");

    const imageButton = document.createElement("button");
    imageButton.type = "button";
    imageButton.className = "media-card-image";
    imageButton.innerHTML = `<img src="${escapeHtml(media.public_url)}" alt="${escapeHtml(media.title || "Image")}" loading="lazy">`;
    imageButton.addEventListener("click", () => window.open(media.public_url, "_blank", "noopener,noreferrer"));

    const info = document.createElement("div");
    info.className = "media-card-info";
    const title = document.createElement("strong");
    title.textContent = media.title || (media.is_primary ? "Image principale" : "Image");
    const meta = document.createElement("small");
    meta.textContent = [media.is_primary ? "Principale" : null, media.author ? `par ${media.author}` : null].filter(Boolean).join(" · ");
    info.append(title, meta);

    card.append(imageButton, info);

    if (adminToolsEnabled()) {
      const actions = document.createElement("div");
      actions.className = "media-card-actions";
      if (!media.is_primary) {
        const primaryButton = document.createElement("button");
        primaryButton.type = "button";
        primaryButton.textContent = "Principale";
        primaryButton.addEventListener("click", () => setPrimaryMedia(media));
        actions.appendChild(primaryButton);
      }
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "danger-button";
      deleteButton.textContent = "Supprimer";
      deleteButton.addEventListener("click", () => deleteMedia(media));
      actions.appendChild(deleteButton);
      card.appendChild(actions);
    }

    mediaGallery.appendChild(card);
  });
}

async function loadMedia() {
  const { data, error } = await supabaseClient
    .from("atlas_media")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erreur chargement médias :", error);
    showNotification(`Impossible de charger les médias : ${error.message}`, "error");
    return;
  }

  mediaRecords = Array.isArray(data) ? data : [];
  refreshInterface();
  if (activeMediaEntity) {
    renderMediaGallery();
    renderDocumentList();
  }
}

function getSafeFileName(value) {
  return String(value || "image")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image";
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Le fichier choisi n’est pas une image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("L’image dépasse la limite de 5 Mo.");

  const bitmap = await createImageBitmap(file);
  const maxSize = 1800;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Compression impossible.")), "image/webp", 0.84);
  });
  return blob;
}

async function setPrimaryMedia(media) {
  if (!adminToolsEnabled()) return;
  await supabaseClient
    .from("atlas_media")
    .update({ is_primary: false })
    .eq("entity_type", media.entity_type)
    .eq("entity_id", media.entity_id);

  const { error } = await supabaseClient
    .from("atlas_media")
    .update({ is_primary: true })
    .eq("id", media.id);

  if (error) {
    showNotification(`Modification impossible : ${error.message}`, "error");
    return;
  }
  showNotification("Image principale mise à jour.");
  await loadMedia();
}

async function deleteMedia(media) {
  if (!adminToolsEnabled() || !window.confirm("Supprimer définitivement cette image ?")) return;
  const { error: storageError } = await supabaseClient.storage.from("atlas-media").remove([media.storage_path]);
  if (storageError) {
    showNotification(`Suppression du fichier impossible : ${storageError.message}`, "error");
    return;
  }
  const { error } = await supabaseClient.from("atlas_media").delete().eq("id", media.id);
  if (error) {
    showNotification(`Suppression de la fiche média impossible : ${error.message}`, "error");
    return;
  }
  showNotification("Image supprimée.");
  await loadMedia();
}

mediaFileInput.addEventListener("change", () => {
  const file = mediaFileInput.files?.[0];
  if (pendingMediaObjectUrl) URL.revokeObjectURL(pendingMediaObjectUrl);
  pendingMediaObjectUrl = null;
  if (!file) {
    mediaPreview.hidden = true;
    return;
  }
  pendingMediaObjectUrl = URL.createObjectURL(file);
  mediaPreviewImage.src = pendingMediaObjectUrl;
  mediaPreview.hidden = false;
});

mediaUploadButton.addEventListener("click", async () => {
  if (!adminToolsEnabled() || !activeMediaEntity) return;
  const file = mediaFileInput.files?.[0];
  if (!file) {
    showNotification("Choisis d’abord une image.", "error");
    return;
  }

  mediaUploadButton.disabled = true;
  mediaUploadButton.textContent = "Optimisation...";

  try {
    const blob = await compressImage(file);
    const { entityType, entityId, entity } = activeMediaEntity;
    const folder = entityType === "marker" ? "markers" : "zones";
    const path = `${folder}/${entityId}/${Date.now()}-${getSafeFileName(file.name.replace(/\.[^.]+$/, ""))}.webp`;

    mediaUploadButton.textContent = "Envoi...";
    const { error: uploadError } = await supabaseClient.storage
      .from("atlas-media")
      .upload(path, blob, { contentType: "image/webp", upsert: false });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabaseClient.storage.from("atlas-media").getPublicUrl(path);
    const existing = getEntityImages(entityType, entityId);
    const shouldBePrimary = mediaPrimaryInput.checked || existing.length === 0;

    if (shouldBePrimary && existing.length > 0) {
      await supabaseClient
        .from("atlas_media")
        .update({ is_primary: false })
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);
    }

    const { error: insertError } = await supabaseClient.from("atlas_media").insert([{
      entity_type: entityType,
      entity_id: Number(entityId),
      storage_path: path,
      public_url: publicData.publicUrl,
      media_type: "image",
      title: mediaTitleInput.value.trim() || null,
      description: null,
      is_primary: shouldBePrimary,
      author: playerName,
      uploaded_by: adminUser?.id || null
    }]);

    if (insertError) {
      await supabaseClient.storage.from("atlas-media").remove([path]);
      throw insertError;
    }

    mediaFileInput.value = "";
    mediaTitleInput.value = "";
    mediaPrimaryInput.checked = false;
    mediaPreview.hidden = true;
    mediaPreviewImage.removeAttribute("src");
    if (pendingMediaObjectUrl) URL.revokeObjectURL(pendingMediaObjectUrl);
    pendingMediaObjectUrl = null;
    showNotification(`Image ajoutée à « ${entity.name || "la fiche"} ».`);
    await loadMedia();
  } catch (error) {
    console.error("Erreur média :", error);
    showNotification(`Envoi impossible : ${error.message}`, "error");
  } finally {
    mediaUploadButton.disabled = false;
    mediaUploadButton.textContent = "Envoyer l’image";
  }
});


function getDocumentExtension(fileName) {
  const match = String(fileName || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

function validateDocument(file) {
  const allowedExtensions = new Set(["pdf", "docx", "xlsx", "txt"]);
  const extension = getDocumentExtension(file.name);

  if (!allowedExtensions.has(extension)) {
    throw new Error("Format refusé. Utilise PDF, DOCX, XLSX ou TXT.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Le document dépasse la limite de 10 Mo.");
  }

  return extension;
}

function getDocumentIcon(fileName) {
  const extension = getDocumentExtension(fileName);

  if (extension === "pdf") return "📕";
  if (extension === "docx") return "📘";
  if (extension === "xlsx") return "📗";
  if (extension === "txt") return "📄";

  return "📎";
}

function formatFileSize(size) {
  const bytes = Number(size || 0);

  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function renderDocumentList() {
  if (!activeMediaEntity) return;

  const { entityType, entityId } = activeMediaEntity;
  const list = getEntityDocuments(entityType, entityId);

  documentCountElement.textContent =
    `${list.length} document${list.length > 1 ? "s" : ""}`;

  documentList.innerHTML = "";

  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-results";
    empty.textContent = "Aucun document pour cette fiche.";
    documentList.appendChild(empty);
    return;
  }

  list.forEach((documentRecord) => {
    const row = document.createElement("article");
    row.className = "document-item";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "document-open-button";
    openButton.addEventListener("click", () => {
      window.open(
        documentRecord.public_url,
        "_blank",
        "noopener,noreferrer"
      );
    });

    const icon = document.createElement("span");
    icon.className = "document-icon";
    icon.textContent = getDocumentIcon(
      documentRecord.storage_path || documentRecord.title
    );

    const information = document.createElement("span");
    information.className = "document-information";

    const title = document.createElement("strong");
    title.textContent =
      documentRecord.title ||
      String(documentRecord.storage_path || "Document")
        .split("/")
        .pop();

    const meta = document.createElement("small");
    meta.textContent = [
      documentRecord.description || null,
      documentRecord.author ? `par ${documentRecord.author}` : null
    ].filter(Boolean).join(" · ");

    information.append(title, meta);
    openButton.append(icon, information);
    row.appendChild(openButton);

    if (adminToolsEnabled()) {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "document-delete-button danger-button";
      deleteButton.textContent = "Supprimer";
      deleteButton.addEventListener("click", () => deleteDocument(documentRecord));
      row.appendChild(deleteButton);
    }

    documentList.appendChild(row);
  });
}

async function deleteDocument(documentRecord) {
  if (
    !adminToolsEnabled() ||
    !window.confirm("Supprimer définitivement ce document ?")
  ) {
    return;
  }

  const { error: storageError } = await supabaseClient.storage
    .from("atlas-media")
    .remove([documentRecord.storage_path]);

  if (storageError) {
    showNotification(
      `Suppression du fichier impossible : ${storageError.message}`,
      "error"
    );
    return;
  }

  const { error } = await supabaseClient
    .from("atlas_media")
    .delete()
    .eq("id", documentRecord.id);

  if (error) {
    showNotification(
      `Suppression de la pièce jointe impossible : ${error.message}`,
      "error"
    );
    return;
  }

  showNotification("Document supprimé.");
  await loadMedia();
}

documentUploadButton.addEventListener("click", async () => {
  if (!adminToolsEnabled() || !activeMediaEntity) return;

  const file = documentFileInput.files?.[0];

  if (!file) {
    showNotification("Choisis d’abord un document.", "error");
    return;
  }

  documentUploadButton.disabled = true;
  documentUploadButton.textContent = "Envoi...";

  try {
    const extension = validateDocument(file);
    const { entityType, entityId, entity } = activeMediaEntity;
    const folder = entityType === "marker" ? "markers" : "zones";

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const path =
      `documents/${folder}/${entityId}/${Date.now()}-` +
      `${getSafeFileName(baseName)}.${extension}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("atlas-media")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabaseClient.storage
      .from("atlas-media")
      .getPublicUrl(path);

    const title = documentTitleInput.value.trim() || file.name;

    const { error: insertError } = await supabaseClient
      .from("atlas_media")
      .insert([{
        entity_type: entityType,
        entity_id: Number(entityId),
        storage_path: path,
        public_url: publicData.publicUrl,
        media_type: "document",
        title,
        description: formatFileSize(file.size),
        is_primary: false,
        author: playerName,
        uploaded_by: adminUser?.id || null
      }]);

    if (insertError) {
      await supabaseClient.storage
        .from("atlas-media")
        .remove([path]);

      throw insertError;
    }

    documentFileInput.value = "";
    documentTitleInput.value = "";

    showNotification(
      `Document ajouté à « ${entity.name || "la fiche"} ».`
    );

    await loadMedia();
  } catch (error) {
    console.error("Erreur document :", error);
    showNotification(
      `Envoi impossible : ${error.message}`,
      "error"
    );
  } finally {
    documentUploadButton.disabled = false;
    documentUploadButton.textContent = "Envoyer le document";
  }
});

document.querySelectorAll("[data-media-close]").forEach((button) => {
  button.addEventListener("click", closeMediaModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !mediaModal.hidden) closeMediaModal();
});

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

function adminToolsEnabled() {
  return isAdmin && !visitorMode;
}

function setAdminDrawer(open) {
  adminDrawerOpen = Boolean(open);
  adminDrawer.classList.toggle("is-open", adminDrawerOpen);
  adminDrawerToggle.classList.toggle("is-hidden", adminDrawerOpen);
  adminDrawerToggle.setAttribute("aria-expanded", String(adminDrawerOpen));
}

function setVisitorMode(enabled, { collapse = true } = {}) {
  visitorMode = isAdmin && Boolean(enabled);
  adminModeInput.checked = !visitorMode;
  visitorModeInput.checked = visitorMode;
  visitorModeBadge.hidden = !visitorMode;
  document.body.classList.toggle("visitor-mode-active", visitorMode);

  if (visitorMode && collapse) {
    setAdminDrawer(false);
  }

  refreshInterface();
  renderZones();
  renderMediaGallery();
}

adminDrawerToggle.addEventListener("click", () => setAdminDrawer(true));
adminDrawerClose.addEventListener("click", () => setAdminDrawer(false));
adminModeInput.addEventListener("change", () => {
  if (adminModeInput.checked) setVisitorMode(false, { collapse: false });
});
visitorModeInput.addEventListener("change", () => {
  if (visitorModeInput.checked) setVisitorMode(true);
});
showHistoryInput.addEventListener("change", () => {
  showHistories = showHistoryInput.checked;
  sessionStorage.setItem("atlas_show_histories", String(showHistories));
  document.body.classList.toggle("show-admin-histories", adminToolsEnabled() && showHistories);
  refreshInterface();
  renderZones();
});

/* =========================================================
   ADMINISTRATION
   ========================================================= */

function updateAdminInterface() {
  adminLoginForm.hidden = isAdmin;
  adminSession.hidden = !isAdmin;
  adminBadge.textContent = isAdmin ? "Admin connecté" : "Déconnecté";
  adminBadge.classList.toggle("is-connected", isAdmin);

  if (!isAdmin) {
    visitorMode = false;
    adminModeInput.checked = true;
    visitorModeInput.checked = false;
    visitorModeBadge.hidden = true;
    document.body.classList.remove("visitor-mode-active", "show-admin-histories");
  } else {
    visitorModeBadge.hidden = !visitorMode;
    document.body.classList.toggle("visitor-mode-active", visitorMode);
    document.body.classList.toggle("show-admin-histories", adminToolsEnabled() && showHistories);
  }

  if (adminTrashGroup) {
    adminTrashGroup.hidden = !adminToolsEnabled();
  }

  if (adminDeletionRequestsGroup) {
    adminDeletionRequestsGroup.hidden = !adminToolsEnabled();
  }

  if (adminToolsEnabled()) {
    loadTrash();
    loadDeletionRequests();
  } else {
    trashedMarkers = [];
    trashedZones = [];
    deletionRequests = [];
    renderTrash();
    renderDeletionRequests();
  }

  refreshInterface();
  renderZones();
  renderMediaGallery();
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
  visitorMode = false;
  adminPasswordInput.value = "";
  updateAdminInterface();
  showNotification("Connexion administrateur réussie.");
});

adminLogoutButton.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  adminUser = null;
  isAdmin = false;
  visitorMode = false;
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
  if (!adminToolsEnabled()) return;
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
  if (!adminToolsEnabled()) return;
  const place = findPlaceByIdentifier(identifier);
  if (!place) return;
  movingMarkerId = place.id;
  map.closePopup();
  locationStatus.textContent = `Déplacement de « ${place.name} » : clique sur sa nouvelle position.`;
  locationStatus.classList.add("location-selected", "admin-moving");
  showNotification("Clique sur la nouvelle position du marqueur.");
}

async function deleteMarker(identifier) {
  if (!adminToolsEnabled()) return;

  const place = findPlaceByIdentifier(identifier);
  if (!place) return;

  if (!window.confirm(`Déplacer « ${place.name} » dans la corbeille ?`)) {
    return;
  }

  const deletedAt = new Date().toISOString();

  const { error } = await supabaseClient
    .from("markers")
    .update({
      deleted_at: deletedAt,
      deleted_by: adminUser?.id || null,
      deleted_by_name: playerName || "Administrateur"
    })
    .eq("id", place.id);

  if (error) {
    showNotification(
      `Déplacement dans la corbeille impossible : ${error.message}`,
      "error"
    );
    return;
  }

  map.closePopup();
  await Promise.all([loadMarkers(), loadTrash()]);
  showNotification("Marqueur déplacé dans la corbeille.");
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
   CALQUES PERSONNALISÉS
   ========================================================= */

function loadLayerSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("atlas_rp_layers") || "null");
    if (saved && typeof saved === "object") {
      layerSettings.markers = saved.markers !== false;
      layerSettings.zones = saved.zones !== false;
      Object.keys(CATEGORIES).forEach((key) => {
        layerSettings.categories[key] = saved.categories?.[key] !== false;
      });
    }
  } catch (error) {
    console.warn("Préférences de calques invalides :", error);
  }
}

function saveLayerSettings() {
  localStorage.setItem("atlas_rp_layers", JSON.stringify(layerSettings));
}

function applyLayerSettingsToExistingFilters() {
  Object.keys(CATEGORIES).forEach((categoryKey) => {
    const enabled = layerSettings.categories[categoryKey] !== false;
    const parent = document.querySelector(`.category-filter[value="${categoryKey}"]`);
    if (parent) {
      parent.checked = enabled;
      parent.indeterminate = false;
    }
    document.querySelectorAll(`.subcategory-filter[data-category="${categoryKey}"]`).forEach((child) => {
      child.checked = enabled;
    });
  });
}

function createLayerControls() {
  layerMarkersCheckbox.checked = layerSettings.markers;
  layerZonesCheckbox.checked = layerSettings.zones;
  showZonesCheckbox.checked = layerSettings.zones;
  layerCategoryList.innerHTML = "";

  Object.entries(CATEGORIES).forEach(([categoryKey, categoryData]) => {
    const label = document.createElement("label");
    label.className = "layer-switch-row layer-category-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.layerCategory = categoryKey;
    checkbox.checked = layerSettings.categories[categoryKey] !== false;

    const text = document.createElement("span");
    text.textContent = `${categoryData.icon} ${categoryData.label}`;

    label.appendChild(checkbox);
    label.appendChild(text);
    layerCategoryList.appendChild(label);

    checkbox.addEventListener("change", () => {
      layerSettings.categories[categoryKey] = checkbox.checked;
      const parent = document.querySelector(`.category-filter[value="${categoryKey}"]`);
      if (parent) {
        parent.checked = checkbox.checked;
        parent.indeterminate = false;
      }
      document.querySelectorAll(`.subcategory-filter[data-category="${categoryKey}"]`).forEach((child) => {
        child.checked = checkbox.checked;
      });
      saveLayerSettings();
      refreshInterface();
    });
  });
}

function syncLayerCategoryFromFilters(categoryKey) {
  const parent = document.querySelector(`.category-filter[value="${categoryKey}"]`);
  if (!parent) return;
  const enabled = parent.checked || parent.indeterminate;
  layerSettings.categories[categoryKey] = enabled;
  const layerCheckbox = document.querySelector(`[data-layer-category="${categoryKey}"]`);
  if (layerCheckbox) layerCheckbox.checked = enabled;
  saveLayerSettings();
}

layerMarkersCheckbox.addEventListener("change", () => {
  layerSettings.markers = layerMarkersCheckbox.checked;
  saveLayerSettings();
  refreshInterface();
});

layerZonesCheckbox.addEventListener("change", () => {
  layerSettings.zones = layerZonesCheckbox.checked;
  showZonesCheckbox.checked = layerSettings.zones;
  saveLayerSettings();
  renderZones();
});

resetLayersButton.addEventListener("click", () => {
  layerSettings = JSON.parse(JSON.stringify(DEFAULT_LAYER_SETTINGS));
  saveLayerSettings();
  createLayerControls();
  applyLayerSettingsToExistingFilters();
  refreshInterface();
  showNotification("Affichage des calques réinitialisé.");
});


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

          syncLayerCategoryFromFilters(categoryKey);
          refreshInterface();
        }
      );
    } else {
      categoryCheckbox.addEventListener(
        "change",
        () => {
          syncLayerCategoryFromFilters(categoryKey);
          refreshInterface();
        }
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
          syncLayerCategoryFromFilters(checkbox.dataset.category);

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
  if (layerSettings.categories[place.category] === false) {
    return false;
  }

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
    layerSettings.markers ? getVisiblePlaces().length : 0;

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

      ${createPopupMedia("marker", place.id)}

      <div class="popup-description">
        ${description}
      </div>

      ${adminToolsEnabled() ? `
        <div class="popup-admin-actions">
          <button type="button" data-admin-edit="${escapeHtml(identifier)}">Modifier</button>
          <button type="button" data-admin-move="${escapeHtml(identifier)}">Déplacer</button>
          <button type="button" data-media-open="marker" data-media-entity-id="${escapeHtml(place.id)}">Images</button>
          <button type="button" class="danger-button" data-admin-delete="${escapeHtml(identifier)}">Supprimer</button>
        </div>
      ` : `
        <div class="popup-user-actions">
          <button
            type="button"
            class="request-deletion-button"
            data-request-deletion-type="marker"
            data-request-deletion-id="${escapeHtml(place.id)}"
            data-request-deletion-name="${escapeHtml(place.name)}"
          >
            🗑️ Demander la suppression
          </button>
        </div>
      `}

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

  if (!layerSettings.markers) {
    return;
  }

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

  popupElement?.querySelectorAll("[data-media-open]").forEach((button) => {
    button.addEventListener("click", () => {
      openMediaModal(button.dataset.mediaOpen, button.dataset.mediaEntityId);
    });
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

  popupElement?.querySelector("[data-zone-edit]")?.addEventListener("click", (e) => {
    const zone = zones.find((item) => String(item.id) === String(e.currentTarget.dataset.zoneEdit));
    if (zone) enterZoneEditMode(zone, true);
  });

  popupElement?.querySelector("[data-zone-shape-edit]")?.addEventListener("click", (e) => {
    startZoneGeometryEdit(e.currentTarget.dataset.zoneShapeEdit);
  });

  popupElement?.querySelector("[data-zone-delete]")?.addEventListener("click", (e) => {
    deleteZone(e.currentTarget.dataset.zoneDelete);
  });

  popupElement
    ?.querySelector("[data-request-deletion-type]")
    ?.addEventListener("click", (e) => {
      const button = e.currentTarget;
      submitDeletionRequest(
        button.dataset.requestDeletionType,
        button.dataset.requestDeletionId,
        button.dataset.requestDeletionName
      );
    });
});

function refreshInterface() {
  renderMarkers();
  renderSearchResults();
  renderFavorites();
  updateVisibleMarkerCount();

  // Ne détruit pas la couche pendant que l'admin déplace/ajoute des sommets.
  if (!geometryEditingZoneId) {
    renderZones();
  }
}

/* =========================================================
   SUPABASE
   ========================================================= */

async function loadMarkers() {
  const { data, error } =
    await supabaseClient
      .from("markers")
      .select("*")
      .is("deleted_at", null)
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
  if (pendingZoneLayer) {
    temporaryZoneLayer.removeLayer(pendingZoneLayer);
  }

  pendingZoneLayer = null;
  editingZoneId = null;
  saveZoneButton.textContent = "Enregistrer la zone";

  const liveZoneForm = document.getElementById("zone-form");
  const liveZoneStatus = document.getElementById("zone-status");

  if (liveZoneForm) {
    liveZoneForm.hidden = true;
    liveZoneForm.setAttribute("hidden", "");
    liveZoneForm.style.display = "none";

    if (resetForm) {
      liveZoneForm.reset();
    }
  }

  if (liveZoneStatus) {
    liveZoneStatus.textContent =
      "Dessine une forme avec la barre d’outils de la carte.";
    liveZoneStatus.classList.remove("location-selected");
  }

  editSelectedZoneButton.hidden = !(adminToolsEnabled() && selectedZoneId);
  deleteSelectedZoneButton.hidden = !(adminToolsEnabled() && selectedZoneId);
  updateZoneGeometryControls();
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
      ${createPopupMedia("zone", zone.id)}
      <div class="popup-description">${description}</div>
      ${adminToolsEnabled() ? `<div class="popup-admin-actions zone-admin-actions"><button type="button" class="zone-edit-button" data-zone-edit="${zone.id}">Modifier les infos</button><button type="button" class="zone-shape-button" data-zone-shape-edit="${zone.id}">Modifier la forme</button><button type="button" data-media-open="zone" data-media-entity-id="${zone.id}">Images</button><button type="button" class="danger-button" data-zone-delete="${zone.id}">Supprimer la zone</button></div>` : `<div class="popup-user-actions"><button type="button" class="request-deletion-button" data-request-deletion-type="zone" data-request-deletion-id="${zone.id}" data-request-deletion-name="${escapeHtml(zone.name)}">🗑️ Demander la suppression</button></div>`}
      <footer class="marker-popup-footer"><span>Ajoutée par <strong>${escapeHtml(zone.author || "Inconnu")}</strong></span></footer>
    </article>`;
}

function passesZoneFilters(zone) {
  if (layerSettings.categories[zone.category] === false) {
    return false;
  }

  const categoryCheckbox = document.querySelector(
    `.category-filter[value="${zone.category}"]`
  );

  if (!categoryCheckbox || !categoryCheckbox.checked) {
    return false;
  }

  const categoryData = CATEGORIES[zone.category];

  if (!categoryData || categoryData.subcategories.length === 0) {
    return true;
  }

  if (!zone.subcategory) {
    return true;
  }

  const subcategoryCheckbox = Array.from(
    document.querySelectorAll(
      `.subcategory-filter[data-category="${zone.category}"]`
    )
  ).find((checkbox) => checkbox.value === zone.subcategory);

  return !subcategoryCheckbox || subcategoryCheckbox.checked;
}

function getVisibleZones() {
  return zones.filter(passesZoneFilters);
}

function showZoneForm() {
  zoneForm.hidden = false;
  zoneForm.removeAttribute("hidden");
  zoneForm.style.display = "block";
}

function enterZoneEditMode(zone, scrollToForm = false) {
  if (!adminToolsEnabled() || !zone) return;

  if (pendingZoneLayer) {
    temporaryZoneLayer.removeLayer(pendingZoneLayer);
    pendingZoneLayer = null;
  }

  editingZoneId = String(zone.id);
  selectedZoneId = String(zone.id);

  zoneNameInput.value = zone.name || "";
  zoneCategorySelect.value = zone.category || "autre";
  updateZoneSubcategorySelect();

  if (zone.subcategory) {
    zoneSubcategorySelect.value = zone.subcategory;
  }

  zoneDescriptionInput.value = zone.description || "";
  updateZoneColorPreview();

  showZoneForm();
  saveZoneButton.textContent = "Enregistrer les modifications";
  zoneStatus.textContent = `Modification de « ${zone.name || "Zone"} ».`;
  zoneStatus.classList.add("location-selected");

  editSelectedZoneButton.hidden = true;
  deleteSelectedZoneButton.hidden = false;

  if (scrollToForm) {
    zoneForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
    window.setTimeout(() => zoneNameInput.focus(), 200);
  }
}

function selectZone(zoneId, openPopup = true) {
  selectedZoneId = String(zoneId);

  zoneInstances.forEach((layer, id) => {
    if (!layer?.setStyle) return;
    const zone = zones.find((item) => String(item.id) === String(id));
    if (!zone) return;
    const style = zoneStyle(zone);
    layer.setStyle({
      ...style,
      weight: String(id) === selectedZoneId ? 6 : style.weight
    });
  });

  renderZoneList();

  const layer = zoneInstances.get(selectedZoneId);
  if (layer) {
    layer.bringToFront?.();
    if (openPopup) layer.openPopup();
  }

  editSelectedZoneButton.hidden = !(adminToolsEnabled() && selectedZoneId);
  deleteSelectedZoneButton.hidden = !(adminToolsEnabled() && selectedZoneId);
  updateZoneGeometryControls();

  if (adminToolsEnabled() && !pendingZoneLayer && !geometryEditingZoneId) {
    const selectedZone = zones.find((item) => String(item.id) === selectedZoneId);
    if (selectedZone) enterZoneEditMode(selectedZone, false);
  }
}

function updateZoneGeometryControls() {
  const hasSelection = Boolean(adminToolsEnabled() && selectedZoneId);
  const isEditingShape = Boolean(geometryEditingZoneId);

  editZoneShapeButton.hidden = !hasSelection || isEditingShape;
  zoneShapeEditActions.hidden = !isEditingShape;

  editSelectedZoneButton.disabled = isEditingShape;
  deleteSelectedZoneButton.disabled = isEditingShape;
}

function startZoneGeometryEdit(zoneId) {
  if (!adminToolsEnabled()) {
    showNotification("La modification de forme est réservée aux administrateurs.", "error");
    return;
  }

  const id = String(zoneId || selectedZoneId || "");
  const zone = zones.find((item) => String(item.id) === id);
  const layer = zoneInstances.get(id);

  if (!zone || !layer || !layer.editing) {
    showNotification("Impossible d'éditer cette zone. Recharge la page puis réessaie.", "error");
    return;
  }

  if (geometryEditingZoneId) {
    cancelZoneGeometryEdit();
  }

  if (editingZoneId) {
    cancelPendingZone();
  }

  selectedZoneId = id;
  geometryEditingZoneId = id;
  geometryEditingLayer = layer;
  geometryOriginalCoordinates = zone.coordinates.map((point) => [Number(point[0]), Number(point[1])]);

  map.closePopup();
  layer.bringToFront?.();
  layer.editing.enable();
  layer.setStyle({ ...zoneStyle(zone), weight: 6, dashArray: "8 6" });

  zoneStatus.textContent =
    `Modification de la forme de « ${zone.name} » : déplace les sommets, tire un petit point intermédiaire pour en créer un nouveau, ou clique sur un sommet pour le retirer.`;
  zoneStatus.classList.add("location-selected");

  updateZoneGeometryControls();
  showNotification("Mode édition activé : tu peux ajouter, déplacer ou supprimer des sommets.");
}

async function saveZoneGeometryEdit() {
  if (!adminToolsEnabled() || !geometryEditingZoneId || !geometryEditingLayer) return;

  const coordinates = serializeZoneCoordinates(geometryEditingLayer);

  if (coordinates.length < 3) {
    showNotification("Une polyzone doit conserver au moins trois sommets.", "error");
    return;
  }

  saveZoneShapeButton.disabled = true;
  saveZoneShapeButton.textContent = "Enregistrement...";

  const { error } = await supabaseClient
    .from("zones")
    .update({
      coordinates,
      updated_at: new Date().toISOString()
    })
    .eq("id", geometryEditingZoneId);

  saveZoneShapeButton.disabled = false;
  saveZoneShapeButton.textContent = "Enregistrer la forme";

  if (error) {
    console.error("Erreur modification forme zone :", error);
    showNotification(`Impossible d'enregistrer la forme : ${error.message}`, "error");
    return;
  }

  geometryEditingLayer.editing.disable();
  geometryEditingZoneId = null;
  geometryEditingLayer = null;
  geometryOriginalCoordinates = null;
  zoneShapeEditActions.hidden = true;

  zoneStatus.textContent = "Dessine une forme avec la barre d’outils de la carte.";
  zoneStatus.classList.remove("location-selected");

  showNotification("La nouvelle forme de la zone a été enregistrée.");
  await loadZones();
  updateZoneGeometryControls();
}

function cancelZoneGeometryEdit() {
  if (!geometryEditingZoneId || !geometryEditingLayer) return;

  geometryEditingLayer.editing?.disable();

  if (geometryOriginalCoordinates) {
    geometryEditingLayer.setLatLngs(geometryOriginalCoordinates);
    geometryEditingLayer.redraw?.();
  }

  geometryEditingZoneId = null;
  geometryEditingLayer = null;
  geometryOriginalCoordinates = null;

  zoneStatus.textContent = "Dessine une forme avec la barre d’outils de la carte.";
  zoneStatus.classList.remove("location-selected");

  renderZones();
  updateZoneGeometryControls();
  showNotification("Modification de la forme annulée.");
}

function renderZoneList() {
  zoneListElement.innerHTML = "";

  const visibleZones = getVisibleZones();

  if (visibleZones.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-results";
    empty.textContent = zones.length === 0
      ? "Aucune zone enregistrée."
      : "Aucune zone ne correspond aux filtres sélectionnés.";
    zoneListElement.appendChild(empty);
    editSelectedZoneButton.hidden = true;
    deleteSelectedZoneButton.hidden = true;
    return;
  }

  visibleZones.forEach((zone) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "zone-list-item";
    if (String(zone.id) === String(selectedZoneId)) {
      button.classList.add("zone-list-item-selected");
    }

    const color = document.createElement("span");
    color.className = "zone-list-color";
    color.style.background = zone.color || "#3273ea";

    const text = document.createElement("span");
    text.className = "zone-list-text";

    const name = document.createElement("strong");
    name.textContent = zone.name || "Zone sans nom";

    const detail = document.createElement("small");
    const category = getCategoryData(zone.category);
    detail.textContent = [category.label, zone.subcategory].filter(Boolean).join(" · ");

    text.appendChild(name);
    text.appendChild(detail);
    button.appendChild(color);
    button.appendChild(text);

    button.addEventListener("click", () => {
      selectZone(zone.id, true);
      const layer = zoneInstances.get(String(zone.id));
      if (layer) {
        map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 0 });
      }
    });

    zoneListElement.appendChild(button);
  });

  editSelectedZoneButton.hidden = !(adminToolsEnabled() && selectedZoneId);
  deleteSelectedZoneButton.hidden = !(adminToolsEnabled() && selectedZoneId);
}

function renderZones() {
  if (geometryEditingZoneId) {
    updateZoneGeometryControls();
    return;
  }

  zonesLayer.clearLayers();
  zoneInstances.clear();

  const visibleZones = getVisibleZones();
  zoneCountElement.textContent = visibleZones.length === zones.length
    ? `${zones.length} zone${zones.length > 1 ? "s" : ""}`
    : `${visibleZones.length} / ${zones.length}`;

  if (!layerSettings.zones || !showZonesCheckbox.checked) {
    renderZoneList();
    return;
  }

  visibleZones.forEach((zone) => {
    if (!Array.isArray(zone.coordinates) || zone.coordinates.length < 3) return;

    const polygon = L.polygon(zone.coordinates, zoneStyle(zone));
    polygon.bindPopup(createZonePopup(zone), { maxWidth: 340 });
    polygon.bindTooltip(escapeHtml(zone.name), {
      permanent: false,
      direction: "center",
      className: "zone-tooltip"
    });

    polygon.on("click", () => {
      selectZone(zone.id, false);
    });

    polygon.addTo(zonesLayer);
    zoneInstances.set(String(zone.id), polygon);
  });

  if (selectedZoneId && zoneInstances.has(String(selectedZoneId))) {
    selectZone(selectedZoneId, false);
  } else if (selectedZoneId) {
    selectedZoneId = null;
    editingZoneId = null;
    editSelectedZoneButton.hidden = true;
    deleteSelectedZoneButton.hidden = true;
  }

  renderZoneList();
}

async function loadZones() {
  const { data, error } = await supabaseClient
    .from("zones")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
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
showZonesCheckbox.addEventListener("change", () => {
  layerSettings.zones = showZonesCheckbox.checked;
  layerZonesCheckbox.checked = layerSettings.zones;
  saveLayerSettings();
  renderZones();
});

editSelectedZoneButton.addEventListener("click", () => {
  const zone = zones.find((item) => String(item.id) === String(selectedZoneId));
  if (!zone) {
    showNotification("Sélectionne d’abord une zone enregistrée.", "error");
    return;
  }
  enterZoneEditMode(zone, true);
});

editZoneShapeButton.addEventListener("click", () => {
  startZoneGeometryEdit(selectedZoneId);
});

saveZoneShapeButton.addEventListener("click", saveZoneGeometryEdit);
cancelZoneShapeButton.addEventListener("click", cancelZoneGeometryEdit);
cancelZoneButton.addEventListener("click", () => cancelPendingZone());

deleteSelectedZoneButton.addEventListener("click", () => {
  if (!selectedZoneId) {
    showNotification("Sélectionne d’abord une zone enregistrée.", "error");
    return;
  }
  deleteZone(selectedZoneId);
});

zoneForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const category = zoneCategorySelect.value;
  const subcategory = zoneSubcategoryField.hidden ? null : zoneSubcategorySelect.value;
  const basePayload = {
    name: zoneNameInput.value.trim(),
    description: zoneDescriptionInput.value.trim(),
    category,
    subcategory,
    color: getZoneColor(category, subcategory)
  };

  saveZoneButton.disabled = true;
  saveZoneButton.textContent = editingZoneId ? "Mise à jour..." : "Enregistrement...";

  let error = null;

  if (editingZoneId) {
    const result = await supabaseClient
      .from("zones")
      .update({ ...basePayload, updated_at: new Date().toISOString() })
      .eq("id", editingZoneId);
    error = result.error;
  } else {
    if (!pendingZoneLayer) {
      saveZoneButton.disabled = false;
      saveZoneButton.textContent = "Enregistrer la zone";
      showNotification("Dessine d’abord une zone sur la carte.", "error");
      return;
    }

    const payload = {
      ...basePayload,
      coordinates: serializeZoneCoordinates(pendingZoneLayer),
      author: playerName,
      created_by: adminUser?.id || null
    };

    const result = await supabaseClient.from("zones").insert([payload]);
    error = result.error;
  }

  saveZoneButton.disabled = false;
  saveZoneButton.textContent = "Enregistrer la zone";

  if (error) {
    console.error("Erreur sauvegarde zone :", error);
    showNotification(`Impossible d’enregistrer la zone : ${error.message}`, "error");
    return;
  }

  const message = editingZoneId
    ? `La zone « ${basePayload.name} » a été modifiée.`
    : `La zone « ${basePayload.name} » a été ajoutée.`;

  cancelPendingZone();
  showNotification(message);
  await loadZones();
});

async function deleteZone(id) {
  if (!adminToolsEnabled()) return;

  if (geometryEditingZoneId) {
    showNotification(
      "Enregistre ou annule d'abord la modification de forme.",
      "error"
    );
    return;
  }

  const zone = zones.find((item) => String(item.id) === String(id));

  if (
    !zone ||
    !window.confirm(`Déplacer la zone « ${zone.name} » dans la corbeille ?`)
  ) {
    return;
  }

  const deletedAt = new Date().toISOString();

  const { error } = await supabaseClient
    .from("zones")
    .update({
      deleted_at: deletedAt,
      deleted_by: adminUser?.id || null,
      deleted_by_name: playerName || "Administrateur",
      updated_at: deletedAt
    })
    .eq("id", zone.id);

  if (error) {
    showNotification(
      `Déplacement dans la corbeille impossible : ${error.message}`,
      "error"
    );
    return;
  }

  map.closePopup();
  selectedZoneId = null;
  editingZoneId = null;
  editSelectedZoneButton.hidden = true;
  deleteSelectedZoneButton.hidden = true;

  await Promise.all([loadZones(), loadTrash()]);
  showNotification("Zone déplacée dans la corbeille.");
}

/* =========================================================
   DEMANDES DE SUPPRESSION v0.8.6
   ========================================================= */

async function submitDeletionRequest(entityType, entityId, entityName) {
  const reason = window.prompt(
    `Pourquoi souhaites-tu demander la suppression de « ${entityName} » ?`
  );

  if (reason === null) return;

  const cleanReason = reason.trim();

  if (!cleanReason) {
    showNotification("Indique une raison pour la demande.", "error");
    return;
  }

  const { error } = await supabaseClient
    .from("deletion_requests")
    .insert([{
      entity_type: entityType,
      entity_id: Number(entityId),
      entity_name: String(entityName || "Élément sans nom").slice(0, 150),
      requester_name: String(playerName || "Anonyme").slice(0, 50),
      reason: cleanReason.slice(0, 1000)
    }]);

  if (error) {
    if (error.code === "23505") {
      showNotification(
        "Une demande de suppression est déjà en attente pour cet élément.",
        "error"
      );
    } else {
      showNotification(`Demande impossible : ${error.message}`, "error");
    }
    return;
  }

  map.closePopup();
  showNotification("Demande de suppression envoyée à l’administrateur.");
}

function renderDeletionRequests() {
  if (!adminDeletionRequestList || !adminDeletionRequestCount) return;

  adminDeletionRequestCount.textContent =
    `${deletionRequests.length} demande${deletionRequests.length > 1 ? "s" : ""}`;

  adminDeletionRequestList.innerHTML = "";

  if (!adminToolsEnabled()) {
    const message = document.createElement("p");
    message.className = "empty-results";
    message.textContent = "Passe en mode Administrateur pour consulter les demandes.";
    adminDeletionRequestList.appendChild(message);
    return;
  }

  if (deletionRequests.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-results";
    message.textContent = "Aucune demande en attente.";
    adminDeletionRequestList.appendChild(message);
    return;
  }

  deletionRequests.forEach((request) => {
    const card = document.createElement("article");
    card.className = "admin-request-item";

    const header = document.createElement("div");
    header.className = "admin-request-item-header";

    const titleBlock = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = request.entity_name || "Élément sans nom";

    const type = document.createElement("small");
    type.textContent = request.entity_type === "zone" ? "Polyzone" : "Marqueur";

    titleBlock.append(title, type);

    const date = document.createElement("time");
    date.textContent = request.created_at
      ? new Date(request.created_at).toLocaleString("fr-FR")
      : "Date inconnue";

    header.append(titleBlock, date);

    const requester = document.createElement("p");
    requester.className = "admin-request-meta";
    requester.textContent =
      `Demandé par ${request.requester_name || "Anonyme"}`;

    const reason = document.createElement("p");
    reason.className = "admin-request-reason";
    reason.textContent = request.reason || "Aucune raison indiquée.";

    const actions = document.createElement("div");
    actions.className = "admin-request-actions";

    const approveButton = document.createElement("button");
    approveButton.type = "button";
    approveButton.className = "danger-button";
    approveButton.textContent = "Accepter";
    approveButton.addEventListener("click", () => {
      approveDeletionRequest(request);
    });

    const rejectButton = document.createElement("button");
    rejectButton.type = "button";
    rejectButton.className = "secondary-button";
    rejectButton.textContent = "Refuser";
    rejectButton.addEventListener("click", () => {
      rejectDeletionRequest(request);
    });

    actions.append(approveButton, rejectButton);
    card.append(header, requester, reason, actions);
    adminDeletionRequestList.appendChild(card);
  });
}

async function loadDeletionRequests() {
  if (!isAdmin) {
    deletionRequests = [];
    renderDeletionRequests();
    return;
  }

  const { data, error } = await supabaseClient
    .from("deletion_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Chargement des demandes impossible :", error);
    showNotification(`Demandes indisponibles : ${error.message}`, "error");
    return;
  }

  deletionRequests = Array.isArray(data) ? data : [];
  renderDeletionRequests();
}

async function setDeletionRequestStatus(requestId, status) {
  return supabaseClient
    .from("deletion_requests")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser?.id || null,
      reviewed_by_name: playerName || "Administrateur"
    })
    .eq("id", requestId);
}

async function approveDeletionRequest(request) {
  if (!adminToolsEnabled()) return;

  const confirmed = window.confirm(
    `Accepter la demande et déplacer « ${request.entity_name} » dans la corbeille ?`
  );

  if (!confirmed) return;

  const table = request.entity_type === "zone" ? "zones" : "markers";
  const now = new Date().toISOString();

  const changes = {
    deleted_at: now,
    deleted_by: adminUser?.id || null,
    deleted_by_name: playerName || "Administrateur"
  };

  if (request.entity_type === "zone") {
    changes.updated_at = now;
  }

  const { error: deletionError } = await supabaseClient
    .from(table)
    .update(changes)
    .eq("id", request.entity_id)
    .is("deleted_at", null);

  if (deletionError) {
    showNotification(
      `Validation impossible : ${deletionError.message}`,
      "error"
    );
    return;
  }

  const { error: requestError } = await setDeletionRequestStatus(
    request.id,
    "approved"
  );

  if (requestError) {
    showNotification(
      `Élément supprimé, mais la demande n’a pas pu être clôturée : ${requestError.message}`,
      "error"
    );
  }

  await Promise.all([
    loadMarkers(),
    loadZones(),
    loadTrash(),
    loadDeletionRequests()
  ]);

  showNotification("Demande acceptée : élément déplacé dans la corbeille.");
}

async function rejectDeletionRequest(request) {
  if (!adminToolsEnabled()) return;

  if (
    !window.confirm(
      `Refuser la demande de suppression de « ${request.entity_name} » ?`
    )
  ) {
    return;
  }

  const { error } = await setDeletionRequestStatus(request.id, "rejected");

  if (error) {
    showNotification(`Refus impossible : ${error.message}`, "error");
    return;
  }

  await loadDeletionRequests();
  showNotification("Demande refusée.");
}

adminDeletionRequestRefreshButton?.addEventListener(
  "click",
  loadDeletionRequests
);

/* =========================================================
   CORBEILLE ADMIN v0.8.5
   ========================================================= */

function getTrashEntries() {
  return [
    ...trashedMarkers.map((item) => ({
      ...item,
      trash_type: "marker",
      trash_label: "Marqueur"
    })),
    ...trashedZones.map((item) => ({
      ...item,
      trash_type: "zone",
      trash_label: "Polyzone"
    }))
  ].sort((a, b) =>
    new Date(b.deleted_at || 0) - new Date(a.deleted_at || 0)
  );
}

function renderTrash() {
  if (!adminTrashList || !adminTrashCount) return;

  const entries = getTrashEntries();

  adminTrashCount.textContent =
    `${entries.length} élément${entries.length > 1 ? "s" : ""}`;

  adminTrashList.innerHTML = "";

  if (!adminToolsEnabled()) {
    const message = document.createElement("p");
    message.className = "empty-results";
    message.textContent = "Passe en mode Administrateur pour accéder à la corbeille.";
    adminTrashList.appendChild(message);
    return;
  }

  if (entries.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-results";
    message.textContent = "La corbeille est vide.";
    adminTrashList.appendChild(message);
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "admin-trash-item";

    const header = document.createElement("div");
    header.className = "admin-trash-item-header";

    const titleBlock = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = entry.name || "Élément sans nom";

    const type = document.createElement("small");
    type.textContent = [
      entry.trash_label,
      getCategoryLabel(entry.category),
      entry.subcategory || null
    ].filter(Boolean).join(" · ");

    titleBlock.append(title, type);

    const date = document.createElement("time");
    date.textContent = entry.deleted_at
      ? new Date(entry.deleted_at).toLocaleString("fr-FR")
      : "Date inconnue";

    header.append(titleBlock, date);

    const meta = document.createElement("p");
    meta.className = "admin-trash-meta";
    meta.textContent =
      `Supprimé par ${entry.deleted_by_name || "Administrateur"}`;

    const actions = document.createElement("div");
    actions.className = "admin-trash-actions";

    const restoreButton = document.createElement("button");
    restoreButton.type = "button";
    restoreButton.className = "primary-button";
    restoreButton.textContent = "Restaurer";
    restoreButton.addEventListener("click", () => {
      restoreTrashEntry(entry.trash_type, entry.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button";
    deleteButton.textContent = "Supprimer définitivement";
    deleteButton.addEventListener("click", () => {
      permanentlyDeleteTrashEntry(entry.trash_type, entry.id);
    });

    actions.append(restoreButton, deleteButton);
    card.append(header, meta, actions);
    adminTrashList.appendChild(card);
  });
}

async function loadTrash() {
  if (!isAdmin) {
    trashedMarkers = [];
    trashedZones = [];
    renderTrash();
    return;
  }

  const [
    { data: markerData, error: markerError },
    { data: zoneData, error: zoneError }
  ] = await Promise.all([
    supabaseClient
      .from("markers")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),

    supabaseClient
      .from("zones")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
  ]);

  if (markerError || zoneError) {
    const message = markerError?.message || zoneError?.message;
    console.error("Chargement de la corbeille impossible :", markerError, zoneError);
    showNotification(`Corbeille indisponible : ${message}`, "error");
    return;
  }

  trashedMarkers = Array.isArray(markerData) ? markerData : [];
  trashedZones = Array.isArray(zoneData) ? zoneData : [];
  renderTrash();
}

async function restoreTrashEntry(type, id) {
  if (!adminToolsEnabled()) return;

  const table = type === "zone" ? "zones" : "markers";

  const changes = {
    deleted_at: null,
    deleted_by: null,
    deleted_by_name: null
  };

  if (type === "zone") {
    changes.updated_at = new Date().toISOString();
  }

  const { error } = await supabaseClient
    .from(table)
    .update(changes)
    .eq("id", id);

  if (error) {
    showNotification(`Restauration impossible : ${error.message}`, "error");
    return;
  }

  await Promise.all([loadMarkers(), loadZones(), loadTrash()]);
  showNotification(type === "zone" ? "Zone restaurée." : "Marqueur restauré.");
}

async function removeEntityMedia(type, id) {
  const entityType = type === "zone" ? "zone" : "marker";
  const related = mediaRecords.filter((media) =>
    media.entity_type === entityType &&
    String(media.entity_id) === String(id)
  );

  const paths = related
    .map((media) => media.storage_path)
    .filter(Boolean);

  if (paths.length > 0) {
    const { error: storageError } = await supabaseClient.storage
      .from("atlas-media")
      .remove(paths);

    if (storageError) {
      throw new Error(`Suppression des fichiers impossible : ${storageError.message}`);
    }
  }

  if (related.length > 0) {
    const { error: mediaError } = await supabaseClient
      .from("atlas_media")
      .delete()
      .eq("entity_type", entityType)
      .eq("entity_id", id);

    if (mediaError) {
      throw new Error(`Suppression des médias impossible : ${mediaError.message}`);
    }
  }
}

async function permanentlyDeleteTrashEntry(type, id) {
  if (!adminToolsEnabled()) return;

  const collection = type === "zone" ? trashedZones : trashedMarkers;
  const entry = collection.find((item) => String(item.id) === String(id));

  if (!entry) return;

  const confirmed = window.confirm(
    `Supprimer définitivement « ${entry.name} » ?\n\n` +
    "Cette action effacera aussi ses images et documents et ne pourra pas être annulée."
  );

  if (!confirmed) return;

  try {
    await removeEntityMedia(type, id);

    const table = type === "zone" ? "zones" : "markers";

    const { error } = await supabaseClient
      .from(table)
      .delete()
      .eq("id", id)
      .not("deleted_at", "is", null);

    if (error) {
      throw new Error(error.message);
    }

    if (type === "marker") {
      favoriteIds.delete(String(id));
      saveFavorites();
    }

    await Promise.all([loadMarkers(), loadZones(), loadMedia(), loadTrash()]);
    showNotification("Élément supprimé définitivement.");
  } catch (error) {
    console.error("Suppression définitive impossible :", error);
    showNotification(
      `Suppression définitive impossible : ${error.message}`,
      "error"
    );
  }
}

adminTrashRefreshButton?.addEventListener("click", loadTrash);

/* =========================================================
   IMPORT / EXPORT ADMIN v0.8.4
   ========================================================= */

const BACKUP_FORMAT_VERSION = "1.0";
const ATLAS_VERSION = "0.8.6.1";

function setBackupStatus(message, type = "") {
  if (!adminBackupStatus) return;
  adminBackupStatus.textContent = message;
  adminBackupStatus.className = `admin-backup-status${type ? ` is-${type}` : ""}`;
}

function downloadJsonFile(fileName, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createAtlasBackup() {
  return {
    backup_version: BACKUP_FORMAT_VERSION,
    atlas_version: ATLAS_VERSION,
    created_at: new Date().toISOString(),
    created_by: playerName || "Administrateur",
    metadata: {
      marker_count: places.length + trashedMarkers.length,
      zone_count: zones.length + trashedZones.length,
      trashed_marker_count: trashedMarkers.length,
      trashed_zone_count: trashedZones.length,
      media_count: mediaRecords.length,
      image_count: mediaRecords.filter((item) => (item.media_type || "image") === "image").length,
      document_count: mediaRecords.filter((item) => item.media_type === "document").length
    },
    categories: CATEGORIES,
    settings: {
      layers: layerSettings
    },
    markers: [...places, ...trashedMarkers],
    zones: [...zones, ...trashedZones],
    media: mediaRecords
  };
}

adminExportAtlasButton.addEventListener("click", () => {
  if (!adminToolsEnabled()) {
    showNotification("L’export est réservé au mode administrateur.", "error");
    return;
  }

  const backup = createAtlasBackup();
  const date = new Date().toISOString().slice(0, 10);
  downloadJsonFile(`AtlasRP_Backup_${date}.json`, backup);
  setBackupStatus(
    `${backup.metadata.marker_count} marqueur(s), ${backup.metadata.zone_count} zone(s) et ${backup.metadata.media_count} média(s) exportés.`,
    "success"
  );
  showNotification("Sauvegarde Atlas exportée.");
});

adminImportAtlasButton.addEventListener("click", () => {
  if (!adminToolsEnabled()) {
    showNotification("L’import est réservé au mode administrateur.", "error");
    return;
  }

  adminImportFileInput.click();
});

function assertBackupShape(backup) {
  if (!backup || typeof backup !== "object") {
    throw new Error("Fichier de sauvegarde invalide.");
  }

  if (backup.backup_version !== BACKUP_FORMAT_VERSION) {
    throw new Error(
      `Version de sauvegarde incompatible : ${backup.backup_version || "inconnue"}.`
    );
  }

  if (!Array.isArray(backup.markers) || !Array.isArray(backup.zones) || !Array.isArray(backup.media)) {
    throw new Error("La sauvegarde ne contient pas les sections attendues.");
  }
}

function cleanMarkerForImport(marker) {
  return {
    name: String(marker.name || "Lieu importé").slice(0, 100),
    description: String(marker.description || "").slice(0, 1000),
    category: CATEGORIES[marker.category] ? marker.category : "autre",
    subcategory: marker.subcategory || null,
    lat: Number(marker.lat),
    lng: Number(marker.lng),
    author: String(marker.author || "Import Atlas").slice(0, 50)
  };
}

function cleanZoneForImport(zone) {
  return {
    name: String(zone.name || "Zone importée").slice(0, 100),
    description: String(zone.description || "").slice(0, 1000),
    category: zone.category || "autre",
    subcategory: zone.subcategory || null,
    color: zone.color || getZoneColor(zone.category, zone.subcategory),
    coordinates: zone.coordinates,
    author: String(zone.author || "Import Atlas").slice(0, 50),
    created_by: adminUser?.id || null
  };
}

async function importMarkers(markers) {
  const idMap = new Map();

  for (const marker of markers) {
    const payload = cleanMarkerForImport(marker);

    if (!Number.isFinite(payload.lat) || !Number.isFinite(payload.lng)) {
      continue;
    }

    const { data, error } = await supabaseClient
      .from("markers")
      .insert([payload])
      .select("id")
      .single();

    if (error) throw new Error(`Import d’un marqueur impossible : ${error.message}`);
    idMap.set(String(marker.id), String(data.id));
  }

  return idMap;
}

async function importZones(zoneRecords) {
  const idMap = new Map();

  for (const zone of zoneRecords) {
    const payload = cleanZoneForImport(zone);

    if (!Array.isArray(payload.coordinates) || payload.coordinates.length < 3) {
      continue;
    }

    const { data, error } = await supabaseClient
      .from("zones")
      .insert([payload])
      .select("id")
      .single();

    if (error) throw new Error(`Import d’une zone impossible : ${error.message}`);
    idMap.set(String(zone.id), String(data.id));
  }

  return idMap;
}

async function copyMediaFileToCurrentBucket(media, destinationPath) {
  const existing = mediaRecords.find((item) => item.storage_path === destinationPath);
  if (existing) return existing.public_url;

  const response = await fetch(media.public_url, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`Téléchargement impossible pour ${media.title || destinationPath}.`);
  }

  const blob = await response.blob();
  const { error: uploadError } = await supabaseClient.storage
    .from("atlas-media")
    .upload(destinationPath, blob, {
      contentType: blob.type || "application/octet-stream",
      upsert: false
    });

  if (uploadError && !String(uploadError.message).toLowerCase().includes("already exists")) {
    throw uploadError;
  }

  const { data } = supabaseClient.storage
    .from("atlas-media")
    .getPublicUrl(destinationPath);

  return data.publicUrl;
}

async function importMedia(mediaList, markerIdMap, zoneIdMap) {
  let imported = 0;
  let skipped = 0;

  for (const media of mediaList) {
    const map = media.entity_type === "marker" ? markerIdMap : zoneIdMap;
    const newEntityId = map.get(String(media.entity_id));

    if (!newEntityId) {
      skipped += 1;
      continue;
    }

    const oldPath = String(media.storage_path || "");
    const fileName = oldPath.split("/").pop() || `media-${Date.now()}`;
    const typeFolder = media.media_type === "document" ? "documents" : "images";
    const entityFolder = media.entity_type === "marker" ? "markers" : "zones";
    const destinationPath = `${typeFolder}/${entityFolder}/${newEntityId}/${Date.now()}-${fileName}`;

    try {
      const publicUrl = await copyMediaFileToCurrentBucket(media, destinationPath);

      const { error } = await supabaseClient
        .from("atlas_media")
        .insert([{
          entity_type: media.entity_type,
          entity_id: Number(newEntityId),
          storage_path: destinationPath,
          public_url: publicUrl,
          media_type: media.media_type || "image",
          title: media.title || null,
          description: media.description || null,
          is_primary: Boolean(media.is_primary),
          author: String(media.author || "Import Atlas").slice(0, 50),
          uploaded_by: adminUser?.id || null
        }]);

      if (error) throw error;
      imported += 1;
    } catch (error) {
      console.warn("Média ignoré pendant l’import :", media, error);
      skipped += 1;
    }
  }

  return { imported, skipped };
}

adminImportFileInput.addEventListener("change", async () => {
  const file = adminImportFileInput.files?.[0];
  adminImportFileInput.value = "";

  if (!file || !adminToolsEnabled()) return;

  adminImportAtlasButton.disabled = true;
  adminExportAtlasButton.disabled = true;
  setBackupStatus("Lecture de la sauvegarde…");

  try {
    const backup = JSON.parse(await file.text());
    assertBackupShape(backup);

    const summary = backup.metadata || {
      marker_count: backup.markers.length,
      zone_count: backup.zones.length,
      media_count: backup.media.length
    };

    const confirmed = window.confirm(
      `Importer cette sauvegarde ?

` +
      `${summary.marker_count || backup.markers.length} marqueur(s)
` +
      `${summary.zone_count || backup.zones.length} zone(s)
` +
      `${summary.media_count || backup.media.length} média(s)

` +
      `L’import ajoute les éléments à l’Atlas actuel.`
    );

    if (!confirmed) {
      setBackupStatus("Import annulé.");
      return;
    }

    setBackupStatus("Import des marqueurs…");
    const markerIdMap = await importMarkers(backup.markers);

    setBackupStatus("Import des polyzones…");
    const zoneIdMap = await importZones(backup.zones);

    setBackupStatus("Import des images et documents…");
    const mediaResult = await importMedia(backup.media, markerIdMap, zoneIdMap);

    if (backup.settings?.layers) {
      layerSettings = {
        ...layerSettings,
        ...backup.settings.layers
      };
      saveLayerSettings();
    }

    await Promise.all([
    loadMarkers(),
    loadZones(),
    loadMedia(),
    isAdmin ? loadTrash() : Promise.resolve(),
    isAdmin ? loadDeletionRequests() : Promise.resolve()
  ]);

    setBackupStatus(
      `Import terminé : ${markerIdMap.size} marqueur(s), ${zoneIdMap.size} zone(s), ` +
      `${mediaResult.imported} média(s). ${mediaResult.skipped} média(s) ignoré(s).`,
      "success"
    );
    showNotification("Sauvegarde Atlas importée.");
  } catch (error) {
    console.error("Erreur import Atlas :", error);
    setBackupStatus(error.message || "Import impossible.", "error");
    showNotification(`Import impossible : ${error.message}`, "error");
  } finally {
    adminImportAtlasButton.disabled = false;
    adminExportAtlasButton.disabled = false;
  }
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
      if (isAdmin) loadTrash();
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
    () => {
      loadZones();
      if (isAdmin) loadTrash();
    }
  )
  .subscribe((status) => console.log("Statut zones Realtime :", status));



supabaseClient
  .channel("atlas-media-realtime")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "atlas_media" },
    () => loadMedia()
  )
  .subscribe((status) => console.log("Statut médias Realtime :", status));

supabaseClient
  .channel("deletion-requests-realtime")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "deletion_requests"
    },
    () => {
      if (isAdmin) loadDeletionRequests();
    }
  )
  .subscribe((status) =>
    console.log("Statut demandes suppression Realtime :", status)
  );

/* =========================================================
   DÉMARRAGE
   ========================================================= */

async function initializeApplication() {
  initializePlayerName();
  loadFavorites();
  loadLayerSettings();
  showHistories = sessionStorage.getItem("atlas_show_histories") === "true";
  showHistoryInput.checked = showHistories;
  setAdminDrawer(false);
  await checkAdminSession();
  createCategoryOptions();
  createFilters();
  applyLayerSettingsToExistingFilters();
  createLayerControls();
  updateZoneSubcategorySelect();

  /*
   * Prend immédiatement en compte une valeur de recherche
   * éventuellement restaurée par le navigateur.
   */
  currentSearch = normalizeText(placeSearchInput.value);
  clearSearchButton.hidden = !currentSearch;

  await Promise.all([loadMarkers(), loadZones(), loadMedia()]);

  /*
   * Force une synchronisation finale après le chargement
   * des marqueurs depuis Supabase.
   */
  synchronizeSearchFromInput();
}

initializeApplication();

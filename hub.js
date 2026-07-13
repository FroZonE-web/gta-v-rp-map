"use strict";

/* =========================================================
   NAVIGATION DU HUB
   Couche indépendante du module Carte existant.
   ========================================================= */

const HUB_MODULES = {
  comptabilite: {
    title: "Comptabilité",
    icon: "💰",
    description: "Entrées, sorties, catégories, justificatifs, solde et historique."
  },
  stocks: {
    title: "Stocks",
    icon: "📦",
    description: "Articles, quantités, seuils d’alerte et mouvements de stock."
  },
  annuaire: {
    title: "Annuaire",
    icon: "👥",
    description: "Membres, téléphones, grades, rôles, spécialités et statuts."
  },
  "plans-op": {
    title: "Plans d’OP",
    icon: "🎯",
    description: "Objectifs, participants, étapes, matériel et comptes rendus."
  },
  agenda: {
    title: "Agenda",
    icon: "📅",
    description: "Réunions, opérations, événements et rappels du groupe."
  },
  reglement: {
    title: "Règlement",
    icon: "📜",
    description: "Chapitres administrables, recherche et suivi des modifications."
  },
  "calculatrice-craft": {
    title: "Calculatrice de craft",
    icon: "🧮",
    description: "Recettes, ressources nécessaires, quantités et coûts totaux."
  },
  "notes-grades": {
    title: "Notes des gradés",
    icon: "🔒",
    description: "Notes privées accessibles uniquement aux grades autorisés."
  }
};

const dashboardRoute = document.getElementById("hub-dashboard");
const mapRoute = document.getElementById("map-module");
const placeholderRoute = document.getElementById("hub-placeholder");
const placeholderIcon = document.getElementById("hub-placeholder-icon");
const placeholderTitle = document.getElementById("hub-placeholder-title");
const placeholderDescription = document.getElementById("hub-placeholder-description");

function getHubRoute() {
  return window.location.hash.replace(/^#\/?/, "").split("/")[0].toLowerCase();
}

function refreshLeafletMap() {
  const refresh = () => {
    if (typeof map !== "undefined" && map && typeof map.invalidateSize === "function") {
      map.invalidateSize({ pan: false });
    }
  };

  window.requestAnimationFrame(refresh);
  window.setTimeout(refresh, 120);
  window.setTimeout(refresh, 350);
}

function displayHubRoute() {
  const route = getHubRoute();
  const module = HUB_MODULES[route];
  const showMap = route === "carte";
  const showPlaceholder = Boolean(module);
  const showDashboard = !showMap && !showPlaceholder;

  dashboardRoute.hidden = !showDashboard;
  placeholderRoute.hidden = !showPlaceholder;

  mapRoute.classList.toggle("is-active", showMap);
  mapRoute.setAttribute("aria-hidden", String(!showMap));

  document.body.classList.toggle("hub-map-active", showMap);
  document.body.classList.toggle("hub-dashboard-active", showDashboard);
  document.body.classList.toggle("hub-placeholder-active", showPlaceholder);

  if (showPlaceholder) {
    placeholderIcon.textContent = module.icon;
    placeholderTitle.textContent = module.title;
    placeholderDescription.textContent = module.description;
    document.title = `${module.title} — Ashen Wolves HUB`;
  } else if (showMap) {
    document.title = "Carte — Ashen Wolves HUB";
    refreshLeafletMap();
  } else {
    document.title = "Ashen Wolves HUB";
  }
}

window.addEventListener("hashchange", displayHubRoute);
displayHubRoute();

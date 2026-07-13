"use strict";

const regulationPage = document.getElementById("reglement-module");
const regulationSearch = document.getElementById("regulation-search");
const regulationClear = document.getElementById("regulation-search-clear");
const regulationCount = document.getElementById("regulation-search-count");
const regulationNoResults = document.getElementById("regulation-no-results");
const regulationArticles = [...document.querySelectorAll(".regulation-article")];
const regulationChapters = [...document.querySelectorAll("[data-regulation-chapter]")];
const regulationNavLinks = [...document.querySelectorAll("[data-reglement-nav]")];
const regulationMenuToggle = document.getElementById("regulation-menu-toggle");
const regulationMenuClose = document.getElementById("regulation-menu-close");
const regulationMenuOverlay = document.getElementById("regulation-menu-overlay");

function normalizeRegulationText(value) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function filterRegulation() {
  const query = normalizeRegulationText(regulationSearch.value);
  let visibleCount = 0;

  regulationArticles.forEach((article) => {
    const searchable = normalizeRegulationText(article.dataset.regulationSearch || article.textContent);
    const visible = !query || searchable.includes(query);
    article.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  regulationChapters.forEach((chapter) => {
    chapter.hidden = !chapter.querySelector(".regulation-article:not([hidden])");
  });

  regulationClear.hidden = !query;
  regulationNoResults.hidden = visibleCount > 0;
  regulationCount.textContent = query
    ? `${visibleCount} article${visibleCount > 1 ? "s" : ""} trouvé${visibleCount > 1 ? "s" : ""}`
    : "140 articles";
}

function closeRegulationMenu() {
  regulationPage.classList.remove("is-menu-open");
  regulationMenuToggle.setAttribute("aria-expanded", "false");
}

function openRegulationMenu() {
  regulationPage.classList.add("is-menu-open");
  regulationMenuToggle.setAttribute("aria-expanded", "true");
}

regulationSearch.addEventListener("input", filterRegulation);
regulationClear.addEventListener("click", () => {
  regulationSearch.value = "";
  filterRegulation();
  regulationSearch.focus();
});
regulationMenuToggle.addEventListener("click", () => {
  regulationPage.classList.contains("is-menu-open") ? closeRegulationMenu() : openRegulationMenu();
});
regulationMenuClose.addEventListener("click", closeRegulationMenu);
regulationMenuOverlay.addEventListener("click", closeRegulationMenu);
regulationNavLinks.forEach((link) => link.addEventListener("click", closeRegulationMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeRegulationMenu();
});

const regulationObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  regulationNavLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.regulationTarget === visible.target.id);
  });
}, { rootMargin: "-25% 0px -65% 0px", threshold: [0, .2, .6] });

document.querySelectorAll(".regulation-feature, .regulation-chapter").forEach((section) => regulationObserver.observe(section));


function getRegulationTargetFromHash() {
  const parts = window.location.hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  return parts[0] === "reglement" ? (parts[1] || "") : "";
}

function scrollToRegulationTarget(target, behavior = "smooth") {
  if (!target) {
    window.scrollTo({ top: 0, behavior: behavior === "smooth" ? "smooth" : "auto" });
    return;
  }

  const element = document.getElementById(target);
  if (!element) return;

  window.requestAnimationFrame(() => {
    element.scrollIntoView({ behavior, block: "start" });
  });
}

/*
 * Le HUB utilise déjà le fragment d’URL pour ses routes (#/reglement).
 * Les ancres internes sont donc placées après la route :
 * #/reglement/chapitre-i ou #/reglement/article-42.
 */
document.querySelectorAll('#reglement-module a[href^="#"]:not([href^="#/"])').forEach((link) => {
  const target = link.getAttribute("href").slice(1);
  link.dataset.regulationTarget = target;
  link.setAttribute("href", `#/reglement/${encodeURIComponent(target)}`);
  link.addEventListener("click", (event) => {
    if (window.location.hash === link.getAttribute("href")) {
      event.preventDefault();
      scrollToRegulationTarget(target, "smooth");
    }
  });
});

window.addEventListener("hub:regulation-visible", (event) => {
  const target = event.detail?.target || "";
  window.setTimeout(() => scrollToRegulationTarget(target, "smooth"), 0);
});

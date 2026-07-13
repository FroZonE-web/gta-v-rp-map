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
    link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
  });
}, { rootMargin: "-25% 0px -65% 0px", threshold: [0, .2, .6] });

document.querySelectorAll(".regulation-feature, .regulation-chapter").forEach((section) => regulationObserver.observe(section));

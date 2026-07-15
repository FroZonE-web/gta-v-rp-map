"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    module: $("stocks-module"), brandSubtitle: $("stocks-brand-subtitle"),
    itemsPanel: $("stocks-items-panel"), locationsPanel: $("stocks-locations-panel"), globalPanel: $("stocks-global-panel"), movementsPanel: $("stocks-movements-panel"),
    grid: $("stocks-items-grid"), search: $("stocks-search"), counter: $("stocks-counter"), refresh: $("stocks-refresh"), status: $("stocks-status"),
    addItem: $("stocks-add-item"), addCategory: $("stocks-add-category"), itemDialog: $("stocks-item-dialog"), itemForm: $("stocks-item-form"), categoryDialog: $("stocks-category-dialog"), categoryForm: $("stocks-category-form"),
    locationSearch: $("stocks-location-search"), locationFilter: $("stocks-location-type-filter"), locationCounter: $("stocks-location-counter"), locationRefresh: $("stocks-location-refresh"), locationStatus: $("stocks-location-status"), locationsContent: $("stocks-locations-content"), addLocation: $("stocks-add-location"), locationDialog: $("stocks-location-dialog"), locationForm: $("stocks-location-form"), quickDialog: $("stocks-location-quick-dialog"), quickForm: $("stocks-location-quick-form"),
    movementSearch: $("stocks-movement-search"), bulkMovement: $("stocks-add-bulk-movement"), bulkDialog: $("stocks-bulk-movement-dialog"), bulkForm: $("stocks-bulk-movement-form"), movementTypeFilter: $("stocks-movement-type-filter"), movementLocationFilter: $("stocks-movement-location-filter"), movementCounter: $("stocks-movement-counter"), movementStatus: $("stocks-movement-status"), movementsList: $("stocks-movements-list"), addMovement: $("stocks-add-movement"), movementDialog: $("stocks-movement-dialog"), movementForm: $("stocks-movement-form"),
    globalSearch: $("stocks-global-search"), globalCategoryFilter: $("stocks-global-category-filter"), globalSort: $("stocks-global-sort"), globalStateFilter: $("stocks-global-state-filter"), globalCounter: $("stocks-global-counter"), globalRefresh: $("stocks-global-refresh"), globalStatus: $("stocks-global-status"), globalList: $("stocks-global-list"), globalDetailDialog: $("stocks-global-detail-dialog"), globalDetail: $("stocks-global-detail"), locationDetailDialog: $("stocks-location-detail-dialog"), locationDetail: $("stocks-location-detail")
  };

  let items = [], categories = [], locations = [], movements = [], balances = [];
  let editingItemId = null, editingLocationId = null, quickLocationId = null;
  let itemsLoaded = false, locationsLoaded = false, globalLoaded = false, movementsLoaded = false, isAdmin = false, activeTab = "items";
  let realtimeChannel = null;

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(v || 0));
  const kg = (v) => `${Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} kg`;
  const dt = (v) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(v));

  function dirtyValue(item) {
    const clean = Number(item.clean_value || 0), input = Number(item.dirty_input || 0);
    if (item.dirty_mode === "multiplier") return clean * input;
    if (item.dirty_mode === "percentage") return clean * (input / 100);
    return input;
  }
  function previewDirty() {
    const mode = $("stocks-dirty-mode").value;
    $("stocks-dirty-input-label").textContent = mode === "fixed" ? "Valeur sale fixe ($)" : mode === "multiplier" ? "Multiplicateur" : "Pourcentage (%)";
    $("stocks-dirty-preview").textContent = money(dirtyValue({ clean_value: $("stocks-item-clean").value, dirty_mode: mode, dirty_input: $("stocks-dirty-input").value }));
  }
  async function detectAdmin() {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) return isAdmin = false;
      const { data } = await supabaseClient.rpc("is_admin");
      isAdmin = Boolean(data) && !(typeof visitorMode !== "undefined" && visitorMode);
    } catch { isAdmin = false; }
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll("[data-stocks-tab]").forEach(button => button.classList.toggle("is-active", button.dataset.stocksTab === tab));
    els.itemsPanel.hidden = tab !== "items";
    els.locationsPanel.hidden = tab !== "locations";
    els.globalPanel.hidden = tab !== "global";
    els.movementsPanel.hidden = tab !== "movements";
    els.brandSubtitle.textContent = tab === "items" ? "Banque d’items" : tab === "locations" ? "Lieux de stockage" : tab === "global" ? "Stock global" : "Mouvements de stock";
    if (tab === "items") loadItems();
    else if (tab === "locations") loadLocations();
    else if (tab === "global") loadGlobal();
    else loadMovements();
  }

  async function loadItems(force = false) {
    if (itemsLoaded && !force) return renderItems();
    els.status.textContent = "Chargement…"; els.refresh.disabled = true;
    try {
      const [catRes, itemRes] = await Promise.all([
        supabaseClient.from("stock_categories").select("*").order("name"),
        supabaseClient.from("stock_items").select("*, stock_categories(name)").order("name")
      ]);
      if (catRes.error) throw catRes.error;
      if (itemRes.error) throw itemRes.error;
      categories = catRes.data || []; items = itemRes.data || []; itemsLoaded = true; els.status.textContent = ""; renderItems();
    } catch (error) {
      console.error(error); els.status.textContent = "Impossible de charger la banque d’items. Vérifie que STOCKS_SETUP.sql a été exécuté.";
    } finally { els.refresh.disabled = false; }
  }
  function renderItems() {
    const q = els.search.value.trim().toLowerCase();
    const rows = items.filter(i => !q || [i.name, i.stock_categories?.name].some(v => String(v || "").toLowerCase().includes(q)));
    els.counter.textContent = `${rows.length} item${rows.length > 1 ? "s" : ""}`;
    if (!rows.length) { els.grid.innerHTML = '<div class="stocks-empty">Aucun item à afficher.</div>'; return; }
    els.grid.innerHTML = rows.map(i => `
      <article class="stocks-card">
        <div class="stocks-card-image">${i.image_url ? `<img src="${esc(i.image_url)}" alt="${esc(i.name)}" style="width:auto;height:auto;max-width:calc(100% - 16px);max-height:calc(100% - 16px);object-fit:contain;object-position:center;">` : '<span class="stocks-card-placeholder">📦</span>'}</div>
        <div class="stocks-card-body">
          <div class="stocks-card-head"><h3>${esc(i.name)}</h3><span class="stocks-badge">${esc(i.stock_categories?.name || "Sans catégorie")}</span></div>
          <div class="stocks-card-data">
            <div><span>Poids</span><strong>${kg(i.unit_weight)}</strong></div><div><span>Seuil global</span><strong>${i.critical_threshold ?? "—"}</strong></div>
            <div><span>Valeur propre</span><strong class="money-clean">${money(i.clean_value)}</strong></div><div><span>Valeur sale</span><strong class="money-dirty">${money(dirtyValue(i))}</strong></div>
          </div>
          <div class="stocks-card-actions"><button data-edit-item="${i.id}">Modifier</button>${isAdmin ? `<button class="danger" data-delete-item="${i.id}">Supprimer</button>` : ""}</div>
        </div>
      </article>`).join("");
  }

  async function loadLocations(force = false) {
    if (locationsLoaded && !force) return renderLocations();
    els.locationStatus.textContent = "Chargement…"; els.locationRefresh.disabled = true;
    try {
      const [locationsRes, itemsRes, balancesRes] = await Promise.all([
        supabaseClient.from("stock_locations").select("*").order("type").order("name"),
        supabaseClient.from("stock_items").select("*, stock_categories(name)").order("name"),
        supabaseClient.from("stock_balances").select("*")
      ]);
      for (const result of [locationsRes, itemsRes, balancesRes]) if (result.error) throw result.error;
      locations = locationsRes.data || []; items = itemsRes.data || []; balances = balancesRes.data || []; itemsLoaded = locationsLoaded = true; els.locationStatus.textContent = ""; renderLocations();
    } catch (error) {
      console.error(error); els.locationStatus.textContent = "Impossible de charger les lieux. Exécute STOCK_LOCATIONS_SETUP.sql dans Supabase.";
    } finally { els.locationRefresh.disabled = false; }
  }
  function locationCard(location) {
    const used = Number(location.used_weight || 0), capacity = Number(location.capacity_weight || 0);
    const percent = capacity > 0 ? Math.min(100, Math.max(0, used / capacity * 100)) : 0;
    const locationTypes = {
      home: { name: "Habitation", icon: "🏠" },
      vehicle: { name: "Véhicule", icon: "🚗" },
      fridge: { name: "Frigo", icon: "❄️" }
    };
    const currentType = locationTypes[location.type] || locationTypes.home;
    const typeName = currentType.name;
    const icon = currentType.icon;
    const fillColor = percent >= 95 ? "#d84a5b" : percent >= 80 ? "#e08f23" : `hsl(${272 - (percent/80)*242} 62% 55%)`;
    return `<article class="stocks-location-card" data-location-detail="${location.id}">
      <div class="stocks-location-card-head"><div class="stocks-location-icon">${icon}</div><div><span class="stocks-location-type">${typeName}</span><h3>${esc(location.name)}</h3></div></div>
      <button class="stocks-location-address" data-quick-location="${location.id}" title="Modifier rapidement la localisation"><span>📍</span><strong>${esc(location.location || "Localisation non renseignée")}</strong><small>Modifier</small></button>
      <div class="stocks-capacity-row"><span>Remplissage</span><strong>${kg(used)} / ${kg(capacity)}</strong></div>
      <div class="stocks-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}"><span style="width:${percent}%;background:${fillColor}"></span></div>
      <div class="stocks-location-metrics"><div><span>Utilisé</span><strong>${kg(used)}</strong></div><div><span>Restant</span><strong>${kg(Math.max(0, capacity-used))}</strong></div><div><span>Rempli</span><strong style="color:${fillColor}">${Math.round(percent)} %</strong></div></div>
      ${location.notes ? `<p class="stocks-location-notes">${esc(location.notes)}</p>` : ""}
      <div class="stocks-card-actions"><button data-edit-location="${location.id}">Modifier</button>${isAdmin ? `<button class="danger" data-delete-location="${location.id}">Supprimer</button>` : ""}</div>
    </article>`;
  }
  function renderLocations() {
    const q = els.locationSearch.value.trim().toLowerCase(), type = els.locationFilter.value;
    const rows = locations.filter(l => (type === "all" || l.type === type) && (!q || [l.name, l.location, l.notes].some(v => String(v || "").toLowerCase().includes(q))));
    els.locationCounter.textContent = `${rows.length} lieu${rows.length > 1 ? "x" : ""}`;
    if (!rows.length) { els.locationsContent.innerHTML = '<div class="stocks-empty">Aucun lieu de stockage à afficher.</div>'; return; }
    const groups = [["home", "Habitations", "🏠"], ["vehicle", "Véhicules", "🚗"], ["fridge", "Frigos", "❄️"]];
    els.locationsContent.innerHTML = groups.map(([key, title, icon]) => {
      const groupRows = rows.filter(l => l.type === key);
      if (!groupRows.length) return "";
      return `<section class="stocks-location-group"><header><div><span>${icon}</span><h2>${title}</h2></div><small>${groupRows.length} lieu${groupRows.length > 1 ? "x" : ""}</small></header><div class="stocks-locations-grid">${groupRows.map(locationCard).join("")}</div></section>`;
    }).join("");
  }

  async function loadGlobal(force = false) {
    if (globalLoaded && !force) return renderGlobal();
    els.globalStatus.textContent = "Chargement…"; els.globalRefresh.disabled = true;
    try {
      const [itemsRes, categoriesRes, locationsRes, balancesRes] = await Promise.all([
        supabaseClient.from("stock_items").select("*, stock_categories(name)").order("name"),
        supabaseClient.from("stock_categories").select("*").order("name"),
        supabaseClient.from("stock_locations").select("*").order("name"),
        supabaseClient.from("stock_balances").select("*")
      ]);
      for (const result of [itemsRes, categoriesRes, locationsRes, balancesRes]) if (result.error) throw result.error;
      items = itemsRes.data || []; categories = categoriesRes.data || []; locations = locationsRes.data || []; balances = balancesRes.data || [];
      itemsLoaded = locationsLoaded = globalLoaded = true;
      fillGlobalFilters(); els.globalStatus.textContent = ""; renderGlobal();
    } catch (error) {
      console.error(error); els.globalStatus.textContent = "Impossible de charger le stock global. Vérifie que STOCK_MOVEMENTS_SETUP.sql a été exécuté.";
    } finally { els.globalRefresh.disabled = false; }
  }
  function fillGlobalFilters() {
    const selected = els.globalCategoryFilter.value;
    els.globalCategoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>' + categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    els.globalCategoryFilter.value = categories.some(c => String(c.id) === selected) ? selected : "all";
  }
  function globalRows() {
    return items.map(item => {
      const itemBalances = balances.filter(b => String(b.item_id) === String(item.id) && Number(b.quantity) > 0);
      const quantity = itemBalances.reduce((sum, b) => sum + Number(b.quantity || 0), 0);
      const totalWeight = quantity * Number(item.unit_weight || 0);
      const cleanTotal = quantity * Number(item.clean_value || 0);
      const dirtyTotal = quantity * dirtyValue(item);
      const threshold = item.critical_threshold == null ? null : Number(item.critical_threshold);
      const stockState = quantity === 0
        ? "rupture"
        : (threshold != null && quantity <= threshold ? "low" : "ok");
      const critical = stockState !== "ok";
      return { item, itemBalances, quantity, totalWeight, cleanTotal, dirtyTotal, threshold, critical, stockState };
    });
  }
  function renderGlobal() {
    const q = els.globalSearch.value.trim().toLowerCase(), category = els.globalCategoryFilter.value, state = els.globalStateFilter.value;
    const all = globalRows();
    const rows = all.filter(row => {
      const matchesText = !q || [row.item.name, row.item.stock_categories?.name].some(v => String(v || "").toLowerCase().includes(q));
      const matchesCategory = category === "all" || String(row.item.category_id) === category;
      const matchesState = state === "all" || (state === "critical" && row.critical) || (state === "present" && row.quantity > 0) || (state === "empty" && row.quantity === 0);
      return matchesText && matchesCategory && matchesState;
    }).sort((a,b) => els.globalSort.value === "category"
      ? String(a.item.stock_categories?.name || "").localeCompare(String(b.item.stock_categories?.name || ""), "fr", {sensitivity:"base"}) || a.item.name.localeCompare(b.item.name, "fr", {sensitivity:"base"})
      : a.item.name.localeCompare(b.item.name, "fr", {sensitivity:"base"}));
    const totals = all.reduce((acc, row) => ({
      weight: acc.weight + row.totalWeight, clean: acc.clean + row.cleanTotal, dirty: acc.dirty + row.dirtyTotal, alerts: acc.alerts + (row.critical ? 1 : 0)
    }), { weight: 0, clean: 0, dirty: 0, alerts: 0 });
    $("stocks-global-items-stat").textContent = items.length;
    $("stocks-global-locations-stat").textContent = locations.length;
    $("stocks-global-alerts-stat").textContent = totals.alerts;
    $("stocks-global-weight-stat").textContent = kg(totals.weight);
    $("stocks-global-clean-stat").textContent = money(totals.clean);
    $("stocks-global-dirty-stat").textContent = money(totals.dirty);
    els.globalCounter.textContent = `${rows.length} item${rows.length > 1 ? "s" : ""}`;
    if (!rows.length) { els.globalList.innerHTML = '<div class="stocks-empty">Aucun item à afficher.</div>'; return; }
    els.globalList.innerHTML = rows.map(row => {
      const stateLabel = row.stockState === "rupture" ? "Rupture" : row.stockState === "low" ? "Stock bas" : "OK";
      const thresholdLabel = row.stockState === "low" && row.threshold != null ? ` · seuil ${row.threshold}` : "";
      return `<button class="stocks-global-row is-${row.stockState}" type="button" data-global-item="${row.item.id}">
      <span class="stocks-global-image">${row.item.image_url ? `<img src="${esc(row.item.image_url)}" alt="">` : "📦"}</span>
      <span class="stocks-global-name"><strong>${esc(row.item.name)}</strong><small>${esc(row.item.stock_categories?.name || "Sans catégorie")}</small></span>
      <span><small>Quantité</small><strong>${row.quantity}</strong></span>
      <span><small>Poids total</small><strong>${kg(row.totalWeight)}</strong></span>
      <span><small>Valeur propre</small><strong class="money-clean">${money(row.cleanTotal)}</strong></span>
      <span><small>Valeur sale</small><strong class="money-dirty">${money(row.dirtyTotal)}</strong></span>
      <span class="stocks-global-state ${row.stockState}">${stateLabel}${thresholdLabel}</span>
    </button>`;
    }).join("");
  }
  function openGlobalDetail(itemId) {
    const row = globalRows().find(r => String(r.item.id) === String(itemId)); if (!row) return;
    const distribution = row.itemBalances.map(balance => {
      const location = locations.find(l => String(l.id) === String(balance.location_id));
      return `<div class="stocks-global-distribution-row"><span>${location?.type === "vehicle" ? "🚗" : "🏠"} ${esc(location?.name || "Lieu supprimé")}</span><strong>${Number(balance.quantity || 0)}</strong></div>`;
    }).join("") || '<p class="stocks-global-no-distribution">Cet item n’est présent dans aucun lieu.</p>';
    const detailStateLabel = row.stockState === "rupture" ? "Rupture" : row.stockState === "low" ? "Stock bas" : "OK";
    els.globalDetail.innerHTML = `<div class="stocks-dialog-head"><div><p>Répartition du stock</p><h2>${esc(row.item.name)}</h2></div><button type="button" data-global-detail-close>×</button></div>
      <div class="stocks-global-detail-summary"><div><span>Stock global</span><strong>${row.quantity}</strong></div><div><span>Poids total</span><strong>${kg(row.totalWeight)}</strong></div><div><span>État</span><strong class="is-${row.stockState}">${detailStateLabel}</strong></div></div>
      <div class="stocks-global-distribution">${distribution}</div>`;
    els.globalDetail.querySelector("[data-global-detail-close]").onclick = () => els.globalDetailDialog.close();
    els.globalDetailDialog.showModal();
  }

  async function loadMovements(force = false) {
    if (movementsLoaded && !force) return renderMovements();
    els.movementStatus.textContent = "Chargement…";
    try {
      const [itemsRes, locationsRes, movementsRes, balancesRes] = await Promise.all([
        supabaseClient.from("stock_items").select("*, stock_categories(name)").order("name"),
        supabaseClient.from("stock_locations").select("*").order("name"),
        supabaseClient.from("stock_movements").select("*, stock_items(name,image_url,unit_weight), stock_locations(name,type)").order("created_at", { ascending: false }).limit(500),
        supabaseClient.from("stock_balances").select("*")
      ]);
      for (const result of [itemsRes, locationsRes, movementsRes, balancesRes]) if (result.error) throw result.error;
      items = itemsRes.data || []; locations = locationsRes.data || []; movements = movementsRes.data || []; balances = balancesRes.data || [];
      itemsLoaded = locationsLoaded = movementsLoaded = true;
      els.movementStatus.textContent = "";
      fillMovementFilters(); renderMovements();
    } catch (error) {
      console.error(error); els.movementStatus.textContent = "Impossible de charger les mouvements. Exécute STOCK_MOVEMENTS_SETUP.sql dans Supabase.";
    }
  }
  function fillMovementFilters() {
    const selected = els.movementLocationFilter.value;
    els.movementLocationFilter.innerHTML = '<option value="all">Tous les lieux</option>' + locations.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join("");
    els.movementLocationFilter.value = locations.some(l => String(l.id) === selected) ? selected : "all";
  }
  function renderMovements() {
    const q = els.movementSearch.value.trim().toLowerCase();
    const type = els.movementTypeFilter.value, locationId = els.movementLocationFilter.value;
    const rows = movements.filter(m => {
      const matchesText = !q || [m.stock_items?.name, m.stock_locations?.name, m.created_by_label].some(v => String(v || "").toLowerCase().includes(q));
      return matchesText && (type === "all" || m.movement_type === type) && (locationId === "all" || String(m.location_id) === locationId);
    });
    els.movementCounter.textContent = `${rows.length} mouvement${rows.length > 1 ? "s" : ""}`;
    if (!rows.length) { els.movementsList.innerHTML = '<div class="stocks-empty">Aucun mouvement à afficher.</div>'; return; }
    els.movementsList.innerHTML = rows.map(m => {
      const deposit = m.movement_type === "deposit";
      return `<article class="stocks-movement-row">
        <div class="stocks-movement-image">${m.stock_items?.image_url ? `<img src="${esc(m.stock_items.image_url)}" alt="">` : "📦"}</div>
        <div class="stocks-movement-main"><div><span class="stocks-movement-kind ${deposit ? "deposit" : "withdraw"}">${deposit ? "Dépôt" : "Retrait"}</span><strong>${esc(m.stock_items?.name || "Item supprimé")}</strong></div><small>${dt(m.created_at)}${m.created_by_label ? ` · ${esc(m.created_by_label)}` : ""}</small></div>
        <div class="stocks-movement-place"><span>Lieu</span><strong>${esc(m.stock_locations?.name || "Lieu supprimé")}</strong></div>
        <div class="stocks-movement-qty"><span>Quantité</span><strong>${deposit ? "+" : "−"}${m.quantity}</strong></div>
        <div class="stocks-movement-weight"><span>Poids</span><strong>${deposit ? "+" : "−"}${kg(m.total_weight)}</strong></div>
      </article>`;
    }).join("");
  }

  function fillCategories(selected = "") {
    const input = $("stocks-item-category"), list = $("stocks-item-category-list");
    list.innerHTML = categories.map(c => `<option value="${esc(c.name)}"></option>`).join("");
    const category = categories.find(c => String(c.id) === String(selected));
    input.value = category?.name || "";
  }
  function selectedCategoryId() {
    const name = $("stocks-item-category").value.trim().toLowerCase();
    return categories.find(c => c.name.trim().toLowerCase() === name)?.id || null;
  }
  function openItem(item = null) {
    editingItemId = item?.id || null;
    $("stocks-item-dialog-title").textContent = item ? "Modifier l’item" : "Nouvel item";
    $("stocks-item-name").value = item?.name || ""; fillCategories(item?.category_id || "");
    $("stocks-item-weight").value = item?.unit_weight ?? ""; $("stocks-item-clean").value = item?.clean_value ?? "";
    $("stocks-item-threshold").value = item?.critical_threshold ?? ""; $("stocks-dirty-mode").value = item?.dirty_mode || "fixed";
    $("stocks-dirty-input").value = item?.dirty_input ?? ""; $("stocks-item-image").value = "";
    $("stocks-image-preview").innerHTML = item?.image_url ? `<img src="${esc(item.image_url)}" alt="">` : "Aucune image sélectionnée";
    $("stocks-form-error").hidden = true; previewDirty(); els.itemDialog.showModal();
  }
  function openLocation(location = null) {
    editingLocationId = location?.id || null;
    $("stocks-location-dialog-title").textContent = location ? "Modifier le lieu" : "Nouveau lieu";
    $("stocks-location-name").value = location?.name || ""; $("stocks-location-type").value = location?.type || "home";
    $("stocks-location-capacity").value = location?.capacity_weight ?? ""; $("stocks-location-address").value = location?.location || "";
    $("stocks-location-notes").value = location?.notes || ""; $("stocks-location-form-error").hidden = true; els.locationDialog.showModal();
  }
  function openQuickLocation(location) {
    quickLocationId = location.id; $("stocks-location-quick-title").textContent = location.name;
    $("stocks-location-quick-value").value = location.location || ""; $("stocks-location-quick-error").hidden = true; els.quickDialog.showModal();
    requestAnimationFrame(() => $("stocks-location-quick-value").focus());
  }
  async function openMovement() {
    if (!itemsLoaded || !locationsLoaded) await loadMovements(true);
    $("stocks-movement-item").innerHTML = '<option value="">Sélectionner un item…</option>' + items.map(i => `<option value="${i.id}">${esc(i.name)}</option>`).join("");
    $("stocks-movement-location").innerHTML = '<option value="">Sélectionner un lieu…</option>' + locations.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join("");
    $("stocks-movement-type").value = "deposit"; $("stocks-movement-quantity").value = 1; $("stocks-movement-actor").value = "";
    $("stocks-movement-error").hidden = true; updateMovementPreview(); els.movementDialog.showModal();
  }
  function selectedMovementItem() { return items.find(i => String(i.id) === $("stocks-movement-item").value); }
  function selectedMovementLocation() { return locations.find(l => String(l.id) === $("stocks-movement-location").value); }
  function currentBalance(itemId, locationId) { return Number(balances.find(b => String(b.item_id) === String(itemId) && String(b.location_id) === String(locationId))?.quantity || 0); }
  function updateMovementPreview() {
    const item = selectedMovementItem(), location = selectedMovementLocation();
    const quantity = Math.max(0, Number($("stocks-movement-quantity").value || 0));
    const type = $("stocks-movement-type").value;
    $("stocks-movement-item-preview").innerHTML = item ? `${item.image_url ? `<img src="${esc(item.image_url)}" alt="">` : '<span>📦</span>'}<div><strong>${esc(item.name)}</strong><small>${esc(item.stock_categories?.name || "Sans catégorie")} · ${kg(item.unit_weight)} par unité</small></div>` : '<span class="stocks-movement-preview-empty">Sélectionne un item</span>';
    const delta = item ? Number(item.unit_weight || 0) * quantity : 0;
    const available = item && location ? currentBalance(item.id, location.id) : 0;
    const used = Number(location?.used_weight || 0), capacity = Number(location?.capacity_weight || 0);
    const after = type === "deposit" ? used + delta : Math.max(0, used - delta);
    $("stocks-movement-preview").innerHTML = `
      <div><span>Poids du mouvement</span><strong>${kg(delta)}</strong></div>
      <div><span>Disponible dans ce lieu</span><strong>${available} unité${available > 1 ? "s" : ""}</strong></div>
      <div><span>Poids après mouvement</span><strong>${location ? `${kg(after)} / ${kg(capacity)}` : "—"}</strong></div>`;
  }

  function openLocationDetail(locationId, selectedCategory = "all") {
    const location = locations.find(l => String(l.id) === String(locationId)); if (!location) return;
    const allRows = balances.filter(b => String(b.location_id) === String(location.id) && Number(b.quantity) > 0).map(b => {
      const item = items.find(i => String(i.id) === String(b.item_id));
      const quantity = Number(b.quantity || 0);
      return item ? { item, quantity, weight: quantity * Number(item.unit_weight || 0), clean: quantity * Number(item.clean_value || 0), dirty: quantity * dirtyValue(item) } : null;
    }).filter(Boolean);
    const categoryNames = [...new Set(allRows.map(r => r.item.stock_categories?.name || "Sans catégorie"))]
      .sort((a,b)=>a.localeCompare(b,"fr",{sensitivity:"base"}));
    const rows = allRows
      .filter(r => selectedCategory === "all" || (r.item.stock_categories?.name || "Sans catégorie") === selectedCategory)
      .sort((a,b) => {
        const categoryCompare = (a.item.stock_categories?.name || "Sans catégorie").localeCompare(b.item.stock_categories?.name || "Sans catégorie", "fr", {sensitivity:"base"});
        return categoryCompare || a.item.name.localeCompare(b.item.name,"fr",{sensitivity:"base"});
      });
    const used = Number(location.used_weight || 0), capacity = Number(location.capacity_weight || 0), percent = capacity ? Math.min(100, used/capacity*100) : 0;
    const categoryOptions = ['<option value="all">Toutes les catégories</option>']
      .concat(categoryNames.map(name => `<option value="${esc(name)}"${selectedCategory === name ? " selected" : ""}>${esc(name)}</option>`)).join("");
    const list = rows.length ? rows.map(r => `<div class="stocks-location-detail-row"><span class="stocks-global-image">${r.item.image_url ? `<img src="${esc(r.item.image_url)}" alt="">` : "📦"}</span><span class="stocks-global-name"><strong>${esc(r.item.name)}</strong><small>${esc(r.item.stock_categories?.name || "Sans catégorie")}</small></span><span><small>Quantité</small><strong>${r.quantity}</strong></span><span><small>Poids</small><strong>${kg(r.weight)}</strong></span><span><small>Propre</small><strong class="money-clean">${money(r.clean)}</strong></span><span><small>Sale</small><strong class="money-dirty">${money(r.dirty)}</strong></span></div>`).join("") : '<p class="stocks-global-no-distribution">Aucun item dans cette catégorie.</p>';
    els.locationDetail.innerHTML = `<div class="stocks-dialog-head"><div><p>Contenu du stockage</p><h2>${esc(location.name)}</h2></div><button type="button" data-location-detail-close>×</button></div><div class="stocks-global-detail-summary"><div><span>Utilisé</span><strong>${kg(used)}</strong></div><div><span>Restant</span><strong>${kg(Math.max(0,capacity-used))}</strong></div><div><span>Remplissage</span><strong>${Math.round(percent)} %</strong></div></div><div class="stocks-location-detail-toolbar"><label>Catégorie<select data-location-category-filter>${categoryOptions}</select></label><span>${rows.length} item${rows.length > 1 ? "s" : ""}</span></div><div class="stocks-location-detail-list">${list}</div>`;
    els.locationDetail.querySelector("[data-location-detail-close]").onclick=()=>els.locationDetailDialog.close();
    els.locationDetail.querySelector("[data-location-category-filter]").onchange=(event)=>openLocationDetail(locationId,event.target.value);
    if (!els.locationDetailDialog.open) els.locationDetailDialog.showModal();
  }

  function bulkLineTemplate() {
    const options = items.map(i => `<option value="${i.id}">${esc(i.name)}</option>`).join("");
    return `<div class="stocks-bulk-line"><select class="stocks-bulk-item" required><option value="">Sélectionner un item…</option>${options}</select><input class="stocks-bulk-qty" type="number" min="1" step="1" value="1" required><div class="stocks-bulk-item-preview"></div><button type="button" class="stocks-bulk-remove" aria-label="Supprimer">×</button></div>`;
  }
  async function openBulkMovement() {
    if (!itemsLoaded || !locationsLoaded || !balances.length) await loadMovements(true);
    $("stocks-bulk-location").innerHTML = '<option value="">Sélectionner un lieu…</option>' + locations.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join("");
    $("stocks-bulk-type").value="deposit"; $("stocks-bulk-actor").value=""; $("stocks-bulk-lines").innerHTML=bulkLineTemplate(); $("stocks-bulk-error").hidden=true; updateBulkPreview(); els.bulkDialog.showModal();
  }
  function updateBulkPreview() {
    const location = locations.find(l=>String(l.id)===$("stocks-bulk-location").value), type=$("stocks-bulk-type").value;
    let weight=0, units=0;
    document.querySelectorAll(".stocks-bulk-line").forEach(line=>{ const item=items.find(i=>String(i.id)===line.querySelector(".stocks-bulk-item").value), qty=Math.max(0,Number(line.querySelector(".stocks-bulk-qty").value||0)); units+=qty; weight+=(item?Number(item.unit_weight||0)*qty:0); line.querySelector(".stocks-bulk-item-preview").innerHTML=item?`${item.image_url?`<img src="${esc(item.image_url)}" alt="">`:"📦"}<span><strong>${esc(item.name)}</strong><small>${esc(item.stock_categories?.name||"Sans catégorie")} · ${kg(item.unit_weight)}</small></span>`:""; });
    const used=Number(location?.used_weight||0), after=type==="deposit"?used+weight:Math.max(0,used-weight);
    $("stocks-bulk-preview").innerHTML=`<div><span>Total d’unités</span><strong>${units}</strong></div><div><span>Poids total</span><strong>${kg(weight)}</strong></div><div><span>Poids après mouvement</span><strong>${location?`${kg(after)} / ${kg(location.capacity_weight)}`:"—"}</strong></div>`;
  }
  async function saveBulkMovement(e) {
    e.preventDefault(); const submit=els.bulkForm.querySelector('[type="submit"]'); submit.disabled=true;
    try {
      const entries=[...document.querySelectorAll(".stocks-bulk-line")].map(line=>({item_id:line.querySelector(".stocks-bulk-item").value,quantity:Number(line.querySelector(".stocks-bulk-qty").value)}));
      if (!entries.length || entries.some(x=>!x.item_id || x.quantity<=0)) throw new Error("Complète toutes les lignes.");
      const {error}=await supabaseClient.rpc("create_stock_movements_bulk",{p_location_id:$("stocks-bulk-location").value,p_movement_type:$("stocks-bulk-type").value,p_entries:entries,p_actor_label:$("stocks-bulk-actor").value.trim()||null});
      if(error) throw error; els.bulkDialog.close(); invalidateAll(); await loadMovements(true);
    } catch(error){ $("stocks-bulk-error").textContent=error.message||"Mouvement multiple impossible."; $("stocks-bulk-error").hidden=false; } finally {submit.disabled=false;}
  }

  async function uploadImage(file) {
    if (!file) return null;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase(), path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseClient.storage.from("stock-items").upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return supabaseClient.storage.from("stock-items").getPublicUrl(path).data.publicUrl;
  }
  async function saveItem(e) {
    e.preventDefault(); const existing = items.find(i => String(i.id) === String(editingItemId));
    try {
      const file = $("stocks-item-image").files[0], imageUrl = file ? await uploadImage(file) : existing?.image_url || null;
      const categoryId = selectedCategoryId(); if (!categoryId) throw new Error("Sélectionne une catégorie existante dans les suggestions.");
      const payload = { name: $("stocks-item-name").value.trim(), category_id: selectedCategoryId(), unit_weight: Number($("stocks-item-weight").value), clean_value: Number($("stocks-item-clean").value), dirty_mode: $("stocks-dirty-mode").value, dirty_input: Number($("stocks-dirty-input").value), critical_threshold: $("stocks-item-threshold").value === "" ? null : Number($("stocks-item-threshold").value), image_url: imageUrl };
      const query = editingItemId ? supabaseClient.from("stock_items").update(payload).eq("id", editingItemId) : supabaseClient.from("stock_items").insert(payload);
      const { error } = await query; if (error) throw error;
      els.itemDialog.close(); invalidateAll(); await loadItems(true);
    } catch (error) { $("stocks-form-error").textContent = error.message || "Enregistrement impossible."; $("stocks-form-error").hidden = false; }
  }
  async function saveCategory(e) {
    e.preventDefault(); try {
      const { error } = await supabaseClient.from("stock_categories").insert({ name: $("stocks-category-name").value.trim() });
      if (error) throw error; els.categoryDialog.close(); $("stocks-category-name").value = ""; itemsLoaded = false; await loadItems(true);
    } catch (error) { $("stocks-category-error").textContent = error.message || "Création impossible."; $("stocks-category-error").hidden = false; }
  }
  async function saveLocation(e) {
    e.preventDefault(); try {
      const payload = { name: $("stocks-location-name").value.trim(), type: $("stocks-location-type").value, capacity_weight: Number($("stocks-location-capacity").value), location: $("stocks-location-address").value.trim() || null, notes: $("stocks-location-notes").value.trim() || null };
      const query = editingLocationId ? supabaseClient.from("stock_locations").update(payload).eq("id", editingLocationId) : supabaseClient.from("stock_locations").insert(payload);
      const { error } = await query; if (error) throw error;
      els.locationDialog.close(); invalidateAll(); await loadLocations(true);
    } catch (error) { $("stocks-location-form-error").textContent = error.message || "Enregistrement impossible."; $("stocks-location-form-error").hidden = false; }
  }
  async function saveQuickLocation(e) {
    e.preventDefault(); try {
      const { error } = await supabaseClient.from("stock_locations").update({ location: $("stocks-location-quick-value").value.trim() }).eq("id", quickLocationId);
      if (error) throw error; els.quickDialog.close(); invalidateAll(); await loadLocations(true);
    } catch (error) { $("stocks-location-quick-error").textContent = error.message || "Mise à jour impossible."; $("stocks-location-quick-error").hidden = false; }
  }
  async function saveMovement(e) {
    e.preventDefault();
    const submit = els.movementForm.querySelector('[type="submit"]'); submit.disabled = true;
    try {
      const payload = {
        p_item_id: $("stocks-movement-item").value,
        p_location_id: $("stocks-movement-location").value,
        p_movement_type: $("stocks-movement-type").value,
        p_quantity: Number($("stocks-movement-quantity").value),
        p_actor_label: $("stocks-movement-actor").value.trim() || null
      };
      const { error } = await supabaseClient.rpc("create_stock_movement", payload);
      if (error) throw error;
      els.movementDialog.close(); invalidateAll(); await loadMovements(true);
    } catch (error) {
      $("stocks-movement-error").textContent = error.message || "Mouvement impossible."; $("stocks-movement-error").hidden = false;
    } finally { submit.disabled = false; }
  }
  function invalidateAll() { itemsLoaded = locationsLoaded = globalLoaded = movementsLoaded = false; }
  async function removeItem(id) {
    if (!isAdmin || !confirm("Supprimer définitivement cet item ?")) return;
    const { error } = await supabaseClient.from("stock_items").delete().eq("id", id); if (error) return alert(error.message);
    invalidateAll(); await loadItems(true);
  }
  async function removeLocation(id) {
    if (!isAdmin || !confirm("Supprimer définitivement ce lieu de stockage ?")) return;
    const { error } = await supabaseClient.from("stock_locations").delete().eq("id", id); if (error) return alert(error.message);
    invalidateAll(); await loadLocations(true);
  }

  function setupRealtime() {
    if (realtimeChannel || typeof supabaseClient === "undefined" || typeof supabaseClient.channel !== "function") return;
    realtimeChannel = supabaseClient.channel(`stocks-live-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_movements" }, refreshActive)
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_balances" }, refreshActive)
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_locations" }, refreshActive)
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_items" }, refreshActive)
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_categories" }, refreshActive)
      .subscribe(status => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          realtimeChannel = null;
          setTimeout(setupRealtime, 1500);
        }
      });
  }
  let refreshTimer = null;
  function refreshActive() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      invalidateAll();
      if (activeTab === "items") loadItems(true);
      else if (activeTab === "locations") loadLocations(true);
      else if (activeTab === "global") loadGlobal(true);
      else loadMovements(true);
    }, 180);
  }

  document.querySelectorAll("[data-stocks-tab]").forEach(button => button.onclick = () => switchTab(button.dataset.stocksTab));
  els.addItem.onclick = () => openItem(); els.addCategory.onclick = () => { $("stocks-category-error").hidden = true; els.categoryDialog.showModal(); };
  els.addLocation.onclick = () => openLocation(); els.addMovement.onclick = openMovement; els.bulkMovement.onclick = openBulkMovement;
  els.refresh.onclick = () => { itemsLoaded = false; loadItems(true); }; els.search.oninput = renderItems;
  els.locationRefresh.onclick = () => { locationsLoaded = false; loadLocations(true); }; els.locationSearch.oninput = renderLocations; els.locationFilter.onchange = renderLocations;
  els.globalRefresh.onclick = () => { globalLoaded = false; loadGlobal(true); }; els.globalSearch.oninput = renderGlobal; els.globalCategoryFilter.onchange = renderGlobal; els.globalSort.onchange = renderGlobal; els.globalStateFilter.onchange = renderGlobal;
  els.movementSearch.oninput = renderMovements; els.movementTypeFilter.onchange = renderMovements; els.movementLocationFilter.onchange = renderMovements;
  $("stocks-dirty-mode").onchange = previewDirty; $("stocks-dirty-input").oninput = previewDirty; $("stocks-item-clean").oninput = previewDirty;
  ["stocks-movement-item", "stocks-movement-location", "stocks-movement-type", "stocks-movement-quantity"].forEach(id => $(id).addEventListener("input", updateMovementPreview));
  $("stocks-item-image").onchange = e => { const f = e.target.files[0]; $("stocks-image-preview").innerHTML = f ? `<img src="${URL.createObjectURL(f)}" alt="Aperçu">` : "Aucune image sélectionnée"; };
  els.itemForm.addEventListener("submit", saveItem); els.categoryForm.addEventListener("submit", saveCategory); els.locationForm.addEventListener("submit", saveLocation); els.quickForm.addEventListener("submit", saveQuickLocation); els.movementForm.addEventListener("submit", saveMovement); els.bulkForm.addEventListener("submit", saveBulkMovement);
  document.querySelectorAll("[data-stocks-close]").forEach(b => b.onclick = () => els.itemDialog.close());
  document.querySelectorAll("[data-stocks-category-close]").forEach(b => b.onclick = () => els.categoryDialog.close());
  document.querySelectorAll("[data-stocks-location-close]").forEach(b => b.onclick = () => els.locationDialog.close());
  document.querySelectorAll("[data-stocks-quick-close]").forEach(b => b.onclick = () => els.quickDialog.close());
  document.querySelectorAll("[data-stocks-movement-close]").forEach(b => b.onclick = () => els.movementDialog.close()); document.querySelectorAll("[data-stocks-bulk-close]").forEach(b => b.onclick = () => els.bulkDialog.close());
  [els.itemDialog, els.categoryDialog, els.locationDialog, els.quickDialog, els.globalDetailDialog, els.locationDetailDialog, els.movementDialog, els.bulkDialog].forEach(d => d.addEventListener("click", e => { if (e.target === d) d.close(); }));
  $("stocks-bulk-add-line").onclick=()=>{ $("stocks-bulk-lines").insertAdjacentHTML("beforeend",bulkLineTemplate()); updateBulkPreview(); };
  $("stocks-bulk-lines").addEventListener("input",updateBulkPreview); $("stocks-bulk-location").addEventListener("change",updateBulkPreview); $("stocks-bulk-type").addEventListener("change",updateBulkPreview);
  $("stocks-bulk-lines").addEventListener("click",e=>{const b=e.target.closest(".stocks-bulk-remove"); if(!b)return; const lines=document.querySelectorAll(".stocks-bulk-line"); if(lines.length>1)b.closest(".stocks-bulk-line").remove(); updateBulkPreview();});
  els.grid.addEventListener("click", e => {
    const edit = e.target.closest("[data-edit-item]"), del = e.target.closest("[data-delete-item]");
    if (edit) openItem(items.find(i => String(i.id) === edit.dataset.editItem)); if (del) removeItem(del.dataset.deleteItem);
  });
  els.locationsContent.addEventListener("click", e => {
    const edit = e.target.closest("[data-edit-location]"), del = e.target.closest("[data-delete-location]"), quick = e.target.closest("[data-quick-location]");
    if (edit) return openLocation(locations.find(l => String(l.id) === edit.dataset.editLocation));
    if (del) return removeLocation(del.dataset.deleteLocation);
    if (quick) return openQuickLocation(locations.find(l => String(l.id) === quick.dataset.quickLocation));
    const card=e.target.closest("[data-location-detail]"); if(card) openLocationDetail(card.dataset.locationDetail);
  });
  els.globalList.addEventListener("click", e => { const row = e.target.closest("[data-global-item]"); if (row) openGlobalDetail(row.dataset.globalItem); });
  window.addEventListener("hub:stocks-visible", async () => { await detectAdmin(); setupRealtime(); activeTab === "items" ? loadItems() : activeTab === "locations" ? loadLocations() : activeTab === "global" ? loadGlobal() : loadMovements(); });
  if (typeof supabaseClient !== "undefined" && supabaseClient.auth) supabaseClient.auth.onAuthStateChange(async () => { await detectAdmin(); renderItems(); renderLocations(); });
})();

"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    module: $("stocks-module"), brandSubtitle: $("stocks-brand-subtitle"),
    itemsPanel: $("stocks-items-panel"), locationsPanel: $("stocks-locations-panel"),
    grid: $("stocks-items-grid"), search: $("stocks-search"), counter: $("stocks-counter"), refresh: $("stocks-refresh"), status: $("stocks-status"),
    addItem: $("stocks-add-item"), addCategory: $("stocks-add-category"), itemDialog: $("stocks-item-dialog"), itemForm: $("stocks-item-form"), categoryDialog: $("stocks-category-dialog"), categoryForm: $("stocks-category-form"),
    locationSearch: $("stocks-location-search"), locationFilter: $("stocks-location-type-filter"), locationCounter: $("stocks-location-counter"), locationRefresh: $("stocks-location-refresh"), locationStatus: $("stocks-location-status"), locationsContent: $("stocks-locations-content"), addLocation: $("stocks-add-location"), locationDialog: $("stocks-location-dialog"), locationForm: $("stocks-location-form"), quickDialog: $("stocks-location-quick-dialog"), quickForm: $("stocks-location-quick-form")
  };
  let items = [], categories = [], locations = [], editingItemId = null, editingLocationId = null, quickLocationId = null;
  let itemsLoaded = false, locationsLoaded = false, isAdmin = false, activeTab = "items";
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(v || 0));
  const kg = (v) => `${Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} kg`;

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
    els.brandSubtitle.textContent = tab === "items" ? "Banque d’items" : "Lieux de stockage";
    if (tab === "items") loadItems(); else loadLocations();
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
        <div class="stocks-card-image">${i.image_url ? `<img src="${esc(i.image_url)}" alt="${esc(i.name)}">` : '<span class="stocks-card-placeholder">📦</span>'}</div>
        <div class="stocks-card-body">
          <div class="stocks-card-head"><h3>${esc(i.name)}</h3><span class="stocks-badge">${esc(i.stock_categories?.name || "Sans catégorie")}</span></div>
          <div class="stocks-card-data">
            <div><span>Poids</span><strong>${kg(i.unit_weight)}</strong></div><div><span>Seuil global</span><strong>${i.critical_threshold ?? "—"}</strong></div>
            <div><span>Valeur propre</span><strong>${money(i.clean_value)}</strong></div><div><span>Valeur sale</span><strong>${money(dirtyValue(i))}</strong></div>
          </div>
          <div class="stocks-card-actions"><button data-edit-item="${i.id}">Modifier</button>${isAdmin ? `<button class="danger" data-delete-item="${i.id}">Supprimer</button>` : ""}</div>
        </div>
      </article>`).join("");
  }

  async function loadLocations(force = false) {
    if (locationsLoaded && !force) return renderLocations();
    els.locationStatus.textContent = "Chargement…"; els.locationRefresh.disabled = true;
    try {
      const { data, error } = await supabaseClient.from("stock_locations").select("*").order("type").order("name");
      if (error) throw error;
      locations = data || []; locationsLoaded = true; els.locationStatus.textContent = ""; renderLocations();
    } catch (error) {
      console.error(error); els.locationStatus.textContent = "Impossible de charger les lieux. Exécute STOCK_LOCATIONS_SETUP.sql dans Supabase.";
    } finally { els.locationRefresh.disabled = false; }
  }
  function locationCard(location) {
    const used = Number(location.used_weight || 0), capacity = Number(location.capacity_weight || 0);
    const percent = capacity > 0 ? Math.min(100, Math.max(0, used / capacity * 100)) : 0;
    const typeName = location.type === "vehicle" ? "Véhicule" : "Habitation";
    const icon = location.type === "vehicle" ? "🚗" : "🏠";
    return `<article class="stocks-location-card">
      <div class="stocks-location-card-head"><div class="stocks-location-icon">${icon}</div><div><span class="stocks-location-type">${typeName}</span><h3>${esc(location.name)}</h3></div></div>
      <button class="stocks-location-address" data-quick-location="${location.id}" title="Modifier rapidement la localisation"><span>📍</span><strong>${esc(location.location || "Localisation non renseignée")}</strong><small>Modifier</small></button>
      <div class="stocks-capacity-row"><span>Remplissage</span><strong>${kg(used)} / ${kg(capacity)}</strong></div>
      <div class="stocks-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}"><span style="width:${percent}%"></span></div>
      <div class="stocks-location-metrics"><div><span>Utilisé</span><strong>${kg(used)}</strong></div><div><span>Restant</span><strong>${kg(Math.max(0, capacity-used))}</strong></div><div><span>Rempli</span><strong>${Math.round(percent)} %</strong></div></div>
      ${location.notes ? `<p class="stocks-location-notes">${esc(location.notes)}</p>` : ""}
      <div class="stocks-card-actions"><button data-edit-location="${location.id}">Modifier</button>${isAdmin ? `<button class="danger" data-delete-location="${location.id}">Supprimer</button>` : ""}</div>
    </article>`;
  }
  function renderLocations() {
    const q = els.locationSearch.value.trim().toLowerCase(), type = els.locationFilter.value;
    const rows = locations.filter(l => (type === "all" || l.type === type) && (!q || [l.name, l.location, l.notes].some(v => String(v || "").toLowerCase().includes(q))));
    els.locationCounter.textContent = `${rows.length} lieu${rows.length > 1 ? "x" : ""}`;
    if (!rows.length) { els.locationsContent.innerHTML = '<div class="stocks-empty">Aucun lieu de stockage à afficher.</div>'; return; }
    const groups = [["home", "Habitations", "🏠"], ["vehicle", "Véhicules", "🚗"]];
    els.locationsContent.innerHTML = groups.map(([key, title, icon]) => {
      const groupRows = rows.filter(l => l.type === key);
      if (!groupRows.length) return "";
      return `<section class="stocks-location-group"><header><div><span>${icon}</span><h2>${title}</h2></div><small>${groupRows.length} lieu${groupRows.length > 1 ? "x" : ""}</small></header><div class="stocks-locations-grid">${groupRows.map(locationCard).join("")}</div></section>`;
    }).join("");
  }

  function fillCategories(selected = "") {
    const sel = $("stocks-item-category");
    sel.innerHTML = '<option value="">Sélectionner…</option>' + categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    sel.value = selected || "";
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
      const payload = { name: $("stocks-item-name").value.trim(), category_id: $("stocks-item-category").value, unit_weight: Number($("stocks-item-weight").value), clean_value: Number($("stocks-item-clean").value), dirty_mode: $("stocks-dirty-mode").value, dirty_input: Number($("stocks-dirty-input").value), critical_threshold: $("stocks-item-threshold").value === "" ? null : Number($("stocks-item-threshold").value), image_url: imageUrl };
      const query = editingItemId ? supabaseClient.from("stock_items").update(payload).eq("id", editingItemId) : supabaseClient.from("stock_items").insert(payload);
      const { error } = await query; if (error) throw error;
      els.itemDialog.close(); itemsLoaded = false; await loadItems(true);
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
      els.locationDialog.close(); locationsLoaded = false; await loadLocations(true);
    } catch (error) { $("stocks-location-form-error").textContent = error.message || "Enregistrement impossible."; $("stocks-location-form-error").hidden = false; }
  }
  async function saveQuickLocation(e) {
    e.preventDefault(); try {
      const { error } = await supabaseClient.from("stock_locations").update({ location: $("stocks-location-quick-value").value.trim() }).eq("id", quickLocationId);
      if (error) throw error; els.quickDialog.close(); locationsLoaded = false; await loadLocations(true);
    } catch (error) { $("stocks-location-quick-error").textContent = error.message || "Mise à jour impossible."; $("stocks-location-quick-error").hidden = false; }
  }
  async function removeItem(id) {
    if (!isAdmin || !confirm("Supprimer définitivement cet item ?")) return;
    const { error } = await supabaseClient.from("stock_items").delete().eq("id", id); if (error) return alert(error.message);
    itemsLoaded = false; await loadItems(true);
  }
  async function removeLocation(id) {
    if (!isAdmin || !confirm("Supprimer définitivement ce lieu de stockage ?")) return;
    const { error } = await supabaseClient.from("stock_locations").delete().eq("id", id); if (error) return alert(error.message);
    locationsLoaded = false; await loadLocations(true);
  }

  document.querySelectorAll("[data-stocks-tab]").forEach(button => button.onclick = () => switchTab(button.dataset.stocksTab));
  els.addItem.onclick = () => openItem(); els.addCategory.onclick = () => { $("stocks-category-error").hidden = true; els.categoryDialog.showModal(); };
  els.addLocation.onclick = () => openLocation();
  els.refresh.onclick = () => { itemsLoaded = false; loadItems(true); }; els.search.oninput = renderItems;
  els.locationRefresh.onclick = () => { locationsLoaded = false; loadLocations(true); }; els.locationSearch.oninput = renderLocations; els.locationFilter.onchange = renderLocations;
  $("stocks-dirty-mode").onchange = previewDirty; $("stocks-dirty-input").oninput = previewDirty; $("stocks-item-clean").oninput = previewDirty;
  $("stocks-item-image").onchange = e => { const f = e.target.files[0]; $("stocks-image-preview").innerHTML = f ? `<img src="${URL.createObjectURL(f)}" alt="Aperçu">` : "Aucune image sélectionnée"; };
  els.itemForm.addEventListener("submit", saveItem); els.categoryForm.addEventListener("submit", saveCategory); els.locationForm.addEventListener("submit", saveLocation); els.quickForm.addEventListener("submit", saveQuickLocation);
  document.querySelectorAll("[data-stocks-close]").forEach(b => b.onclick = () => els.itemDialog.close());
  document.querySelectorAll("[data-stocks-category-close]").forEach(b => b.onclick = () => els.categoryDialog.close());
  document.querySelectorAll("[data-stocks-location-close]").forEach(b => b.onclick = () => els.locationDialog.close());
  document.querySelectorAll("[data-stocks-quick-close]").forEach(b => b.onclick = () => els.quickDialog.close());
  [els.itemDialog, els.categoryDialog, els.locationDialog, els.quickDialog].forEach(d => d.addEventListener("click", e => { if (e.target === d) d.close(); }));
  els.grid.addEventListener("click", e => {
    const edit = e.target.closest("[data-edit-item]"), del = e.target.closest("[data-delete-item]");
    if (edit) openItem(items.find(i => String(i.id) === edit.dataset.editItem)); if (del) removeItem(del.dataset.deleteItem);
  });
  els.locationsContent.addEventListener("click", e => {
    const edit = e.target.closest("[data-edit-location]"), del = e.target.closest("[data-delete-location]"), quick = e.target.closest("[data-quick-location]");
    if (edit) openLocation(locations.find(l => String(l.id) === edit.dataset.editLocation));
    if (del) removeLocation(del.dataset.deleteLocation);
    if (quick) openQuickLocation(locations.find(l => String(l.id) === quick.dataset.quickLocation));
  });
  window.addEventListener("hub:stocks-visible", async () => { await detectAdmin(); activeTab === "items" ? loadItems() : loadLocations(); });
  if (window.supabaseClient?.auth) supabaseClient.auth.onAuthStateChange(async () => { await detectAdmin(); renderItems(); renderLocations(); });
})();

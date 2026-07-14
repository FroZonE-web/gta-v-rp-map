"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    module: $("stocks-module"), grid: $("stocks-items-grid"), search: $("stocks-search"), counter: $("stocks-counter"),
    refresh: $("stocks-refresh"), status: $("stocks-status"), addItem: $("stocks-add-item"), addCategory: $("stocks-add-category"),
    itemDialog: $("stocks-item-dialog"), itemForm: $("stocks-item-form"), categoryDialog: $("stocks-category-dialog"), categoryForm: $("stocks-category-form")
  };
  let items = [], categories = [], editingId = null, loaded = false, isAdmin = false;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(v || 0));
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
  async function load(force = false) {
    if (loaded && !force) return render();
    els.status.textContent = "Chargement…"; els.refresh.disabled = true;
    try {
      const [catRes, itemRes] = await Promise.all([
        supabaseClient.from("stock_categories").select("*").order("name"),
        supabaseClient.from("stock_items").select("*, stock_categories(name)").order("name")
      ]);
      if (catRes.error) throw catRes.error;
      if (itemRes.error) throw itemRes.error;
      categories = catRes.data || []; items = itemRes.data || []; loaded = true; els.status.textContent = ""; render();
    } catch (error) {
      console.error(error); els.status.textContent = "Impossible de charger la banque d’items. Vérifie que STOCKS_SETUP.sql a été exécuté.";
    } finally { els.refresh.disabled = false; }
  }
  function render() {
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
            <div><span>Poids</span><strong>${Number(i.unit_weight || 0).toLocaleString("fr-FR")} kg</strong></div>
            <div><span>Seuil global</span><strong>${i.critical_threshold ?? "—"}</strong></div>
            <div><span>Valeur propre</span><strong>${money(i.clean_value)}</strong></div>
            <div><span>Valeur sale</span><strong>${money(dirtyValue(i))}</strong></div>
          </div>
          <div class="stocks-card-actions"><button data-edit-item="${i.id}">Modifier</button>${isAdmin ? `<button class="danger" data-delete-item="${i.id}">Supprimer</button>` : ""}</div>
        </div>
      </article>`).join("");
  }
  function fillCategories(selected = "") {
    const sel = $("stocks-item-category");
    sel.innerHTML = '<option value="">Sélectionner…</option>' + categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    sel.value = selected || "";
  }
  function openItem(item = null) {
    editingId = item?.id || null;
    $("stocks-item-dialog-title").textContent = item ? "Modifier l’item" : "Nouvel item";
    $("stocks-item-name").value = item?.name || ""; fillCategories(item?.category_id || "");
    $("stocks-item-weight").value = item?.unit_weight ?? ""; $("stocks-item-clean").value = item?.clean_value ?? "";
    $("stocks-item-threshold").value = item?.critical_threshold ?? ""; $("stocks-dirty-mode").value = item?.dirty_mode || "fixed";
    $("stocks-dirty-input").value = item?.dirty_input ?? ""; $("stocks-item-image").value = "";
    $("stocks-image-preview").innerHTML = item?.image_url ? `<img src="${esc(item.image_url)}" alt="">` : "Aucune image sélectionnée";
    $("stocks-form-error").hidden = true; previewDirty(); els.itemDialog.showModal();
  }
  async function uploadImage(file) {
    if (!file) return null;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseClient.storage.from("stock-items").upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return supabaseClient.storage.from("stock-items").getPublicUrl(path).data.publicUrl;
  }
  async function saveItem(e) {
    e.preventDefault();
    const existing = items.find(i => String(i.id) === String(editingId));
    try {
      const file = $("stocks-item-image").files[0];
      const imageUrl = file ? await uploadImage(file) : existing?.image_url || null;
      const payload = {
        name: $("stocks-item-name").value.trim(), category_id: $("stocks-item-category").value,
        unit_weight: Number($("stocks-item-weight").value), clean_value: Number($("stocks-item-clean").value),
        dirty_mode: $("stocks-dirty-mode").value, dirty_input: Number($("stocks-dirty-input").value),
        critical_threshold: $("stocks-item-threshold").value === "" ? null : Number($("stocks-item-threshold").value), image_url: imageUrl
      };
      const query = editingId ? supabaseClient.from("stock_items").update(payload).eq("id", editingId) : supabaseClient.from("stock_items").insert(payload);
      const { error } = await query; if (error) throw error;
      els.itemDialog.close(); loaded = false; await load(true);
    } catch (error) { $("stocks-form-error").textContent = error.message || "Enregistrement impossible."; $("stocks-form-error").hidden = false; }
  }
  async function saveCategory(e) {
    e.preventDefault();
    try {
      const { error } = await supabaseClient.from("stock_categories").insert({ name: $("stocks-category-name").value.trim() });
      if (error) throw error; els.categoryDialog.close(); $("stocks-category-name").value = ""; loaded = false; await load(true);
    } catch (error) { $("stocks-category-error").textContent = error.message || "Création impossible."; $("stocks-category-error").hidden = false; }
  }
  async function removeItem(id) {
    if (!isAdmin || !confirm("Supprimer définitivement cet item ?")) return;
    const { error } = await supabaseClient.from("stock_items").delete().eq("id", id);
    if (error) return alert(error.message); loaded = false; await load(true);
  }
  els.addItem.onclick = () => openItem(); els.addCategory.onclick = () => { $("stocks-category-error").hidden = true; els.categoryDialog.showModal(); };
  els.refresh.onclick = () => { loaded = false; load(true); }; els.search.oninput = render;
  $("stocks-dirty-mode").onchange = previewDirty; $("stocks-dirty-input").oninput = previewDirty; $("stocks-item-clean").oninput = previewDirty;
  $("stocks-item-image").onchange = e => { const f = e.target.files[0]; $("stocks-image-preview").innerHTML = f ? `<img src="${URL.createObjectURL(f)}" alt="Aperçu">` : "Aucune image sélectionnée"; };
  els.itemForm.addEventListener("submit", saveItem); els.categoryForm.addEventListener("submit", saveCategory);
  document.querySelectorAll("[data-stocks-close]").forEach(b => b.onclick = () => els.itemDialog.close());
  document.querySelectorAll("[data-stocks-category-close]").forEach(b => b.onclick = () => els.categoryDialog.close());
  [els.itemDialog, els.categoryDialog].forEach(d => d.addEventListener("click", e => { if (e.target === d) d.close(); }));
  els.grid.addEventListener("click", e => { const edit = e.target.closest("[data-edit-item]"); const del = e.target.closest("[data-delete-item]"); if (edit) openItem(items.find(i => String(i.id) === edit.dataset.editItem)); if (del) removeItem(del.dataset.deleteItem); });
  window.addEventListener("hub:stocks-visible", async () => { await detectAdmin(); load(); });
  if (window.supabaseClient?.auth) supabaseClient.auth.onAuthStateChange(async () => { await detectAdmin(); render(); });
})();

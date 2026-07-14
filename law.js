"use strict";

/* =========================================================
   ASHEN WOLVES HUB v1.2 — ANNUAIRE FORCES DE L'ORDRE
   ========================================================= */

(() => {
  const route = document.getElementById("annuaire-module");
  const panel = route?.querySelector('[data-directory-panel="law"]');
  if (!route || !panel || typeof supabaseClient === "undefined") return;

  const search = document.getElementById("law-search");
  const sort = document.getElementById("law-sort");
  const group = document.getElementById("law-group");
  const add = document.getElementById("law-add");
  const refresh = document.getElementById("law-refresh");
  const counter = document.getElementById("law-counter");
  const state = document.getElementById("law-state");
  const shell = document.getElementById("law-table-shell");
  const body = document.getElementById("law-body");
  const cards = document.getElementById("law-cards");
  const modal = document.getElementById("law-modal");
  const form = document.getElementById("law-form");
  const closeButtons = [...route.querySelectorAll("[data-law-close]")];
  const title = document.getElementById("law-dialog-title");
  const submit = document.getElementById("law-submit");
  const errorBox = document.getElementById("law-form-error");
  const serviceOptions = document.getElementById("law-service-options");

  const fields = {
    service: document.getElementById("law-service"),
    badge_number: document.getElementById("law-badge-number"),
    first_name: document.getElementById("law-first-name"),
    last_name: document.getElementById("law-last-name"),
    phone: document.getElementById("law-phone"),
    address: document.getElementById("law-address"),
    notes: document.getElementById("law-notes"),
    is_detective: document.getElementById("law-detective")
  };

  let records = [];
  let loaded = false;
  let canManage = false;
  let editingId = null;
  const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const display = (value) => value === null || value === undefined || value === "" ? "—" : escapeHtml(value);
  const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  function badgeClass(value) {
    let hash = 0;
    for (const char of String(value || "")) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return `directory-contact-badge badge-${hash % 8}`;
  }

  async function resolveAdmin() {
    canManage = false;
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session?.user) {
      try {
        const { data: allowed } = await supabaseClient.rpc("is_admin");
        canManage = allowed === true && !(typeof visitorMode !== "undefined" && visitorMode === true);
      } catch {
        canManage = false;
      }
    }
    route.querySelectorAll("[data-law-admin]").forEach((element) => { element.hidden = !canManage; });
  }

  function setState(kind, heading, message) {
    state.className = `directory-${kind}`;
    state.innerHTML = `<div class="directory-state-card"><strong>${escapeHtml(heading)}</strong><p>${escapeHtml(message)}</p></div>`;
    state.hidden = false;
    shell.hidden = true;
    cards.hidden = true;
  }

  function hideState() {
    state.hidden = true;
    shell.hidden = false;
    cards.hidden = false;
  }

  function searchable(record) {
    return normalize([record.service, record.badge_number, record.first_name, record.last_name, record.phone, record.address, record.notes, record.is_detective ? "détective detective" : ""].join(" "));
  }

  function sorted(list) {
    const copy = [...list];
    const compare = (key, direction = 1) => (a, b) => direction * collator.compare(a[key] || "", b[key] || "") || collator.compare(a.last_name || "", b.last_name || "") || collator.compare(a.first_name || "", b.first_name || "");
    switch (sort.value) {
      case "service-asc": return copy.sort(compare("service"));
      case "service-desc": return copy.sort(compare("service", -1));
      case "badge-asc": return copy.sort(compare("badge_number"));
      case "last-name": return copy.sort(compare("last_name"));
      case "first-name": return copy.sort(compare("first_name"));
      case "detective-first": return copy.sort((a, b) => Number(b.is_detective) - Number(a.is_detective) || collator.compare(a.last_name || "", b.last_name || ""));
      default: return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }

  function visibleRecords() {
    const query = normalize(search.value);
    const filtered = query ? records.filter((record) => searchable(record).includes(query)) : records;
    return sorted(filtered);
  }

  function actions(record) {
    if (!canManage) return "";
    return `<div class="directory-row-actions"><button class="directory-icon-button" data-law-edit="${escapeHtml(record.id)}" type="button" aria-label="Modifier">✎</button><button class="directory-icon-button is-danger" data-law-delete="${escapeHtml(record.id)}" type="button" aria-label="Supprimer">×</button></div>`;
  }

  function row(record) {
    return `<tr>
      <td>${record.service ? `<span class="${badgeClass(record.service)}">${escapeHtml(record.service)}</span>` : "—"}</td>
      <td>${display(record.badge_number)}</td>
      <td class="directory-name">${display(record.first_name)}</td>
      <td class="directory-name">${display(record.last_name)}</td>
      <td><button class="directory-copy-value" type="button" data-copy="${escapeHtml(record.phone || "")}">${display(record.phone)}</button></td>
      <td><button class="directory-copy-value" type="button" data-copy="${escapeHtml(record.address || "")}">${display(record.address)}</button></td>
      <td class="directory-law-notes">${display(record.notes)}</td>
      <td><span class="directory-detective-badge${record.is_detective ? "" : " is-no"}">${record.is_detective ? "✓ Oui" : "Non"}</span></td>
      ${canManage ? `<td>${actions(record)}</td>` : ""}
    </tr>`;
  }

  function groupHeader(label, count) {
    return `<tr class="directory-group-row"><td colspan="9"><strong>${escapeHtml(label || "Service non renseigné")}</strong><span>${count} contact${count > 1 ? "s" : ""}</span></td></tr>`;
  }

  function bindRenderedActions() {
    panel.querySelectorAll("[data-law-edit]").forEach((button) => button.addEventListener("click", () => openEdit(button.dataset.lawEdit)));
    panel.querySelectorAll("[data-law-delete]").forEach((button) => button.addEventListener("click", () => removeRecord(button.dataset.lawDelete)));
    panel.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
      const value = button.dataset.copy;
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        const previous = button.textContent;
        button.textContent = "Copié ✓";
        setTimeout(() => { button.textContent = previous; }, 900);
      } catch {}
    }));
  }

  function render() {
    const visible = visibleRecords();
    counter.textContent = `${visible.length} contact${visible.length > 1 ? "s" : ""}`;
    if (!records.length) {
      setState("empty", "Aucun contact enregistré", "Ajoutez le premier contact des forces de l’ordre.");
      return;
    }
    if (!visible.length) {
      setState("empty", "Aucun résultat", "Aucun contact ne correspond à votre recherche.");
      return;
    }
    hideState();

    if (group.value === "service") {
      const grouped = new Map();
      visible.forEach((record) => {
        const label = record.service || "Service non renseigné";
        if (!grouped.has(label)) grouped.set(label, []);
        grouped.get(label).push(record);
      });
      body.innerHTML = [...grouped.entries()].map(([label, items]) => groupHeader(label, items.length) + items.map(row).join("")).join("");
    } else {
      body.innerHTML = visible.map(row).join("");
    }

    cards.innerHTML = visible.map((record) => `<article class="directory-member-card"><div class="directory-member-card-head"><span class="${badgeClass(record.service)}">${display(record.service)}</span><h3>${display([record.first_name, record.last_name].filter(Boolean).join(" "))}</h3></div><dl><dt>Matricule</dt><dd>${display(record.badge_number)}</dd><dt>Téléphone</dt><dd>${display(record.phone)}</dd><dt>Adresse</dt><dd>${display(record.address)}</dd><dt>Détective</dt><dd>${record.is_detective ? "Oui" : "Non"}</dd><dt>Notes</dt><dd>${display(record.notes)}</dd></dl>${canManage ? `<div class="directory-member-card-actions">${actions(record)}</div>` : ""}</article>`).join("");
    bindRenderedActions();
  }

  function updateServiceOptions() {
    const values = [...new Set(["BSCO", "LSPD", "SASP", "LSCS", ...records.map((record) => record.service)].filter(Boolean))].sort(collator.compare);
    serviceOptions.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join("");
  }

  async function load({ force = false } = {}) {
    if (loaded && !force) {
      render();
      return;
    }
    await resolveAdmin();
    refresh.disabled = true;
    refresh.textContent = "Actualisation…";
    if (!records.length) setState("loading", "Chargement", "Récupération des forces de l’ordre…");
    const { data, error } = await supabaseClient.from("directory_law_enforcement").select("id, service, badge_number, first_name, last_name, phone, address, notes, is_detective, created_at, updated_at").order("created_at", { ascending: false });
    refresh.disabled = false;
    refresh.textContent = "↻ Actualiser";
    if (error) {
      console.error(error);
      setState("restricted", "Annuaire indisponible", "La table Supabase des forces de l’ordre n’est pas encore installée.");
      return;
    }
    records = data || [];
    loaded = true;
    updateServiceOptions();
    render();
  }

  function resetForm() {
    editingId = null;
    form.reset();
    errorBox.textContent = "";
    title.textContent = "Ajouter un contact FDO";
    submit.textContent = "Ajouter le contact";
  }

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => fields.service.focus(), 0);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    resetForm();
  }

  function openEdit(id) {
    if (!canManage) return;
    const record = records.find((item) => String(item.id) === String(id));
    if (!record) return;
    editingId = record.id;
    fields.service.value = record.service || "";
    fields.badge_number.value = record.badge_number || "";
    fields.first_name.value = record.first_name || "";
    fields.last_name.value = record.last_name || "";
    fields.phone.value = record.phone || "";
    fields.address.value = record.address || "";
    fields.notes.value = record.notes || "";
    fields.is_detective.checked = record.is_detective === true;
    title.textContent = `Modifier ${record.first_name || record.last_name || "le contact"}`;
    submit.textContent = "Enregistrer les modifications";
    openModal();
  }

  function payload() {
    return {
      service: fields.service.value.trim() || null,
      badge_number: fields.badge_number.value.trim() || null,
      first_name: fields.first_name.value.trim() || null,
      last_name: fields.last_name.value.trim() || null,
      phone: fields.phone.value.trim() || null,
      address: fields.address.value.trim() || null,
      notes: fields.notes.value.trim() || null,
      is_detective: fields.is_detective.checked
    };
  }

  async function save(event) {
    event.preventDefault();
    const data = payload();
    if (![data.service, data.badge_number, data.first_name, data.last_name, data.phone].some(Boolean)) {
      errorBox.textContent = "Renseignez au moins le service, le matricule, un nom, un prénom ou un téléphone.";
      return;
    }
    submit.disabled = true;
    submit.textContent = "Enregistrement…";
    errorBox.textContent = "";
    const query = editingId
      ? supabaseClient.from("directory_law_enforcement").update(data).eq("id", editingId)
      : supabaseClient.from("directory_law_enforcement").insert(data);
    const { error } = await query;
    submit.disabled = false;
    if (error) {
      errorBox.textContent = error.message;
      submit.textContent = editingId ? "Enregistrer les modifications" : "Ajouter le contact";
      return;
    }
    closeModal();
    loaded = false;
    await load({ force: true });
  }

  async function removeRecord(id) {
    if (!canManage) return;
    const record = records.find((item) => String(item.id) === String(id));
    if (!record || !confirm(`Supprimer définitivement ${[record.first_name, record.last_name].filter(Boolean).join(" ") || "ce contact"} ?`)) return;
    const { error } = await supabaseClient.from("directory_law_enforcement").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    loaded = false;
    await load({ force: true });
  }

  search.addEventListener("input", render);
  sort.addEventListener("change", render);
  group.addEventListener("change", render);
  add.addEventListener("click", () => { resetForm(); openModal(); });
  refresh.addEventListener("click", () => { loaded = false; load({ force: true }); });
  form.addEventListener("submit", save);
  closeButtons.forEach((button) => button.addEventListener("click", closeModal));
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  route.querySelector('[data-directory-tab="law"]').addEventListener("click", () => load({ force: true }));
  window.addEventListener("hub:directory-visible", () => { if (!panel.hidden) load({ force: true }); });
  supabaseClient.auth.onAuthStateChange(() => { loaded = false; if (!route.hidden && !panel.hidden) setTimeout(() => load({ force: true }), 0); });
})();

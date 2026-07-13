"use strict";

/* =========================================================
   ASHEN WOLVES HUB v1.2 — ANNUAIRE INTERNE
   Le module utilise Supabase sans modifier la logique Carte.
   ========================================================= */

(() => {
  const route = document.getElementById("annuaire-module");
  if (!route) return;

  const tabs = [...route.querySelectorAll("[data-directory-tab]")];
  const panels = [...route.querySelectorAll("[data-directory-panel]")];
  const searchInput = document.getElementById("directory-search");
  const counter = document.getElementById("directory-counter");
  const tableBody = document.getElementById("directory-members-body");
  const cards = document.getElementById("directory-members-cards");
  const tableShell = document.getElementById("directory-table-shell");
  const state = document.getElementById("directory-state");
  const addButton = document.getElementById("directory-add-member");
  const modal = document.getElementById("directory-modal");
  const form = document.getElementById("directory-form");
  const closeButtons = [...route.querySelectorAll("[data-directory-close]")];
  const dialogTitle = document.getElementById("directory-dialog-title");
  const formError = document.getElementById("directory-form-error");
  const submitButton = document.getElementById("directory-submit");

  let members = [];
  let sessionUser = null;
  let canManage = false;
  let editingId = null;
  let loadedOnce = false;

  const fields = {
    grade_code: document.getElementById("directory-grade-code"),
    sort_order: document.getElementById("directory-sort-order"),
    first_name: document.getElementById("directory-first-name"),
    nickname: document.getElementById("directory-nickname"),
    last_name: document.getElementById("directory-last-name"),
    identity_name: document.getElementById("directory-identity-name"),
    rib: document.getElementById("directory-rib"),
    phone: document.getElementById("directory-phone"),
    address: document.getElementById("directory-address"),
    housing_type: document.getElementById("directory-housing-type"),
    district: document.getElementById("directory-district")
  };

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function isAdminAvailable() {
    try {
      return typeof isAdmin !== "undefined" && isAdmin === true &&
        !(typeof visitorMode !== "undefined" && visitorMode === true);
    } catch {
      return false;
    }
  }

  function setState(kind, title, message) {
    state.className = `directory-${kind}`;
    state.innerHTML = `<div class="directory-state-card"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div>`;
    state.hidden = false;
    tableShell.hidden = true;
    cards.hidden = true;
  }

  function hideState() {
    state.hidden = true;
    tableShell.hidden = false;
    cards.hidden = false;
  }

  function memberSearchText(member) {
    return normalize([
      member.grade_code,
      member.first_name,
      member.nickname,
      member.last_name,
      member.identity_name,
      member.phone,
      member.address,
      member.housing_type,
      member.district
    ].join(" "));
  }

  function getFilteredMembers() {
    const query = normalize(searchInput.value.trim());
    if (!query) return members;
    return members.filter((member) => memberSearchText(member).includes(query));
  }

  function actionButtons(member) {
    if (!canManage) return "";
    return `<div class="directory-row-actions">
      <button class="directory-icon-button" type="button" data-directory-edit="${escapeHtml(member.id)}" aria-label="Modifier ${escapeHtml(member.identity_name)}">✎</button>
      <button class="directory-icon-button is-danger" type="button" data-directory-delete="${escapeHtml(member.id)}" aria-label="Supprimer ${escapeHtml(member.identity_name)}">×</button>
    </div>`;
  }

  function renderMembers() {
    const visible = getFilteredMembers();
    counter.textContent = `${visible.length} membre${visible.length > 1 ? "s" : ""} affiché${visible.length > 1 ? "s" : ""} · ${members.length}/16`;

    if (!members.length) {
      setState("empty", "Aucun membre enregistré", canManage
        ? "Ajoutez le premier membre de l'annuaire avec le bouton prévu à cet effet."
        : "L'annuaire ne contient actuellement aucune fiche.");
      return;
    }

    if (!visible.length) {
      setState("empty", "Aucun résultat", "Aucun membre ne correspond à votre recherche.");
      return;
    }

    hideState();
    tableBody.innerHTML = visible.map((member) => `
      <tr>
        <td><span class="directory-grade">${escapeHtml(member.grade_code)}</span></td>
        <td class="directory-name">${escapeHtml(member.first_name)}</td>
        <td class="directory-nickname">${escapeHtml(member.nickname || "—")}</td>
        <td class="directory-name">${escapeHtml(member.last_name)}</td>
        <td>${escapeHtml(member.identity_name)}</td>
        <td class="directory-sensitive">${escapeHtml(member.rib || "—")}</td>
        <td class="directory-sensitive">${escapeHtml(member.phone || "—")}</td>
        <td>${escapeHtml(member.address || "—")}</td>
        <td>${escapeHtml(member.housing_type || "—")}</td>
        <td>${escapeHtml(member.district || "—")}</td>
        ${canManage ? `<td>${actionButtons(member)}</td>` : ""}
      </tr>`).join("");

    cards.innerHTML = visible.map((member) => `
      <article class="directory-member-card">
        <div class="directory-member-card-head">
          <div><span class="directory-grade">${escapeHtml(member.grade_code)}</span></div>
          <h3>${escapeHtml(member.identity_name)}</h3>
        </div>
        <dl>
          <dt>Prénom</dt><dd>${escapeHtml(member.first_name)}</dd>
          <dt>Surnom</dt><dd class="directory-nickname">${escapeHtml(member.nickname || "—")}</dd>
          <dt>Nom</dt><dd>${escapeHtml(member.last_name)}</dd>
          <dt>RIB</dt><dd class="directory-sensitive">${escapeHtml(member.rib || "—")}</dd>
          <dt>Téléphone</dt><dd class="directory-sensitive">${escapeHtml(member.phone || "—")}</dd>
          <dt>Adresse</dt><dd>${escapeHtml(member.address || "—")}</dd>
          <dt>Logement</dt><dd>${escapeHtml(member.housing_type || "—")}</dd>
          <dt>Quartier</dt><dd>${escapeHtml(member.district || "—")}</dd>
        </dl>
        ${canManage ? `<div class="directory-member-card-actions">${actionButtons(member)}</div>` : ""}
      </article>`).join("");

    route.querySelectorAll("[data-directory-edit]").forEach((button) => {
      button.addEventListener("click", () => openEdit(button.dataset.directoryEdit));
    });
    route.querySelectorAll("[data-directory-delete]").forEach((button) => {
      button.addEventListener("click", () => deleteMember(button.dataset.directoryDelete));
    });
  }

  async function resolveAccess() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) console.error("Session annuaire impossible :", error);
    sessionUser = data?.session?.user || null;
    canManage = sessionUser ? isAdminAvailable() : false;

    if (sessionUser && !canManage) {
      const { data: adminAllowed } = await supabaseClient.rpc("is_admin");
      canManage = adminAllowed === true;
    }

    addButton.hidden = !canManage;
    route.querySelectorAll("[data-admin-column]").forEach((cell) => {
      cell.hidden = !canManage;
    });
  }

  async function loadMembers({ force = false } = {}) {
    if (loadedOnce && !force) {
      renderMembers();
      return;
    }

    await resolveAccess();

    setState("loading", "Chargement", "Récupération de l'annuaire interne…");
    const { data, error } = await supabaseClient
      .from("directory_members")
      .select("id, grade_code, sort_order, first_name, nickname, last_name, identity_name, rib, phone, address, housing_type, district, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("last_name", { ascending: true });

    if (error) {
      console.error("Chargement annuaire impossible :", error);
      setState("restricted", "Annuaire indisponible", "La table Supabase de l'annuaire n'est pas encore installée ou sa politique de lecture publique doit être mise à jour.");
      return;
    }

    members = data || [];
    loadedOnce = true;
    renderMembers();
  }

  function resetForm() {
    editingId = null;
    form.reset();
    fields.sort_order.value = String(Math.min(members.length + 1, 16));
    formError.textContent = "";
    dialogTitle.textContent = "Ajouter un membre";
    submitButton.textContent = "Ajouter le membre";
  }

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => fields.grade_code.focus(), 0);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    resetForm();
  }

  function openAdd() {
    if (!canManage) return;
    if (members.length >= 16) {
      window.alert("La limite de 16 membres actifs est atteinte.");
      return;
    }
    resetForm();
    openModal();
  }

  function openEdit(id) {
    if (!canManage) return;
    const member = members.find((item) => String(item.id) === String(id));
    if (!member) return;
    editingId = member.id;
    Object.entries(fields).forEach(([key, input]) => {
      input.value = member[key] ?? "";
    });
    dialogTitle.textContent = `Modifier ${member.identity_name}`;
    submitButton.textContent = "Enregistrer les modifications";
    formError.textContent = "";
    openModal();
  }

  function getPayload() {
    const firstName = fields.first_name.value.trim();
    const lastName = fields.last_name.value.trim().toUpperCase();
    return {
      grade_code: fields.grade_code.value.trim().toUpperCase(),
      sort_order: Number(fields.sort_order.value),
      first_name: firstName,
      nickname: fields.nickname.value.trim() || null,
      last_name: lastName,
      identity_name: fields.identity_name.value.trim() || `${firstName} ${lastName}`,
      rib: fields.rib.value.trim() || null,
      phone: fields.phone.value.trim() || null,
      address: fields.address.value.trim() || null,
      housing_type: fields.housing_type.value.trim() || null,
      district: fields.district.value.trim() || null
    };
  }

  async function saveMember(event) {
    event.preventDefault();
    if (!canManage) return;

    const payload = getPayload();
    if (!payload.grade_code || !payload.first_name || !payload.last_name || !payload.identity_name) {
      formError.textContent = "Le grade, le prénom, le nom et l'identité sont obligatoires.";
      return;
    }
    if (!Number.isInteger(payload.sort_order) || payload.sort_order < 1 || payload.sort_order > 16) {
      formError.textContent = "L'ordre hiérarchique doit être compris entre 1 et 16.";
      return;
    }
    if (!editingId && members.length >= 16) {
      formError.textContent = "La limite de 16 membres actifs est atteinte.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Enregistrement…";
    formError.textContent = "";

    const query = editingId
      ? supabaseClient.from("directory_members").update(payload).eq("id", editingId)
      : supabaseClient.from("directory_members").insert(payload);
    const { error } = await query;

    submitButton.disabled = false;
    submitButton.textContent = editingId ? "Enregistrer les modifications" : "Ajouter le membre";

    if (error) {
      formError.textContent = error.message.includes("directory_members_sort_order_key")
        ? "Cet ordre hiérarchique est déjà utilisé par un autre membre."
        : error.message;
      return;
    }

    closeModal();
    loadedOnce = false;
    await loadMembers({ force: true });
  }

  async function deleteMember(id) {
    if (!canManage) return;
    const member = members.find((item) => String(item.id) === String(id));
    if (!member) return;
    const confirmed = window.confirm(`Supprimer définitivement la fiche de ${member.identity_name} ?`);
    if (!confirmed) return;

    const { error } = await supabaseClient.from("directory_members").delete().eq("id", id);
    if (error) {
      window.alert(`Suppression impossible : ${error.message}`);
      return;
    }
    loadedOnce = false;
    await loadMembers({ force: true });
  }

  function activateTab(tabName) {
    tabs.forEach((tab) => {
      const active = tab.dataset.directoryTab === tabName;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.directoryPanel !== tabName;
    });
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => activateTab(tab.dataset.directoryTab)));
  searchInput.addEventListener("input", renderMembers);
  addButton.addEventListener("click", openAdd);
  closeButtons.forEach((button) => button.addEventListener("click", closeModal));
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  form.addEventListener("submit", saveMember);
  window.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) closeModal(); });

  window.addEventListener("hub:directory-visible", () => loadMembers({ force: true }));
  supabaseClient.auth.onAuthStateChange(() => {
    loadedOnce = false;
    window.setTimeout(() => {
      if (!route.hidden) loadMembers({ force: true });
    }, 0);
  });
})();

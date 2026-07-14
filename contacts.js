"use strict";

/* Ashen Wolves HUB v1.2 — Personnes rencontrées */
(() => {
  const route = document.getElementById("annuaire-module");
  if (!route) return;

  const panel = route.querySelector('[data-directory-panel="contacts"]');
  const search = document.getElementById("contacts-search");
  const sort = document.getElementById("contacts-sort");
  const group = document.getElementById("contacts-group");
  const add = document.getElementById("contacts-add");
  const refresh = document.getElementById("contacts-refresh");
  const counter = document.getElementById("contacts-counter");
  const state = document.getElementById("contacts-state");
  const shell = document.getElementById("contacts-table-shell");
  const body = document.getElementById("contacts-body");
  const cards = document.getElementById("contacts-cards");
  const modal = document.getElementById("contacts-modal");
  const form = document.getElementById("contacts-form");
  const title = document.getElementById("contacts-dialog-title");
  const errorBox = document.getElementById("contacts-form-error");
  const submit = document.getElementById("contacts-submit");
  const closeButtons = [...route.querySelectorAll("[data-contacts-close]")];
  const jobOptions = document.getElementById("contacts-job-options");
  const entityOptions = document.getElementById("contacts-entity-options");

  const fields = {
    job: document.getElementById("contacts-job"),
    entity: document.getElementById("contacts-entity"),
    first_name: document.getElementById("contacts-first-name"),
    last_name: document.getElementById("contacts-last-name"),
    nickname: document.getElementById("contacts-nickname"),
    phone: document.getElementById("contacts-phone"),
    address: document.getElementById("contacts-address"),
    notes: document.getElementById("contacts-notes"),
    relation: document.getElementById("contacts-relation"),
    contacted_by: document.getElementById("contacts-contacted-by")
  };

  let contacts = [];
  let editingId = null;
  let canManage = false;
  let loaded = false;

  const escapeHtml = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const normalize = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const display = (v) => v ? escapeHtml(v) : "—";
  const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

  function badgeClass(value) {
    let h = 0;
    for (const c of String(value || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return `directory-contact-badge badge-${h % 8}`;
  }

  async function resolveAdmin() {
    canManage = false;
    const { data } = await supabaseClient.auth.getSession();
    if (!data?.session?.user) return;
    try {
      const { data: allowed } = await supabaseClient.rpc("is_admin");
      canManage = allowed === true && !(typeof visitorMode !== "undefined" && visitorMode === true);
    } catch { canManage = false; }
    route.querySelectorAll("[data-contacts-admin]").forEach((el) => { el.hidden = !canManage; });
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

  function searchable(c) {
    return normalize([c.job,c.entity,c.first_name,c.last_name,c.nickname,c.phone,c.address,c.notes,c.relation,c.contacted_by].join(" "));
  }

  function sorted(list) {
    const mode = sort.value;
    const copy = [...list];
    const compare = (key, dir = 1) => (a,b) => dir * collator.compare(a[key] || "", b[key] || "") || collator.compare(a.last_name || "", b.last_name || "") || collator.compare(a.first_name || "", b.first_name || "");
    if (mode === "job-asc") return copy.sort(compare("job"));
    if (mode === "job-desc") return copy.sort(compare("job", -1));
    if (mode === "entity-asc") return copy.sort(compare("entity"));
    if (mode === "entity-desc") return copy.sort(compare("entity", -1));
    if (mode === "last-name") return copy.sort(compare("last_name"));
    if (mode === "first-name") return copy.sort(compare("first_name"));
    return copy.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }

  function visibleContacts() {
    const q = normalize(search.value);
    return sorted(q ? contacts.filter((c) => searchable(c).includes(q)) : contacts);
  }

  function rowActions(c) {
    if (!canManage) return "";
    return `<div class="directory-row-actions"><button class="directory-icon-button" data-contact-edit="${escapeHtml(c.id)}" type="button" aria-label="Modifier">✎</button><button class="directory-icon-button is-danger" data-contact-delete="${escapeHtml(c.id)}" type="button" aria-label="Supprimer">×</button></div>`;
  }

  function contactRow(c) {
    return `<tr>
      <td><span class="${badgeClass(c.job)}">${display(c.job)}</span></td>
      <td>${c.entity ? `<span class="directory-entity-badge">${escapeHtml(c.entity)}</span>` : "—"}</td>
      <td class="directory-name">${display(c.first_name)}</td><td class="directory-name">${display(c.last_name)}</td><td class="directory-nickname">${display(c.nickname)}</td>
      <td><button class="directory-copy-value" type="button" data-copy="${escapeHtml(c.phone || "")}">${display(c.phone)}</button></td>
      <td><button class="directory-copy-value" type="button" data-copy="${escapeHtml(c.address || "")}">${display(c.address)}</button></td>
      <td class="directory-notes-cell">${display(c.notes)}</td><td>${display(c.relation)}</td><td>${display(c.contacted_by)}</td>
      ${canManage ? `<td>${rowActions(c)}</td>` : ""}</tr>`;
  }

  function groupHeader(label, count) {
    return `<tr class="directory-group-row"><td colspan="11"><strong>${escapeHtml(label || "Non renseigné")}</strong><span>${count} contact${count > 1 ? "s" : ""}</span></td></tr>`;
  }

  function render() {
    const visible = visibleContacts();
    counter.textContent = `${visible.length} contact${visible.length > 1 ? "s" : ""} affiché${visible.length > 1 ? "s" : ""}`;
    if (!contacts.length) { setState("empty", "Aucun contact enregistré", "Ajoutez la première personne rencontrée avec le bouton prévu à cet effet."); return; }
    if (!visible.length) { setState("empty", "Aucun résultat", "Aucun contact ne correspond à votre recherche."); return; }
    hideState();

    if (group.value === "none") body.innerHTML = visible.map(contactRow).join("");
    else {
      const key = group.value === "job" ? "job" : "entity";
      const grouped = new Map();
      visible.forEach((c) => { const label = c[key] || "Non renseigné"; if (!grouped.has(label)) grouped.set(label, []); grouped.get(label).push(c); });
      body.innerHTML = [...grouped.entries()].map(([label, items]) => groupHeader(label, items.length) + items.map(contactRow).join("")).join("");
    }

    cards.innerHTML = visible.map((c) => `<article class="directory-member-card"><div class="directory-member-card-head"><span class="${badgeClass(c.job)}">${display(c.job)}</span><h3>${display([c.first_name,c.nickname ? `“${c.nickname}”` : "",c.last_name].filter(Boolean).join(" "))}</h3></div><dl><dt>Entité</dt><dd>${display(c.entity)}</dd><dt>Téléphone</dt><dd>${display(c.phone)}</dd><dt>Adresse</dt><dd>${display(c.address)}</dd><dt>Relation</dt><dd>${display(c.relation)}</dd><dt>Contact</dt><dd>${display(c.contacted_by)}</dd><dt>Notes</dt><dd>${display(c.notes)}</dd></dl>${canManage ? `<div class="directory-member-card-actions">${rowActions(c)}</div>` : ""}</article>`).join("");

    panel.querySelectorAll("[data-contact-edit]").forEach((b) => b.addEventListener("click", () => openEdit(b.dataset.contactEdit)));
    panel.querySelectorAll("[data-contact-delete]").forEach((b) => b.addEventListener("click", () => removeContact(b.dataset.contactDelete)));
    panel.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
      const value = b.dataset.copy; if (!value) return;
      try { await navigator.clipboard.writeText(value); const old=b.textContent; b.textContent="Copié ✓"; setTimeout(()=>b.textContent=old,900); } catch {}
    }));
  }

  function updateLists() {
    const options = (key) => [...new Set(contacts.map(c => c[key]).filter(Boolean))].sort(collator.compare).map(v => `<option value="${escapeHtml(v)}"></option>`).join("");
    jobOptions.innerHTML = options("job"); entityOptions.innerHTML = options("entity");
  }

  async function load({ force = false } = {}) {
    if (loaded && !force) { render(); return; }
    await resolveAdmin();
    refresh.disabled = true;
    refresh.textContent = "Actualisation…";
    if (!contacts.length) setState("loading", "Chargement", "Récupération des personnes rencontrées…");
    const { data, error } = await supabaseClient.from("directory_contacts").select("id, job, entity, first_name, last_name, nickname, phone, address, notes, relation, contacted_by, created_at, updated_at").order("created_at", { ascending: false });
    refresh.disabled = false;
    refresh.textContent = "↻ Actualiser";
    if (error) { console.error(error); setState("restricted", "Annuaire indisponible", "La table Supabase des personnes rencontrées n’est pas encore installée."); return; }
    contacts = data || []; loaded = true; updateLists(); render();
  }

  function resetForm() { editingId = null; form.reset(); errorBox.textContent = ""; title.textContent = "Ajouter un contact"; submit.textContent = "Ajouter le contact"; }
  function openModal() { modal.hidden = false; document.body.style.overflow = "hidden"; setTimeout(() => fields.job.focus(), 0); }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ""; resetForm(); }
  function openAdd() { resetForm(); openModal(); }
  function openEdit(id) { if (!canManage) return; const c=contacts.find(x=>String(x.id)===String(id)); if(!c)return; editingId=c.id; Object.entries(fields).forEach(([k,i])=>i.value=c[k]||""); title.textContent=`Modifier ${c.first_name || "le contact"}`; submit.textContent="Enregistrer les modifications"; openModal(); }

  function payload() { return Object.fromEntries(Object.entries(fields).map(([k,i]) => [k, i.value.trim() || null])); }
  async function save(event) {
    event.preventDefault();
    const p=payload(); if(!p.job || !p.first_name){errorBox.textContent="L’emploi et le prénom sont obligatoires.";return;}
    submit.disabled=true; submit.textContent="Enregistrement…"; errorBox.textContent="";
    const query=editingId ? supabaseClient.from("directory_contacts").update(p).eq("id",editingId) : supabaseClient.from("directory_contacts").insert(p);
    const { error }=await query; submit.disabled=false;
    if(error){errorBox.textContent=error.message; submit.textContent=editingId?"Enregistrer les modifications":"Ajouter le contact";return;}
    closeModal(); loaded=false; await load({force:true});
  }

  async function removeContact(id) { if(!canManage)return; const c=contacts.find(x=>String(x.id)===String(id)); if(!c || !confirm(`Supprimer définitivement ${c.first_name} ${c.last_name || ""} ?`))return; const {error}=await supabaseClient.from("directory_contacts").delete().eq("id",id); if(error){alert(error.message);return;} loaded=false; await load({force:true}); }
  async function refreshData(){refresh.disabled=true;refresh.textContent="↻ Actualisation…";loaded=false;await load({force:true});refresh.disabled=false;refresh.textContent="↻ Actualiser";}

  search.addEventListener("input", render); sort.addEventListener("change", render); group.addEventListener("change", render); add.addEventListener("click", openAdd); refresh.addEventListener("click", refreshData); form.addEventListener("submit", save);
  closeButtons.forEach(b=>b.addEventListener("click",closeModal)); modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});
  route.querySelector('[data-directory-tab="contacts"]').addEventListener("click",()=>load({force:true}));
  window.addEventListener("hub:directory-visible",()=>{ if(!panel.hidden) load({force:true}); });
  supabaseClient.auth.onAuthStateChange(()=>{loaded=false;if(!route.hidden&&!panel.hidden)setTimeout(()=>load({force:true}),0);});
})();

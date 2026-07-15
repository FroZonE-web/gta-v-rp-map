"use strict";
(() => {
  const page = document.getElementById("comptabilite-module");
  if (!page) return;
  const $ = (id) => document.getElementById(id);
  const state = { items: [], locations: [], balances: [], contacts: [], members: [], loaded: false };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const money = (value) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value || 0));
  const kg = (value) => `${Number(value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} kg`;
  const toast = (message) => { document.querySelector(".compta-toast")?.remove(); const el=document.createElement("div"); el.className="compta-toast"; el.textContent=message; document.body.appendChild(el); setTimeout(()=>el.remove(),2600); };

  async function loadReferenceData(force=false) {
    if (state.loaded && !force) return;
    try {
      const [itemsRes, locationsRes, balancesRes, contactsRes, membersRes] = await Promise.all([
        supabaseClient.from("stock_items").select("*, stock_categories(name)").order("name"),
        supabaseClient.from("stock_locations").select("*").order("name"),
        supabaseClient.from("stock_balances").select("*"),
        supabaseClient.from("directory_contacts").select("first_name,last_name,nickname,entity,job").limit(1000),
        supabaseClient.from("directory_members").select("first_name,last_name,nickname,grade").limit(50)
      ]);
      state.items = itemsRes.data || [];
      state.locations = locationsRes.data || [];
      state.balances = balancesRes.data || [];
      state.contacts = contactsRes.data || [];
      state.members = membersRes.data || [];
      fillDatalists(); state.loaded = true;
    } catch (error) { console.warn("Comptabilité prototype : données de référence indisponibles", error); }
  }
  function displayName(row) { return [row.first_name, row.nickname ? `“${row.nickname}”` : "", row.last_name].filter(Boolean).join(" ").trim(); }
  function fillDatalists() {
    const contacts = new Set();
    state.contacts.forEach(row => { const name=displayName(row); if(name) contacts.add(name); if(row.entity) contacts.add(row.entity); if(row.job) contacts.add(row.job); });
    state.members.forEach(row => { const name=displayName(row); if(name) contacts.add(name); });
    $("compta-contact-list").innerHTML = [...contacts].sort((a,b)=>a.localeCompare(b,"fr")).map(v=>`<option value="${esc(v)}"></option>`).join("");
    $("compta-member-list").innerHTML = '<option value="Caisse noire"></option>' + state.members.map(row=>displayName(row)).filter(Boolean).sort((a,b)=>a.localeCompare(b,"fr")).map(v=>`<option value="${esc(v)}"></option>`).join("");
  }
  function switchView(view) {
    page.querySelectorAll("[data-compta-view]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.comptaView===view));
    ["dashboard","club","history","black"].forEach(name=>$("compta-"+name+"-view").hidden=name!==view);
    $("compta-title").textContent = view === "club" ? "COMPTE DU CLUB" : view === "history" ? "HISTORIQUE" : view === "black" ? "CAISSE NOIRE" : "TABLEAU DE BORD";
    if(view==="club") { loadReferenceData().then(()=>{ if(!$("compta-sale-lines").children.length) addLine("sale"); if(!$("compta-purchase-lines").children.length) addLine("purchase"); }); }
  }
  function switchOperation(operation) {
    page.querySelectorAll("[data-compta-operation]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.comptaOperation===operation));
    ["sale","purchase","service"].forEach(name=>$("compta-operation-"+name).hidden=name!==operation);
  }
  const itemOptions = () => '<option value="">Sélectionner un item…</option>' + state.items.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join("");
  function lineTemplate(kind) {
    return `<article class="compta-complex-line" data-kind="${kind}"><div class="compta-line-main"><select class="compta-field compta-line-item" required>${itemOptions()}</select><input class="compta-field compta-line-qty" type="number" min="1" step="1" value="1" required><button type="button" class="compta-line-remove" title="Supprimer">×</button></div><div class="compta-line-item-preview"><span>📦</span><div><strong>Sélectionne un item</strong><small>La disponibilité et les lieux apparaîtront ici.</small></div></div><div class="compta-allocation-list"></div><div class="compta-line-status"></div></article>`;
  }
  function addLine(kind) { const container=$(kind==="sale"?"compta-sale-lines":"compta-purchase-lines"); container.insertAdjacentHTML("beforeend",lineTemplate(kind)); updateAllLines(kind); }
  function currentQty(itemId, locationId) { return Number(state.balances.find(b=>String(b.item_id)===String(itemId)&&String(b.location_id)===String(locationId))?.quantity||0); }
  function updateLine(line) {
    const kind=line.dataset.kind, item=state.items.find(i=>String(i.id)===line.querySelector(".compta-line-item").value), requested=Math.max(0,Number(line.querySelector(".compta-line-qty").value||0));
    const preview=line.querySelector(".compta-line-item-preview"), allocation=line.querySelector(".compta-allocation-list"), status=line.querySelector(".compta-line-status");
    if(!item){ preview.innerHTML='<span>📦</span><div><strong>Sélectionne un item</strong><small>La disponibilité et les lieux apparaîtront ici.</small></div>'; allocation.innerHTML=""; status.textContent=""; updateSummary(kind); return; }
    preview.innerHTML=`${item.image_url?`<img src="${esc(item.image_url)}" alt="">`:'<span>📦</span>'}<div><strong>${esc(item.name)}</strong><small>${esc(item.stock_categories?.name||"Sans catégorie")} · ${kg(item.unit_weight)} par unité</small></div>`;
    allocation.innerHTML=state.locations.map(location=>{const available=currentQty(item.id,location.id); return `<label class="compta-allocation"><span><strong>${esc(location.name)}</strong><small>${kind==="sale"?`${available} disponible${available>1?"s":""}`:`Capacité : ${kg(location.capacity_weight)}`}</small></span><input type="number" min="0" step="1" value="0" data-location-id="${location.id}" ${kind==="sale"?`max="${available}"`:""}></label>`;}).join("") || '<p class="compta-empty-inline">Aucun lieu de stockage disponible.</p>';
    const total=[...allocation.querySelectorAll("input")].reduce((sum,input)=>sum+Number(input.value||0),0);
    status.textContent=`Répartition : ${total} / ${requested}`; status.classList.toggle("is-valid",total===requested&&requested>0); updateSummary(kind);
  }
  function updateAllLines(kind){ $(kind==="sale"?"compta-sale-lines":"compta-purchase-lines").querySelectorAll(".compta-complex-line").forEach(updateLine); }
  function updateSummary(kind){
    const container=$(kind==="sale"?"compta-sale-lines":"compta-purchase-lines"), summary=$(kind==="sale"?"compta-sale-summary":"compta-purchase-summary"); let units=0, weight=0, valid=true;
    container.querySelectorAll(".compta-complex-line").forEach(line=>{const item=state.items.find(i=>String(i.id)===line.querySelector(".compta-line-item").value), qty=Number(line.querySelector(".compta-line-qty").value||0), allocated=[...line.querySelectorAll(".compta-allocation input")].reduce((s,i)=>s+Number(i.value||0),0); units+=qty; if(item) weight+=qty*Number(item.unit_weight||0); if(!item||qty<=0||allocated!==qty) valid=false;});
    summary.innerHTML=`<div><span>Unités</span><strong>${units}</strong></div><div><span>Poids total</span><strong>${kg(weight)}</strong></div><div><span>Répartition</span><strong class="${valid?"is-valid":""}">${valid?"Complète":"À compléter"}</strong></div>`;
  }
  function simulateComplex(kind){ const label=kind==="sale"?"Vente simulée":"Achat simulé"; toast(`${label} — aucune donnée ni aucun stock n’a été modifié.`); }

  page.querySelectorAll("[data-compta-view]").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.comptaView)));
  page.querySelectorAll("[data-compta-operation]").forEach(btn=>btn.addEventListener("click",()=>switchOperation(btn.dataset.comptaOperation)));
  page.querySelector("[data-compta-add-sale-line]").addEventListener("click",()=>addLine("sale"));
  page.querySelector("[data-compta-add-purchase-line]").addEventListener("click",()=>addLine("purchase"));
  page.addEventListener("input",event=>{const line=event.target.closest(".compta-complex-line"); if(line) updateLine(line);});
  page.addEventListener("change",event=>{const line=event.target.closest(".compta-complex-line"); if(line) updateLine(line);});
  page.addEventListener("click",event=>{const remove=event.target.closest(".compta-line-remove"); if(remove){const line=remove.closest(".compta-complex-line"),kind=line.dataset.kind; line.remove(); if(!$(kind==="sale"?"compta-sale-lines":"compta-purchase-lines").children.length)addLine(kind); updateSummary(kind);}});
  $("compta-sale-form").addEventListener("submit",event=>{event.preventDefault(); simulateComplex("sale");});
  $("compta-purchase-form").addEventListener("submit",event=>{event.preventDefault(); simulateComplex("purchase");});
  $("compta-service-form").addEventListener("submit",event=>{event.preventDefault(); toast("Dépense de service simulée — aucune écriture réelle.");});
  page.querySelectorAll("[data-compta-demo]").forEach(btn=>btn.addEventListener("click",()=>toast("Prototype visuel — aucune écriture comptable réelle.")));
  loadReferenceData();
})();

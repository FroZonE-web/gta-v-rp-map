"use strict";
(() => {
  const page = document.getElementById("comptabilite-module");
  if (!page) return;
  const $ = (id) => document.getElementById(id);
  const state = { items: [], locations: [], balances: [], contacts: [], members: [], transactions: [], loaded: false, accountingLoaded: false, realtimeChannel: null };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const money = (value) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value || 0));
  const kg = (value) => `${Number(value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} kg`;
  const dirtyValue = (item) => {
    const clean = Number(item?.clean_value || 0);
    const input = Number(item?.dirty_input || 0);
    if (item?.dirty_mode === "multiplier") return clean * input;
    if (item?.dirty_mode === "percentage") return clean * (input / 100);
    return input;
  };
  const toast = (message) => { document.querySelector(".compta-toast")?.remove(); const el=document.createElement("div"); el.className="compta-toast"; el.textContent=message; document.body.appendChild(el); setTimeout(()=>el.remove(),2600); };

  const transactionTitles = {
    quick_income: "Recette rapide",
    member_payment: "Paiement à un membre",
    black_transfer_out: "Transfert vers la caisse noire",
    black_transfer_in: "Ajout à la caisse noire",
    black_deposit: "Ajout à la caisse noire",
    black_withdrawal: "Retrait de la caisse noire"
  };
  const signedAmount = (row) => (row.direction === "credit" ? 1 : -1) * Number(row.amount || 0);
  const formatDateHeading = (value) => new Intl.DateTimeFormat("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" }).format(new Date(value));
  const formatTime = (value) => new Intl.DateTimeFormat("fr-FR", { hour:"2-digit", minute:"2-digit" }).format(new Date(value));
  function calculateBalances() {
    const result = { clubClean:0, clubDirty:0, black:0 };
    state.transactions.forEach(row => {
      const value = signedAmount(row);
      if (row.account === "black") result.black += value;
      else if (row.money_type === "dirty") result.clubDirty += value;
      else result.clubClean += value;
    });
    return result;
  }
  function renderBalances() {
    const b = calculateBalances();
    $("compta-clean-balance").textContent = money(b.clubClean);
    $("compta-dirty-balance").textContent = money(b.clubDirty);
    $("compta-black-balance-value").textContent = money(b.black);
  }
  function transactionHtml(row) {
    const positive = row.direction === "credit";
    const title = row.title || transactionTitles[row.operation_type] || "Opération comptable";
    const detail = [row.label, row.counterparty, row.account === "black" ? "Caisse noire" : (row.money_type === "dirty" ? "Argent sale" : "Argent propre"), formatTime(row.created_at)].filter(Boolean).join(" · ");
    return `<article class="compta-transaction"><span class="compta-transaction-icon">▣</span><div><strong>${esc(title)}</strong><small>${esc(detail)}</small></div><span class="compta-amount ${positive?"positive":"negative"}">${positive?"+":"−"} ${money(row.amount)}</span></article>`;
  }
  function groupedTransactionsHtml(rows) {
    if (!rows.length) return '<p class="compta-empty-inline">Aucune opération enregistrée.</p>';
    const groups = new Map();
    rows.forEach(row => { const key = String(row.created_at).slice(0,10); if(!groups.has(key)) groups.set(key,[]); groups.get(key).push(row); });
    return [...groups.entries()].map(([,items])=>`<div class="compta-date">${esc(formatDateHeading(items[0].created_at))}</div>${items.map(transactionHtml).join("")}`).join("");
  }
  function renderAccounting() {
    renderBalances();
    $("compta-recent-transactions").innerHTML = groupedTransactionsHtml(state.transactions.slice(0,12));
    renderHistory();
  }
  function renderHistory() {
    const target = $("compta-history-list"); if(!target) return;
    const query = ($("compta-history-search")?.value || "").trim().toLocaleLowerCase("fr");
    const account = $("compta-history-account")?.value || "all";
    const filtered = state.transactions.filter(row => {
      if(account !== "all" && row.account !== account) return false;
      const haystack = [row.title,row.label,row.counterparty,row.operation_type,row.money_type].join(" ").toLocaleLowerCase("fr");
      return !query || haystack.includes(query);
    });
    target.innerHTML = groupedTransactionsHtml(filtered);
  }
  async function loadAccounting() {
    const { data, error } = await supabaseClient.from("accounting_transactions").select("*").order("created_at", { ascending:false }).limit(1000);
    if(error){ console.warn(error); toast("Impossible de charger la comptabilité. Vérifie le script SQL."); return; }
    state.transactions = data || []; state.accountingLoaded = true; renderAccounting();
  }
  async function createSimpleOperation(payload) {
    const { error } = await supabaseClient.rpc("create_simple_accounting_operation", payload);
    if(error) throw error;
    await loadAccounting();
  }
  function setupRealtime() {
    if(state.realtimeChannel) return;
    state.realtimeChannel = supabaseClient.channel("accounting-live-v154")
      .on("postgres_changes", { event:"*", schema:"public", table:"accounting_transactions" }, () => loadAccounting())
      .subscribe();
  }

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
    if(view==="history") renderHistory();
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
    const container=$(kind==="sale"?"compta-sale-lines":"compta-purchase-lines");
    const summary=$(kind==="sale"?"compta-sale-summary":"compta-purchase-summary");
    const moneyType=$(kind==="sale"?"compta-sale-money":"compta-purchase-money")?.value || "clean";
    let units=0, weight=0, theoretical=0, valid=true;
    container.querySelectorAll(".compta-complex-line").forEach(line=>{
      const item=state.items.find(i=>String(i.id)===line.querySelector(".compta-line-item").value);
      const qty=Number(line.querySelector(".compta-line-qty").value||0);
      const allocated=[...line.querySelectorAll(".compta-allocation input")].reduce((sum,input)=>sum+Number(input.value||0),0);
      units+=qty;
      if(item){
        weight+=qty*Number(item.unit_weight||0);
        theoretical+=qty*(moneyType==="dirty"?dirtyValue(item):Number(item.clean_value||0));
      }
      if(!item||qty<=0||allocated!==qty) valid=false;
    });
    const theoreticalClass=moneyType==="dirty"?"is-dirty":"is-clean";
    const theoreticalLabel=moneyType==="dirty"?"Valeur théorique sale":"Valeur théorique propre";
    summary.innerHTML=`<div><span>Unités</span><strong>${units}</strong></div><div><span>Poids total</span><strong>${kg(weight)}</strong></div><div><span>${theoreticalLabel}</span><strong class="${theoreticalClass}">${money(theoretical)}</strong></div><div><span>Répartition</span><strong class="${valid?"is-valid":""}">${valid?"Complète":"À compléter"}</strong></div>`;
  }
  function simulateComplex(kind){ const label=kind==="sale"?"Vente simulée":"Achat simulé"; toast(`${label} — aucune donnée ni aucun stock n’a été modifié.`); }
  function switchBlackOperation(operation){
    const withdrawal=operation==="withdrawal";
    $("compta-black-operation").value=operation;
    page.querySelectorAll("[data-compta-black-operation]").forEach(button=>button.classList.toggle("is-active",button.dataset.comptaBlackOperation===operation));
    $("compta-black-reason-field").hidden=!withdrawal;
    $("compta-black-reason").required=withdrawal;
    $("compta-black-hint").textContent=withdrawal?"La raison est obligatoire pour tout retrait.":"Aucune raison n’est demandée pour un ajout.";
    $("compta-black-form").querySelector("button[type=submit]").textContent=withdrawal?"Simuler le retrait":"Simuler l’ajout";
  }

  page.querySelectorAll("[data-compta-view]").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.comptaView)));
  page.querySelectorAll("[data-compta-operation]").forEach(btn=>btn.addEventListener("click",()=>switchOperation(btn.dataset.comptaOperation)));
  page.querySelectorAll("[data-compta-black-operation]").forEach(btn=>btn.addEventListener("click",()=>switchBlackOperation(btn.dataset.comptaBlackOperation)));
  ["compta-sale-money","compta-purchase-money"].forEach(id=>$(id)?.addEventListener("change",()=>updateSummary(id.includes("sale")?"sale":"purchase")));
  page.querySelector("[data-compta-add-sale-line]").addEventListener("click",()=>addLine("sale"));
  page.querySelector("[data-compta-add-purchase-line]").addEventListener("click",()=>addLine("purchase"));
  page.addEventListener("input",event=>{const line=event.target.closest(".compta-complex-line"); if(line) updateLine(line);});
  page.addEventListener("change",event=>{const line=event.target.closest(".compta-complex-line"); if(line) updateLine(line);});
  page.addEventListener("click",event=>{const remove=event.target.closest(".compta-line-remove"); if(remove){const line=remove.closest(".compta-complex-line"),kind=line.dataset.kind; line.remove(); if(!$(kind==="sale"?"compta-sale-lines":"compta-purchase-lines").children.length)addLine(kind); updateSummary(kind);}});
  $("compta-sale-form").addEventListener("submit",event=>{event.preventDefault(); simulateComplex("sale");});
  $("compta-purchase-form").addEventListener("submit",event=>{event.preventDefault(); simulateComplex("purchase");});
  $("compta-service-form").addEventListener("submit",event=>{event.preventDefault(); toast("Dépense de service simulée — aucune écriture réelle.");});
  $("compta-quick-income-form").addEventListener("submit", async event=>{
    event.preventDefault();
    const amount=Number($("compta-quick-income-amount").value||0); if(amount<=0) return toast("Saisis un montant valide.");
    const button=event.submitter; button.disabled=true;
    try { await createSimpleOperation({ p_operation:"quick_income", p_amount:amount, p_recipient:null, p_label:$("compta-quick-income-label").value.trim() || $("compta-quick-income-type").value }); event.target.reset(); toast("Recette enregistrée."); }
    catch(error){ toast(error.message || "Impossible d’enregistrer la recette."); }
    finally{ button.disabled=false; }
  });
  $("compta-transfer-form").addEventListener("submit", async event=>{
    event.preventDefault();
    const recipient=$("compta-transfer-recipient").value.trim(), amount=Number($("compta-transfer-amount").value||0); if(!recipient) return toast("Sélectionne un destinataire."); if(amount<=0) return toast("Saisis un montant valide.");
    const button=event.submitter; button.disabled=true;
    try { await createSimpleOperation({ p_operation:recipient.toLocaleLowerCase("fr")==="caisse noire"?"black_transfer":"member_payment", p_amount:amount, p_recipient:recipient, p_label:$("compta-transfer-label").value.trim() || null }); event.target.reset(); toast("Transfert enregistré."); }
    catch(error){ toast(error.message || "Impossible d’enregistrer le transfert."); }
    finally{ button.disabled=false; }
  });
  $("compta-black-form").addEventListener("submit",async event=>{
    event.preventDefault();
    const operation=$("compta-black-operation").value;
    const amount=Number($("compta-black-amount").value||0);
    const reason=$("compta-black-reason").value.trim();
    if(amount<=0){ toast("Saisis un montant valide."); return; }
    if(operation==="withdrawal"&&!reason){ toast("La raison du retrait est obligatoire."); $("compta-black-reason").focus(); return; }
    const button=event.submitter; button.disabled=true;
    try { await createSimpleOperation({ p_operation:operation==="withdrawal"?"black_withdrawal":"black_deposit", p_amount:amount, p_recipient:null, p_label:reason || null }); event.target.reset(); switchBlackOperation(operation); toast("Opération de caisse noire enregistrée."); }
    catch(error){ toast(error.message || "Impossible d’enregistrer l’opération."); }
    finally{ button.disabled=false; }
  });
  $("compta-history-search")?.addEventListener("input",renderHistory);
  $("compta-history-account")?.addEventListener("change",renderHistory);
  page.querySelectorAll("[data-compta-demo]").forEach(btn=>btn.addEventListener("click",()=>toast("Cette opération complexe sera connectée lors de la prochaine phase.")));
  loadReferenceData(); loadAccounting(); setupRealtime();
})();

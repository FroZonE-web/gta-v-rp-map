"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = value => new Intl.NumberFormat("fr-FR", { style:"currency", currency:"USD" }).format(Number(value || 0));
  const dt = value => new Intl.DateTimeFormat("fr-FR", { dateStyle:"medium", timeStyle:"short" }).format(new Date(value));
  const categoryKey = value => String(value || "").replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/gu, "").replace(/^[^\p{L}\p{N}]+/gu, "").trim();
  const sortNames = (a,b) => categoryKey(a).localeCompare(categoryKey(b), "fr", { sensitivity:"base", numeric:true });
  const state = { categories:[], stockCategories:[], items:[], locations:[], balances:[], recipes:[], runs:[], active:"recipes", loaded:false, channel:null };

  function setStatus(text, error=false){ const el=$("craft-status"); if(!el)return; el.textContent=text||""; el.style.color=error?"#ff8ea7":""; }
  function optionRows(rows, placeholder, selected=""){ return `<option value="">${esc(placeholder)}</option>`+rows.map(row=>`<option value="${row.id}" ${String(row.id)===String(selected)?"selected":""}>${esc(row.name)}</option>`).join(""); }
  async function loadAll(){
    setStatus("Chargement…");
    try{
      const [cats, stockCats, items, locations, balances, recipes, runs] = await Promise.all([
        supabaseClient.from("craft_categories").select("*").order("name"),
        supabaseClient.from("stock_categories").select("*").order("name"),
        supabaseClient.from("stock_items").select("*, stock_categories(name)").order("name"),
        supabaseClient.from("stock_locations").select("*").order("name"),
        supabaseClient.from("stock_balances").select("*"),
        supabaseClient.from("craft_recipes").select("*, craft_categories(name), stock_items!craft_recipes_output_item_id_fkey(id,name,image_url), craft_recipe_ingredients(id,quantity,item_id,stock_items(id,name,image_url,stock_categories(name)))").order("created_at",{ascending:false}),
        supabaseClient.from("craft_runs").select("*, craft_run_ingredients(*)").order("created_at",{ascending:false}).limit(300)
      ]);
      for(const response of [cats,stockCats,items,locations,balances,recipes,runs]) if(response.error) throw response.error;
      state.categories=(cats.data||[]).sort((a,b)=>sortNames(a.name,b.name));
      state.stockCategories=(stockCats.data||[]).sort((a,b)=>sortNames(a.name,b.name));
      state.items=items.data||[]; state.locations=locations.data||[]; state.balances=balances.data||[];
      state.recipes=recipes.data||[]; state.runs=runs.data||[]; state.loaded=true;
      render(); setStatus("");
    }catch(error){ console.error(error); setStatus("Impossible de charger le module Craft. Exécute CRAFT_SETUP.sql dans Supabase.",true); }
  }
  function switchTab(tab){ state.active=tab; document.querySelectorAll("[data-craft-tab]").forEach(b=>b.classList.toggle("is-active",b.dataset.craftTab===tab)); ["recipes","make","history"].forEach(name=>$("craft-"+name+"-panel").hidden=name!==tab); render(); }
  function render(){ if(!state.loaded)return; renderRecipes(); renderMake(); renderHistory(); }
  function renderRecipes(){
    const q=$("craft-search").value.trim().toLowerCase(); const cat=$("craft-category-filter").value;
    $("craft-category-filter").innerHTML=`<option value="">Toutes les catégories</option>`+state.categories.map(c=>`<option value="${c.id}" ${c.id===cat?"selected":""}>${esc(c.name)}</option>`).join("");
    const rows=state.recipes.filter(r=>(!cat||r.category_id===cat)&&(!q||[r.stock_items?.name,r.craft_categories?.name].some(v=>String(v||"").toLowerCase().includes(q))));
    $("craft-recipes-grid").innerHTML=rows.length?rows.map(r=>`<article class="craft-card"><div class="craft-card-image">${r.stock_items?.image_url?`<img src="${esc(r.stock_items.image_url)}" alt="">`:"📦"}</div><span class="craft-pill">${esc(r.craft_categories?.name||"Sans catégorie")}</span><h3>${esc(r.stock_items?.name||"Item")}</h3><small>${r.craft_recipe_ingredients?.length||0} composant(s)</small><ul class="craft-components">${(r.craft_recipe_ingredients||[]).map(i=>`<li><span>${esc(i.stock_items?.name||"Item")}</span><strong>× ${i.quantity}</strong></li>`).join("")}</ul><button class="craft-btn primary" data-craft-select="${r.id}">Fabriquer</button></article>`).join(""):'<div class="craft-empty">Aucun craft à afficher.</div>';
  }
  function renderMake(){
    const selected=$("craft-recipe-select").value;
    $("craft-recipe-select").innerHTML=optionRows(state.recipes.map(r=>({id:r.id,name:`${r.stock_items?.name||"Item"} — ${r.craft_categories?.name||"Sans catégorie"}`})),"Sélectionner un craft…",selected);
    $("craft-destination-location").innerHTML=optionRows(state.locations,"Sélectionner un lieu…",$("craft-destination-location").value);
    if(selected) renderAllocations();
  }
  function currentRecipe(){ return state.recipes.find(r=>String(r.id)===String($("craft-recipe-select").value)); }
  function available(itemId,locationId){ return Number(state.balances.find(b=>String(b.item_id)===String(itemId)&&String(b.location_id)===String(locationId))?.quantity||0); }
  function renderAllocations(){
    const recipe=currentRecipe(), craftQty=Math.max(1,Number($("craft-quantity").value||1));
    if(!recipe){ $("craft-allocation-list").innerHTML='<div class="craft-empty">Sélectionne un craft.</div>'; return; }
    $("craft-allocation-list").innerHTML=(recipe.craft_recipe_ingredients||[]).map(ing=>{
      const required=ing.quantity*craftQty;
      return `<section class="craft-allocation-group" data-craft-ingredient="${ing.item_id}" data-required="${required}"><div class="craft-allocation-head"><div><strong>${esc(ing.stock_items?.name||"Item")}</strong><div class="craft-muted">${ing.quantity} par craft · ${required} nécessaire(s)</div></div><span class="craft-pill" data-allocation-total>0 / ${required}</span></div><div data-allocation-rows></div><button type="button" class="craft-btn" data-add-allocation="${ing.item_id}">+ Ajouter un lieu</button></section>`;
    }).join("");
    document.querySelectorAll("[data-craft-ingredient]").forEach(group=>addAllocation(group.dataset.craftIngredient));
  }
  function addAllocation(itemId){
    const group=document.querySelector(`[data-craft-ingredient="${CSS.escape(String(itemId))}"]`); if(!group)return;
    const row=document.createElement("div"); row.className="craft-allocation";
    row.innerHTML=`<select class="craft-field craft-allocation-location">${optionRows(state.locations.map(l=>({id:l.id,name:`${l.name} (${available(itemId,l.id)} dispo.)`})),"Lieu de prélèvement…")}</select><input class="craft-field craft-allocation-qty" type="number" min="1" value="1"><button type="button" class="craft-btn craft-danger" data-remove-allocation>×</button>`;
    group.querySelector("[data-allocation-rows]").appendChild(row); updateAllocationTotal(group);
  }
  function updateAllocationTotal(group){ const total=[...group.querySelectorAll(".craft-allocation-qty")].reduce((s,i)=>s+Number(i.value||0),0); group.querySelector("[data-allocation-total]").textContent=`${total} / ${group.dataset.required}`; }
  function renderDestination(){ const destination=$("craft-destination").value; $("craft-stock-fields").hidden=destination!=="stock"; $("craft-sale-fields").hidden=destination!=="sell"; }
  function renderHistory(){
    const q=$("craft-history-search").value.trim().toLowerCase(); const rows=state.runs.filter(r=>!q||[r.recipe_name,r.customer,r.actor_label,r.destination_location].some(v=>String(v||"").toLowerCase().includes(q)));
    const dest={stock:"Stocké",sell:"Vendu",keep:"Gardé"};
    $("craft-history-list").innerHTML=rows.length?rows.map(r=>`<article class="craft-history-row"><div><strong>${r.quantity} × ${esc(r.recipe_name)}</strong><small>${dt(r.created_at)}${r.actor_label?` · ${esc(r.actor_label)}`:""}</small><small>${(r.craft_run_ingredients||[]).map(i=>`${i.quantity} × ${esc(i.item_name)}`).join(" · ")}</small></div><div><span class="craft-pill">${dest[r.destination]||r.destination}</span>${r.destination_location?`<small>${esc(r.destination_location)}</small>`:""}${r.customer?`<small>${esc(r.customer)} · ${money(r.sale_amount)} · ${r.money_type==="dirty"?"Sale":"Propre"}</small>`:""}</div></article>`).join(""):'<div class="craft-empty">Aucun craft enregistré.</div>';
  }
  function addIngredientRow(){
    const row=document.createElement("div"); row.className="craft-ingredient";
    row.innerHTML=`<select class="craft-field craft-ingredient-category">${optionRows(state.stockCategories,"Catégorie d’item…")}</select><select class="craft-field craft-ingredient-item"><option value="">Sélectionner d’abord une catégorie…</option></select><input class="craft-field craft-ingredient-qty" type="number" min="1" value="1"><button type="button" class="craft-btn craft-danger" data-remove-ingredient>×</button>`;
    $("craft-ingredients").appendChild(row);
  }
  function updateIngredientItems(row){ const cat=row.querySelector(".craft-ingredient-category").value; const items=state.items.filter(i=>!cat||String(i.category_id)===String(cat)); row.querySelector(".craft-ingredient-item").innerHTML=optionRows(items,"Sélectionner un item…"); }
  async function uploadImage(file){ if(!file)return ""; const ext=(file.name.split(".").pop()||"png").toLowerCase(); const path=`craft/${crypto.randomUUID()}.${ext}`; const {error}=await supabaseClient.storage.from("stock-items").upload(path,file,{upsert:false}); if(error)throw error; return supabaseClient.storage.from("stock-items").getPublicUrl(path).data.publicUrl; }
  async function createRecipe(event){
    event.preventDefault(); const rows=[...document.querySelectorAll(".craft-ingredient")]; const ingredients=rows.map(row=>({item_id:row.querySelector(".craft-ingredient-item").value,quantity:Number(row.querySelector(".craft-ingredient-qty").value||0)})).filter(x=>x.item_id&&x.quantity>0);
    if(!ingredients.length)return alert("Ajoute au moins un composant.");
    try{
      setStatus("Création du craft…"); const imageUrl=await uploadImage($("craft-item-image").files[0]);
      const {error}=await supabaseClient.rpc("create_craft_recipe",{p_category_name:$("craft-recipe-category").value,p_item_name:$("craft-item-name").value.trim(),p_image_url:imageUrl||null,p_ingredients:ingredients}); if(error)throw error;
      $("craft-recipe-dialog").close(); event.target.reset(); $("craft-ingredients").innerHTML=""; await loadAll();
    }catch(error){ console.error(error); alert(error.message||"Création impossible."); setStatus("",true); }
  }
  async function createCategory(event){ event.preventDefault(); const name=$("craft-category-name").value.trim(); if(!name)return; const {error}=await supabaseClient.from("craft_categories").insert({name}); if(error)return alert(error.message); $("craft-category-dialog").close(); event.target.reset(); await loadAll(); }
  async function executeCraft(event){
    event.preventDefault(); const recipe=currentRecipe(); if(!recipe)return alert("Sélectionne un craft.");
    const allocations=[]; let valid=true;
    document.querySelectorAll("[data-craft-ingredient]").forEach(group=>{
      let total=0; group.querySelectorAll(".craft-allocation").forEach(row=>{ const location=row.querySelector(".craft-allocation-location").value, quantity=Number(row.querySelector(".craft-allocation-qty").value||0); if(location&&quantity>0){ allocations.push({item_id:group.dataset.craftIngredient,location_id:location,quantity}); total+=quantity; }});
      if(total!==Number(group.dataset.required)) valid=false;
    });
    if(!valid)return alert("La répartition de chaque composant doit correspondre exactement à la quantité nécessaire.");
    const destination=$("craft-destination").value;
    try{
      setStatus("Fabrication en cours…");
      const {error}=await supabaseClient.rpc("execute_craft",{p_recipe_id:recipe.id,p_quantity:Number($("craft-quantity").value),p_allocations:allocations,p_destination:destination,p_destination_location_id:destination==="stock"?$("craft-destination-location").value:null,p_customer:destination==="sell"?$("craft-customer").value.trim():null,p_sale_amount:destination==="sell"?Number($("craft-sale-amount").value):null,p_money_type:destination==="sell"?$("craft-money-type").value:null,p_actor_label:$("craft-actor").value.trim()||null}); if(error)throw error;
      alert("Craft enregistré. Les stocks ont été mis à jour."); await loadAll(); switchTab("history");
    }catch(error){ console.error(error); alert(error.message||"Le craft n’a pas pu être enregistré."); setStatus("",true); }
  }

  document.addEventListener("click",event=>{
    const tab=event.target.closest("[data-craft-tab]"); if(tab)switchTab(tab.dataset.craftTab);
    if(event.target.closest("#craft-add-category"))$("craft-category-dialog").showModal();
    if(event.target.closest("#craft-add-recipe")){ $("craft-recipe-category").innerHTML=optionRows(state.categories,"Sélectionner une catégorie…"); $("craft-ingredients").innerHTML=""; addIngredientRow(); $("craft-recipe-dialog").showModal(); }
    if(event.target.closest("#craft-add-ingredient"))addIngredientRow();
    if(event.target.matches("[data-remove-ingredient]"))event.target.closest(".craft-ingredient").remove();
    const add=event.target.closest("[data-add-allocation]"); if(add)addAllocation(add.dataset.addAllocation);
    if(event.target.matches("[data-remove-allocation]")){ const group=event.target.closest("[data-craft-ingredient]"); event.target.closest(".craft-allocation").remove(); updateAllocationTotal(group); }
    const select=event.target.closest("[data-craft-select]"); if(select){ switchTab("make"); $("craft-recipe-select").value=select.dataset.craftSelect; renderAllocations(); }
    if(event.target.matches("[data-craft-close]"))event.target.closest("dialog").close();
  });
  document.addEventListener("change",event=>{
    if(event.target.matches(".craft-ingredient-category"))updateIngredientItems(event.target.closest(".craft-ingredient"));
    if(event.target.id==="craft-recipe-select"||event.target.id==="craft-quantity")renderAllocations();
    if(event.target.id==="craft-destination")renderDestination();
  });
  document.addEventListener("input",event=>{ if(event.target.matches(".craft-allocation-qty"))updateAllocationTotal(event.target.closest("[data-craft-ingredient]")); if(["craft-search","craft-history-search"].includes(event.target.id))render(); });
  $("craft-category-filter").addEventListener("change",renderRecipes);
  $("craft-category-form").addEventListener("submit",createCategory); $("craft-recipe-form").addEventListener("submit",createRecipe); $("craft-make-form").addEventListener("submit",executeCraft);
  window.addEventListener("hub:craft-visible",()=>{ if(!state.loaded)loadAll(); else render(); });
  state.channel=supabaseClient.channel("craft-live-v170").on("postgres_changes",{event:"*",schema:"public",table:"craft_runs"},loadAll).on("postgres_changes",{event:"*",schema:"public",table:"stock_balances"},loadAll).subscribe();
})();

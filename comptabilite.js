"use strict";
(() => {
 const page=document.getElementById('comptabilite-module'); if(!page)return;
 const toast=(msg)=>{const old=document.querySelector('.compta-toast');if(old)old.remove();const el=document.createElement('div');el.className='compta-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2200)};
 page.querySelectorAll('[data-compta-demo]').forEach(btn=>btn.addEventListener('click',()=>toast('Interface de démonstration — les données seront connectées à Supabase à la prochaine étape.')));
 page.querySelectorAll('[data-compta-tab]').forEach(btn=>btn.addEventListener('click',()=>{page.querySelectorAll('[data-compta-tab]').forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');toast(`${btn.textContent.trim()} — écran prévu pour la prochaine étape.`)}));
})();

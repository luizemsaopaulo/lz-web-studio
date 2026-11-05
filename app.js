"use strict";
(() => {
 const FALLBACK={whatsapp:"5511947406124",pricing:{base:250,included:20,extra:0,retouch:150,retouchLimit:150,illustration:25,deposit:50}};
 const config=()=>window.LZ_CMS_CONFIG||FALLBACK;
 const money=(v)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
 const $=id=>document.getElementById(id);
 const productInput=$("products"),photoEditInput=$("editphotos"),photoCreateInput=$("createphotos"),form=$("orcamento");
 if($("year"))$("year").textContent=String(new Date().getFullYear());
 function totals(){
   const p=config().pricing;
   const estimate=productInput?.value.trim()||"";
   const products=estimate===""?null:Math.max(1,Math.min(10000,Math.floor(Number(estimate)||1)));
   const edits=photoEditInput?.checked?1:0,creates=Math.max(0,Number(photoCreateInput?.value)||0);
   const base=Math.max(0,Number(p.base)||0);
   const photos=edits?Math.max(0,Number(p.retouch)||0):0,illustrations=creates*Math.max(0,Number(p.illustration)||0);
   return {products,edits,creates,base,photos,illustrations,deposit:Math.max(1,Math.min(100,Number(p.deposit)||50)),total:base+photos+illustrations};
 }
 function update(){
   const t=totals();
   // Pacote fixo de edição: sem cobrança por fotografia individual.
   $("createphotos-value").textContent=String(t.creates);
   $("quote-total").textContent=money(t.total);
   $("quote-entry").textContent=money(t.total*t.deposit/100);
 }
 productInput?.addEventListener("input",update);
 photoEditInput?.addEventListener("change",update);
 document.querySelectorAll("[data-counter]").forEach(btn=>btn.addEventListener("click",()=>{
   const field=$(btn.dataset.counter),step=Number(btn.dataset.step);
   field.value=String(Math.max(0,Math.min(100,Number(field.value)+step)));update();
 }));
 form?.addEventListener("submit",event=>{
   event.preventDefault();
   const t=totals(),name=$("client-name").value.trim().slice(0,70),
     business=$("business-name").value.trim().slice(0,100),details=$("details").value.trim().slice(0,700);
   const lines=[
     "Olá, LZ Web Studio! Gostaria de solicitar um orçamento para um cardápio/site de pedidos.",
     name?"Nome: "+name:"",
     business?"Estabelecimento: "+business:"",
     t.products===null?"Quantidade de produtos: não informada":"Quantidade aproximada de produtos: "+t.products+" (sujeita à avaliação, sem acréscimo automático)",
     "Tratamento opcional de fotos (até "+(config().pricing.retouchLimit||150)+" fotografias): "+(t.edits?"Sim ("+money(t.photos)+")":"Não (fotos prontas fornecidas pelo cliente)"),
     "Imagens ilustrativas: "+t.creates+" ("+money(t.illustrations)+")",
     "Valor inicial estimado: "+money(t.total),
     "Entrada estimada ("+t.deposit+"%): "+money(t.total*t.deposit/100),
     details?"Observações: "+details:"",
     "Quantidade de produtos e complexidade serão avaliadas; qualquer acréscimo será informado antes da contratação."
   ].filter(Boolean).join("\n");
   const phone=String(config().whatsapp||FALLBACK.whatsapp).replace(/\D/g,"");
   const url="https://wa.me/"+phone+"?text="+encodeURIComponent(lines);
   const opened=window.open(url,"_blank","noopener,noreferrer");
   if(!opened)window.location.href=url;
 });
 const menuButton=document.querySelector(".menu-toggle"),navLinks=$("nav-links");
 if(menuButton&&navLinks){
   const close=()=>{menuButton.setAttribute("aria-expanded","false");navLinks.classList.remove("is-open")};
   menuButton.addEventListener("click",()=>{
     const expanded=menuButton.getAttribute("aria-expanded")==="true";
     menuButton.setAttribute("aria-expanded",String(!expanded));navLinks.classList.toggle("is-open",!expanded);
   });
   navLinks.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
   document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
 }
 const progress=$("progress");let scheduled=false;
 const scrollUpdate=()=>{
   const h=document.documentElement,total=h.scrollHeight-h.clientHeight;
   if(progress)progress.style.width=(total?100*h.scrollTop/total:0)+"%";scheduled=false;
 };
 window.addEventListener("scroll",()=>{if(!scheduled){window.requestAnimationFrame(scrollUpdate);scheduled=true}},{passive:true});
 window.addEventListener("lz-config-updated",update);
 update();scrollUpdate();
})();

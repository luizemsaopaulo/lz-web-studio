"use strict";
(() => {
 const FALLBACK={whatsapp:"5511947406124",pricing:{base:250,included:20,extra:5,retouch:12,illustration:25,deposit:50}};
 const config=()=>window.LZ_CMS_CONFIG||FALLBACK;
 const money=(v)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
 const $=id=>document.getElementById(id);
 const productInput=$("products"),photoEditInput=$("editphotos"),photoCreateInput=$("createphotos"),form=$("orcamento");
 if($("year"))$("year").textContent=String(new Date().getFullYear());
 function totals(){
   const p=config().pricing;
   const products=Math.max(1,Math.min(500,Number(productInput?.value)||20));
   const edits=Math.max(0,Number(photoEditInput?.value)||0),creates=Math.max(0,Number(photoCreateInput?.value)||0);
   const included=Math.max(1,Number(p.included)||20),base=Math.max(0,Number(p.base)||0);
   const additional=Math.max(0,products-included)*Math.max(0,Number(p.extra)||0);
   const photos=edits*Math.max(0,Number(p.retouch)||0),illustrations=creates*Math.max(0,Number(p.illustration)||0);
   return {products,edits,creates,base,additional,photos,illustrations,deposit:Math.max(1,Math.min(100,Number(p.deposit)||50)),total:base+additional+photos+illustrations,included};
 }
 function update(){
   if(!productInput)return;
   const t=totals();
   $("products-value").textContent=String(t.products);
   $("editphotos-value").textContent=String(t.edits);
   $("createphotos-value").textContent=String(t.creates);
   $("quote-total").textContent=money(t.total);
   $("quote-entry").textContent=money(t.total*t.deposit/100);
 }
 productInput?.addEventListener("input",update);
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
     "Quantidade de produtos: "+t.products,
     "Produtos extras: "+Math.max(t.products-t.included,0)+" ("+money(t.additional)+")",
     "Tratamento de fotos: "+t.edits+" ("+money(t.photos)+")",
     "Imagens ilustrativas: "+t.creates+" ("+money(t.illustrations)+")",
     "Valor total estimado: "+money(t.total),
     "Entrada estimada ("+t.deposit+"%): "+money(t.total*t.deposit/100),
     details?"Observações: "+details:"",
     "Esta simulação está sujeita à análise e confirmação do projeto."
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

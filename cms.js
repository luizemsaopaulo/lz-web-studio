"use strict";
(() => {
const api="https://lz-web-studio-admin.pages.dev/api/public";
const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e}
function appendText(q,value){const e=document.querySelector(q);if(e)e.textContent=value}
function imageSrc(src){
  if(!src)return null;
  if(src.startsWith("assets/"))return src;
  try{const url=new URL(src);return url.protocol==="https:"?url.href:null}catch{return null}
}
function linkHref(src){
  try{const u=new URL(src);return u.protocol==="https:"?u.href:null}catch{return null}
}
function applyBrand(c){
  document.title=c.businessName+" | "+c.slogan;
  appendText("#hero-heading", "");
  const heading=document.getElementById("hero-heading");
  if(heading){
    heading.append(document.createTextNode((c.heroBefore||"").trim()+" "));
    heading.append(el("em","",c.heroHighlight||"presença digital"));
    heading.append(document.createTextNode(" "+(c.heroAfter||"").trim()));
  }
  appendText(".hero-copy>p",c.heroDescription);
  appendText(".final-cta h2",c.slogan);
  appendText(".footer-main>p","Transformamos ideias em experiências digitais. "+c.slogan);
  const logo=document.querySelector(".hero-img-wrap img"),url=imageSrc(c.images?.logo);
  if(logo&&url)logo.src=url;
  const phone=String(c.whatsapp||"").replace(/\D/g,"");
  if(phone){
    document.querySelectorAll('a[href*="wa.me/"]').forEach(a=>{
      try{const u=new URL(a.href);u.pathname="/"+phone;a.href=u.href}catch{}
    });
  }
}
function applyServices(c){
  const root=document.querySelector("#servicos .service-grid");if(!root||!Array.isArray(c.services))return;
  root.replaceChildren();
  const icons=["▣","⌘","◇","✦","⊞","◈","▤","⌁"];
  c.services.forEach((item,index)=>{
    const card=el("article","service-card");
    const icon=el("div","service-ico",icons[index%icons.length]);
    const n=el("span","service-num",String(index+1).padStart(2,"0"));
    const title=el("h3","",item.title);
    const desc=el("p","",item.description);
    const tag=el("span","tag",item.tag);
    const a=el("a","","Saiba mais");
    a.href="#orcamento";a.setAttribute("aria-label","Solicitar "+item.title);
    a.append(el("span","","↗"));
    card.append(icon,n,title,desc,tag,a);root.append(card);
  });
}
function applyPortfolio(c){
 const root=document.querySelector("#portfolio .project-grid");if(!root||!Array.isArray(c.portfolio))return;
 root.replaceChildren();
 c.portfolio.forEach((p,index)=>{
   const card=el("article","project-card "+["project-cantinho","project-helena","project-beleza"][index%3]);
   const visual=el("div","project-visual");
   const photo=el("img");const src=imageSrc(p.image);
   if(src)photo.src=src;
   photo.alt="Prévia do projeto "+p.name;photo.loading="lazy";
   const tag=el("span","project-type",p.tag||(p.restricted?"ACESSO RESTRITO":"PROJETO DIGITAL"));
   visual.append(photo,tag);
   const info=el("div","project-info"),description=el("div");
   const status=el("span","",p.restricted?"ACESSO RESTRITO":"PROJETO PUBLICADO");
   const h=el("h3","",p.name),d=el("p","",p.description);
   description.append(status,h,d);
   const url=linkHref(p.url);
   if(url) {
     const link=el("a","project-link","↗");link.href=url;link.target="_blank";link.rel="noopener noreferrer";
     link.setAttribute("aria-label","Abrir projeto "+p.name);
     info.append(description,link);
   } else info.append(description);
   card.append(visual,info);root.append(card);
 });
}
function applyPrices(c) {
 const p=c.pricing||{};
 appendText(".price-display strong",money(p.base));
 const notes=document.querySelectorAll("#precos .tick-list li");
 if(notes[1])notes[1].textContent="Organização de produtos e fotos fornecidos pelo cliente";
 appendText(".range-note","A quantidade informada ajuda a preparar a proposta e não aumenta o preço automaticamente.");
 const counters=document.querySelectorAll(".quote .counter-line label small");
 appendText("#photo-package-limit",p.retouchLimit||150);
 appendText("#photo-package-price","+"+money(p.retouch));
 appendText(".photo-option-basic strong",money(p.base));
 appendText(".photo-option-edit strong",money((Number(p.base)||0)+(Number(p.retouch)||0)));
 if(counters[0])counters[0].textContent=money(p.illustration)+" cada";
 appendText("#perguntas details:nth-child(3) p",
   "Se você já possui fotos prontas, elas serão utilizadas no site sem custo de edição: o pacote inicial parte de "+money(p.base)+". Se as fotos precisarem de tratamento, há um pacote opcional de "+money(p.retouch)+" para até "+(p.retouchLimit||150)+" fotografias. Para produtos sem fotos, podemos criar imagens ilustrativas separadamente por "+money(p.illustration)+" cada; imagens ilustrativas devem ser identificadas quando não representarem o produto real.");
 appendText("#perguntas details:nth-child(4) p",
   "Para projetos do pacote inicial: "+p.deposit+"% na contratação e os outros "+(100-p.deposit)+"% após aprovação, antes da publicação. Projetos personalizados podem ter condições definidas em proposta.");
 appendText("#perguntas details:nth-child(5) p",
   "Sim. Alterações posteriores são orçadas separadamente; há opção de manutenção por "+money(p.maintenance)+"/mês para até quatro solicitações simples. Correções de falhas de desenvolvimento têm cobertura de 30 dias.");
}
async function refresh(){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5500);
  try{
    const response=await fetch(api,{signal:controller.signal,cache:"no-store"});
    if(!response.ok)return;
    const result=await response.json();if(!result.ok||!result.config)return;
    const c=result.config;window.LZ_CMS_CONFIG=c;
    applyBrand(c);applyServices(c);applyPortfolio(c);applyPrices(c);
    window.dispatchEvent(new CustomEvent("lz-config-updated",{detail:{version:result.version}}));
  }catch(e){console.info("LZ Web Studio: utilizando valores locais de segurança.")}finally{clearTimeout(timer)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",refresh,{once:true});
else refresh();
})();
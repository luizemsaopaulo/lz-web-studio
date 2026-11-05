"use strict";
(() => {
  const contact = "5511947406124";
  const money = (v) => new Intl.NumberFormat("pt-BR", {style:"currency",currency:"BRL"}).format(v);
  const $ = (id) => document.getElementById(id);
  const productInput = $("products");
  const photoEditInput = $("editphotos");
  const photoCreateInput = $("createphotos");
  const form = $("orcamento");
  const year = $("year");
  if(year) year.textContent = String(new Date().getFullYear());

  function totals() {
    const products = Math.max(1,Math.min(100, Number(productInput?.value)||20));
    const edits = Math.max(0, Number(photoEditInput?.value)||0);
    const creates = Math.max(0, Number(photoCreateInput?.value)||0);
    const base = 250;
    const additional = Math.max(0,products-20)*5;
    const photos = edits*12;
    const illustrations = creates*25;
    return {products, edits, creates,base,additional,photos,illustrations,total:base+additional+photos+illustrations};
  }
  function update() {
    const t = totals();
    $("products-value").textContent = String(t.products);
    $("editphotos-value").textContent = String(t.edits);
    $("createphotos-value").textContent = String(t.creates);
    $("quote-total").textContent = money(t.total);
    $("quote-entry").textContent = money(t.total/2);
    productInput.style.background = "transparent";
  }
  if(productInput) productInput.addEventListener("input", update);
  document.querySelectorAll("[data-counter]").forEach(button => button.addEventListener("click", () => {
    const field = $(button.dataset.counter);
    const step = Number(button.dataset.step);
    field.value = String(Math.max(0,Math.min(100,Number(field.value)+step)));
    update();
  }));

  if(form) form.addEventListener("submit", event => {
    event.preventDefault();
    const t = totals();
    const name = $("client-name").value.trim().slice(0,70);
    const business = $("business-name").value.trim().slice(0,100);
    const details = $("details").value.trim().slice(0,700);
    const lines = [
      "Olá, LZ Web Studio! Gostaria de solicitar um orçamento para um cardápio/site de pedidos.",
      "",
      name ? "Nome: "+name : "",
      business ? "Estabelecimento: "+business : "",
      "Quantidade de produtos: "+t.products,
      "Produtos extras: "+Math.max(t.products-20,0)+" ("+money(t.additional)+")",
      "Tratamento de fotos: "+t.edits+" ("+money(t.photos)+")",
      "Imagens ilustrativas: "+t.creates+" ("+money(t.illustrations)+")",
      "Valor total estimado: "+money(t.total),
      "Entrada estimada (50%): "+money(t.total/2),
      details ? "Observações: "+details : "",
      "",
      "Esta simulação está sujeita à análise e confirmação do projeto."
    ].filter(Boolean).join("\n");
    const url = "https://wa.me/"+contact+"?text="+encodeURIComponent(lines);
    const opened = window.open(url, "_blank","noopener,noreferrer");
    if(!opened) window.location.href = url;
  });

  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = $("nav-links");
  if(menuButton && navLinks) {
    const close = () => {menuButton.setAttribute("aria-expanded","false");navLinks.classList.remove("is-open")};
    menuButton.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded")==="true";
      menuButton.setAttribute("aria-expanded",String(!expanded));
      navLinks.classList.toggle("is-open",!expanded);
    });
    navLinks.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
    document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  }
  const progress = $("progress");
  let scheduled=false;
  const scrollUpdate=()=>{const h=document.documentElement;const total=h.scrollHeight-h.clientHeight;progress.style.width=(total?100*h.scrollTop/total:0)+"%";scheduled=false};
  window.addEventListener("scroll",()=>{if(!scheduled){window.requestAnimationFrame(scrollUpdate);scheduled=true}},{passive:true});
  update();
  scrollUpdate();
})();

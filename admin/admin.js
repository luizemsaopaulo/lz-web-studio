"use strict";
(() => {
const API = window.location.hostname==="lz-web-studio-admin.pages.dev"?"":"https://lz-web-studio-admin.pages.dev";
const PUBLIC_SITE = "https://luizemsaopaulo.github.io/lz-web-studio/";
const qs = (s,root=document)=>root.querySelector(s);
const qsa = (s,root=document)=>[...root.querySelectorAll(s)];
const $ = id=>document.getElementById(id);
const money = value=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(value)||0);
let config=null,version=0,token=sessionStorage.getItem("lz-admin-session")||"",dirty=false,uploading=0;
const pages={inicio:"Visão geral",marca:"Marca e textos",precos:"Valores e serviços",portfolio:"Portfólio",imagens:"Imagens",seguranca:"Segurança"};
function toast(msg,error=false){
 const el=$("toast");el.textContent=msg;el.hidden=false;el.classList.toggle("error",error);
 clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.hidden=true},5600);
}
function setDirty(v=true){
 dirty=v;
 $("save-status").textContent=v?"Alterações não salvas":"Todas as alterações salvas";
 $("save-status").classList.toggle("dirty",v);
 $("save").disabled=uploading>0;
}
function go(page){
 if(!pages[page])return;
 for(const [name] of Object.entries(pages))$("page-"+name).hidden=name!==page;
 qsa("[data-page]").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===page));
 $("breadcrumb").textContent=pages[page];
 qs(".sidebar").classList.remove("open");
 window.scrollTo({top:0,behavior:"smooth"});
}
async function call(path,{method="GET",payload,auth=true}={}){
 const h={"Accept":"application/json"};
 if(payload!==undefined)h["Content-Type"]="application/json";
 if(auth&&token)h.Authorization="Bearer "+token;
 let response;
 try{response=await fetch(API+path,{method,headers:h,body:payload===undefined?undefined:JSON.stringify(payload),cache:"no-store"})}
 catch{throw Error("Não foi possível conectar ao servidor administrativo.")}
 let data;
 try{data=await response.json()}catch{throw Error("Resposta inesperada do servidor.")}
 if(!response.ok||!data.ok)throw Error(data.error||"Falha no servidor");
 return data;
}
async function load(){
 const data=await call("/api/public",{auth:false});
 config=data.config;version=Number(data.version)||0;fill();
 setDirty(false);
}
function updateModel(path,value){
 const keys=path.split(".");
 let o=config;
 for(let i=0;i<keys.length-1;i++)o=o[keys[i]];
 o[keys.at(-1)]=value;
 setDirty();
 refreshMetrics();
}
function fill(){
 qsa("[data-path]").forEach(input=>{
   let val=config;
   for(const key of input.dataset.path.split("."))val=val?.[key];
   input.value=val??"";
 });
 renderServices();renderProjects();renderImages();refreshMetrics();
}
function refreshMetrics(){
 $("metric-projects").textContent=config?.portfolio?.length??0;
 $("metric-services").textContent=config?.services?.length??0;
 $("metric-price").textContent=money(config?.pricing?.base);
}
function elem(tag,className,text) {
 const e=document.createElement(tag);
 if(className)e.className=className;
 if(text!==undefined)e.textContent=text;
 return e;
}
function inputField(label,value,onInput,{type="text",placeholder="",maxlength=400}={}){
 const l=elem("label","",label);
 const inp=type==="textarea"?document.createElement("textarea"):document.createElement("input");
 if(type!=="textarea")inp.type=type;
 if(type==="textarea")inp.rows=3;
 if(maxlength)inp.maxLength=maxlength;
 inp.placeholder=placeholder;inp.value=value??"";
 inp.addEventListener("input",()=>onInput(inp.value));
 l.append(inp);return l;
}
function editorCard(title,index,array,onRemove){
 const box=elem("article","editor-card");
 const header=elem("div","editor-title");
 const heading=elem("h3","",title);
 const del=elem("button","","Remover");del.type="button";
 del.addEventListener("click",()=>{
   if(!confirm("Remover "+title+" da página? A alteração só será publicada quando você clicar em Salvar."))return;
   array.splice(index,1);setDirty();refreshMetrics();array===config.services?renderServices():renderProjects();
 });
 header.append(heading,del);box.append(header);return box;
}
function renderServices(){
 const root=$("services-editor");root.replaceChildren();
 config.services.forEach((service,index)=>{
    const box=editorCard("Serviço "+(index+1),index,config.services);
    box.append(
      inputField("Título do serviço",service.title,v=>{service.title=v;setDirty()}, {maxlength:90}),
      inputField("Descrição",service.description,v=>{service.description=v;setDirty()}, {type:"textarea",maxlength:400}),
      inputField("Categoria / destaque",service.tag,v=>{service.tag=v;setDirty()}, {maxlength:100})
    );
    root.append(box);
 });
}
function renderProjects(){
 const root=$("projects-editor");root.replaceChildren();
 config.portfolio.forEach((project,index)=>{
   const box=editorCard(project.name||"Novo projeto",index,config.portfolio);
   const row=elem("div","field-row");
   row.append(
     inputField("Nome do projeto",project.name,v=>{project.name=v;setDirty()}, {maxlength:100}),
     inputField("Categoria",project.tag,v=>{project.tag=v;setDirty()}, {maxlength:100})
   );
   box.append(row,
      inputField("Descrição",project.description,v=>{project.description=v;setDirty()}, {maxlength:250}),
      inputField("Link para acessar o site",project.url,v=>{project.url=v;setDirty()}, {maxlength:700,placeholder:"https://..."})
   );
   const actions=elem("div","editor-actions"),uploadLabel=elem("label","button outline upload-control","↥ Substituir foto");
   const file=document.createElement("input");file.type="file";file.accept="image/jpeg,image/png,image/webp";file.hidden=true;
   file.addEventListener("change",async()=>{if(!file.files[0])return;try{project.image=await uploadImage(file.files[0],1400,920);setDirty();renderProjects();toast("Imagem enviada. Clique em Salvar alterações.")}catch(e){toast(e.message,true)}});
   uploadLabel.append(file);
   const restricted=elem("label","","Acesso restrito");
   const check=document.createElement("input");check.type="checkbox";check.checked=!!project.restricted;
   check.addEventListener("change",()=>{project.restricted=check.checked;setDirty()});
   restricted.prepend(check);
   const move=elem("div","reorder");
   const up=elem("button","button outline","↑"),down=elem("button","button outline","↓");
   up.type=down.type="button";
   up.disabled=index===0;down.disabled=index===config.portfolio.length-1;
   up.addEventListener("click",()=>reorder(index,-1));
   down.addEventListener("click",()=>reorder(index,+1));
   move.append(up,down);
   actions.append(uploadLabel,restricted,move);
   const image=elem("img","project-preview");
   image.alt="Prévia de "+project.name;
   image.src=previewUrl(project.image);
   image.onerror=()=>image.style.opacity=".3";
   box.append(image,actions);
   root.append(box);
 });
}
function reorder(index,direction){
 const arr=config.portfolio;const [item]=arr.splice(index,1);
 arr.splice(index+direction,0,item);setDirty();renderProjects();
}
function previewUrl(raw){
 if(!raw)return PUBLIC_SITE+"assets/logo-3d.jpg";
 if(raw.startsWith("assets/"))return PUBLIC_SITE+raw;
 return raw;
}
function renderImages(){
 $("logo-preview").src=previewUrl(config.images.logo);
 $("cover-preview").src=previewUrl(config.images.cover||"assets/og-whatsapp-20261105.jpg");
}
async function processImage(file,maxWidth,maxHeight){
 if(!file.type.startsWith("image/"))throw Error("Selecione uma imagem.");
 if(file.size>20*1024*1024)throw Error("Arquivo maior que 20 MB. Reduza antes de enviar.");
 const u=URL.createObjectURL(file);
 try{
   const im=new Image();im.src=u;await im.decode();
   let w=Math.min(maxWidth,im.naturalWidth),h=Math.round(im.naturalHeight*(w/im.naturalWidth));
   if(h>maxHeight){w=Math.round(w*(maxHeight/h));h=maxHeight}
   for(let attempt=0;attempt<5;attempt++){
     const canvas=document.createElement("canvas");
     canvas.width=w;canvas.height=h;
     const ctx=canvas.getContext("2d");
     ctx.fillStyle="#0b0c0f";ctx.fillRect(0,0,w,h);ctx.drawImage(im,0,0,w,h);
     const blob=await new Promise(res=>canvas.toBlob(res,"image/jpeg",Math.max(.50,.87-attempt*.09)));
     if(blob&&blob.size<770000) {
       const base64=await new Promise((resolve,reject)=>{
         const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.onerror=reject;reader.readAsDataURL(blob);
       });
       return {mime:"image/jpeg",base64};
     }
     w=Math.max(240,Math.floor(w*.83));h=Math.max(160,Math.floor(h*.83));
   }
   throw Error("A imagem é grande demais para carregar.");
 }finally{URL.revokeObjectURL(u)}
}
async function uploadImage(file,w,h){
 uploading++;$("save").disabled=true;
 try{
   const body=await processImage(file,w,h);
   const result=await call("/api/upload",{method:"POST",payload:body});
   return result.url;
 }finally{uploading--; $("save").disabled=uploading>0}
}
async function save(){
 if(!config||uploading)return;
 const b=$("save");
 b.disabled=true;b.textContent="Salvando…";
 try{
    const result=await call("/api/save",{method:"POST",payload:{version,config}});
    version=result.version;setDirty(false);toast("Alterações salvas! O site já pode receber os novos dados.");
 }catch(e){toast(e.message,true);if(e.message.includes("Acesso não autorizado"))logout(false)}
 finally{b.innerHTML="Salvar alterações <span>↗</span>";b.disabled=uploading>0}
}
async function login(event){
 event.preventDefault();
 const b=$("login-button");b.disabled=true;b.textContent="Entrando…";$("login-error").hidden=true;
 try{
   const result=await call("/api/login",{method:"POST",payload:{password:$("password").value},auth:false});
   token=result.token;sessionStorage.setItem("lz-admin-session",token);
   await load();$("auth").hidden=true;$("app").hidden=false;$("password").value="";
   go("inicio");
 }catch(e){$("login-error").textContent=e.message;$("login-error").hidden=false}
 finally{b.disabled=false;b.innerHTML='Entrar no painel <span>↗</span>'}
}
async function logout(server=true){
 if(server&&token){try{await call("/api/logout",{method:"POST"})}catch{}}
 token="";sessionStorage.removeItem("lz-admin-session");config=null;
 $("auth").hidden=false;$("app").hidden=true;
}
document.addEventListener("DOMContentLoaded",()=>{
 $("login-form").addEventListener("submit",login);
 $("show-password").addEventListener("click",()=>{
   const e=$("password");e.type=e.type==="password"?"text":"password";
 });
 qsa("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
 qsa("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
 $("hamburger").addEventListener("click",()=>qs(".sidebar").classList.toggle("open"));
 $("logout").addEventListener("click",()=>logout(true));
 $("save").addEventListener("click",save);
 qsa("[data-path]").forEach(input=>{
   input.addEventListener("input",()=>{
     const val=input.type==="number"?(input.value===""?0:Number(input.value)):input.value;
     updateModel(input.dataset.path,val);
   });
 });
 $("add-service").addEventListener("click",()=>{
   if(config.services.length>=8)return toast("Limite de oito serviços",true);
   config.services.push({title:"Novo serviço",description:"Descrição do serviço",tag:"Personalizado"});setDirty();renderServices();refreshMetrics();
 });
 $("add-project").addEventListener("click",()=>{
   if(config.portfolio.length>=30)return toast("Limite de 30 projetos",true);
   config.portfolio.push({id:crypto.randomUUID(),name:"Novo projeto",description:"",tag:"SITE PROFISSIONAL",url:"",image:"",restricted:false});
   setDirty();renderProjects();refreshMetrics();
 });
 $("logo-upload").addEventListener("change",async e=>{
   const file=e.target.files[0];if(!file)return;
   try{
     config.images.logo=await uploadImage(file,1200,1200);$("logo-filename").textContent="Imagem pronta. Salve as alterações.";renderImages();setDirty();
   }catch(x){toast(x.message,true)}
 });
 $("cover-upload").addEventListener("change",async e=>{
   const file=e.target.files[0];if(!file)return;
   try{
     config.images.cover=await uploadImage(file,1200,630);$("cover-filename").textContent="Nova capa pronta. Salve as alterações.";renderImages();setDirty();
   }catch(x){toast(x.message,true)}
 });
 $("refresh-data").addEventListener("click",()=>{
   if(dirty&&!confirm("Descartar alterações não salvas e recarregar?"))return;
   load().then(()=>toast("Informações atualizadas.")).catch(e=>toast(e.message,true));
 });
 $("copy-site-link").addEventListener("click",async()=>{
   const url=PUBLIC_SITE+"?v="+Math.floor(Date.now()/1000);
   try{await navigator.clipboard.writeText(url);toast("Link do site copiado para compartilhar!")}
   catch{toast("Copie este endereço: "+url)}
 });
 $("change-password").addEventListener("submit",async e=>{
   e.preventDefault();const oldPassword=$("old-password").value;
   const newPassword=$("new-password").value;
   if(newPassword!==$("repeat-password").value)return toast("As novas senhas não conferem",true);
   if(newPassword.length<12)return toast("A senha precisa ter pelo menos 12 caracteres",true);
   try{
     await call("/api/change-password",{method:"POST",payload:{oldPassword,newPassword}});
     $("change-password").reset();await logout(false);toast("Senha atualizada. Entre novamente com a nova senha.");
   }catch(x){toast(x.message,true)}
 });
 if(token) {
   load().then(()=>{
     $("auth").hidden=true;$("app").hidden=false;go("inicio");
   }).catch(()=>{logout(false);});
 }
 window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});
});
})();
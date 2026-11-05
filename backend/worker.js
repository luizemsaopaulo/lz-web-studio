// LZ Web Studio — servidor de administração Cloudflare Workers / D1
// Não incluir credenciais no código, no GitHub ou na página pública.
const SITE_ORIGIN = "https://luizemsaopaulo.github.io";
const LOCAL_ORIGINS = ["http://localhost:8000", "http://127.0.0.1:8000"];
const SALT_ROUNDS = 210000;
const defaultConfig = {
  businessName: "LZ Web Studio",
  slogan: "Sua presença digital começa aqui.",
  heroBefore: "Sua marca merece uma",
  heroHighlight: "presença digital",
  heroAfter: "à altura.",
  heroDescription: "Sites profissionais, cardápios digitais e páginas de pedidos que valorizam sua marca e facilitam a vida dos seus clientes.",
  whatsapp: "5511947406124",
  pricing: {base:250, included:20, extra:5, retouch:12, illustration:25, deposit:50, maintenance:50},
  services: [
    {title:"Cardápios digitais", description:"Organize seus produtos e receba pedidos com carrinho, observações e envio direto ao WhatsApp.",tag:"Restaurantes e delivery"},
    {title:"Sites institucionais", description:"Uma vitrine profissional para apresentar sua empresa, serviços, diferenciais e canais de contato.",tag:"Empresas e profissionais"},
    {title:"Páginas personalizadas",description:"Portfólios, landing pages, catálogos e soluções feitas para as necessidades do seu projeto.",tag:"Sob medida"}
  ],
  portfolio: [
    {id:"cantinho",name:"Cantinho do Petisco",description:"Apresentação digital e cardápio de restaurante.",tag:"RESTAURANTE • CARDÁPIO",image:"assets/cantinho-preview.jpg",url:"https://luizemsaopaulo.github.io/cantinho-do-petisco-v3/",restricted:false},
    {id:"helena",name:"Tudo de Helena",description:"Aplicativo privado para organização de acervo digital.",tag:"ACERVO • ACESSO RESTRITO",image:"assets/helena-preview.jpg",url:"https://luizemsaopaulo.github.io/tudo-de-helena-versao2/",restricted:true},
    {id:"beleza",name:"Mix da Beleza",description:"Aplicativo web para controle e fechamento de caixa.",tag:"GESTÃO • APLICAÇÃO WEB",image:"assets/beleza-preview.jpg",url:"https://luizemsaopaulo.github.io/mix-da-beleza-pwa/",restricted:false}
  ],
  images: { logo:"assets/logo-3d.jpg", cover:"" }
};
const enc = new TextEncoder();
const dec = new TextDecoder();
function json(data,status=200,headers={}) {return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...headers}})}
function err(message,status=400){return json({ok:false,error:message},status)}
function b64url(bytes){return btoa(String.fromCharCode(...bytes)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/g,"")}
function fromB64(b64){return Uint8Array.from(atob(b64.replaceAll("-","+").replaceAll("_","/")),c=>c.charCodeAt(0))}
async function pbkdf(password,salt,iters=SALT_ROUNDS) {
  const key=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:iters,hash:"SHA-256"},key,256));
}
function same(a,b){if(!a||!b||a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a[i]^b[i];return v===0}
async function currentPasswordHash(env){
 const x=await env.DB.prepare("SELECT value FROM security WHERE key='admin_password_hash'").first("value");
 return x || env.ADMIN_PASSWORD_HASH;
}
async function checkPassword(password,env){
 const hash=await currentPasswordHash(env);
 if(!hash || typeof password!=="string")return false;
 const bits=hash.split(":");if(bits.length!==3)return false;
 const iters=Number(bits[0]);if(iters<100000||iters>600000)return false;
 try{return same(await pbkdf(password,fromB64(bits[1]),iters),fromB64(bits[2]))}catch{return false}
}
async function generatePasswordHash(password){
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const hash=await pbkdf(password,salt);
 return SALT_ROUNDS+":"+b64url(salt)+":"+b64url(hash);
}
async function hmacKey(env){
 return crypto.subtle.importKey("raw",fromB64(env.SESSION_SECRET||""),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);
}
async function tokenFor(session,env){
 const data=b64url(enc.encode(JSON.stringify(session)));
 const sig=new Uint8Array(await crypto.subtle.sign("HMAC",await hmacKey(env),enc.encode(data)));
 return data+"."+b64url(sig);
}
async function getSession(request,env) {
 const header=request.headers.get("authorization")||"";
 if(!header.startsWith("Bearer "))return null;
 const token=header.slice(7),parts=token.split(".");
 if(parts.length!==2||token.length>2048)return null;
 try{
   const verified=await crypto.subtle.verify("HMAC",await hmacKey(env),fromB64(parts[1]),enc.encode(parts[0]));
   if(!verified)return null;
   const session=JSON.parse(dec.decode(fromB64(parts[0])));
   if(!session.id||!session.exp||session.exp<Date.now()||session.exp>Date.now()+5*3600000)return null;
   const row=await env.DB.prepare("SELECT id FROM sessions WHERE id=? AND expires>?").bind(session.id,Date.now()).first();
   return row?session:null;
 }catch{return null}
}
async function configRow(env){
 const row=await env.DB.prepare("SELECT data,version,updated_at FROM site_config WHERE id='main'").first();
 try{return row ? {config:JSON.parse(row.data),version:row.version,updatedAt:row.updated_at} : {config:defaultConfig,version:0,updatedAt:null}}catch{return {config:defaultConfig,version:0,updatedAt:null}}
}
const str=(v,max=250)=>(typeof v==="string"?v.trim().slice(0,max):"");
function safeURL(v,allowRelative=false){
 const val=str(v,700);
 if(allowRelative && /^assets\/[a-zA-Z0-9_\-.\/]+$/.test(val))return val;
 try{const u=new URL(val);return u.protocol==="https:"?u.toString():""}catch{return ""}
}
const price=(v,min=0,max=50000)=>Math.min(max,Math.max(min,Number.isFinite(Number(v))?Number(v):0));
function cleanConfig(raw){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("Dados inválidos");
 const c={
   businessName:str(raw.businessName,80),slogan:str(raw.slogan,120),
   heroBefore:str(raw.heroBefore,130),heroHighlight:str(raw.heroHighlight,100),heroAfter:str(raw.heroAfter,90),
   heroDescription:str(raw.heroDescription,500),whatsapp:str(raw.whatsapp,20).replace(/\D/g,""),
   pricing:{
     base:price(raw.pricing?.base),included:Math.round(price(raw.pricing?.included,1,500)),
     extra:price(raw.pricing?.extra),retouch:price(raw.pricing?.retouch),
     illustration:price(raw.pricing?.illustration),deposit:price(raw.pricing?.deposit,1,100),
     maintenance:price(raw.pricing?.maintenance)
   },
   services:(Array.isArray(raw.services)?raw.services:[]).slice(0,8).map(s=>({title:str(s?.title,90),description:str(s?.description,400),tag:str(s?.tag,100)})),
   portfolio:(Array.isArray(raw.portfolio)?raw.portfolio:[]).slice(0,30).map(p=>({
     id:str(p?.id,100)||crypto.randomUUID(),name:str(p?.name,100),description:str(p?.description,250),
     tag:str(p?.tag,100),url:safeURL(p?.url),image:safeURL(p?.image,true),
     restricted:!!p?.restricted
   })),
   images:{logo:safeURL(raw.images?.logo,true),cover:safeURL(raw.images?.cover,true)}
 };
 if(c.whatsapp.length<10||c.whatsapp.length>15)throw Error("WhatsApp precisa ter código do país e DDD");
 if(!c.businessName||!c.heroHighlight)throw Error("Preencha o nome da marca e o destaque do título");
 return c;
}
function allowedOrigin(origin) {return origin===SITE_ORIGIN||LOCAL_ORIGINS.includes(origin)}
function corsHeaders(req,publicGet=false){
 const origin=req.headers.get("origin");
 return {"Access-Control-Allow-Origin":publicGet?"*":(allowedOrigin(origin)?origin:"null"),
 "Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Vary":"Origin"};
}
function withCors(res,req,publicGet=false) {
 const h=new Headers(res.headers);
 for(const [k,v] of Object.entries(corsHeaders(req,publicGet)))h.set(k,v);
 return new Response(res.body,{status:res.status,headers:h});
}
async function data(request,max=1500000){
 const input=await request.text();
 if(input.length>max)throw Error("Solicitação muito grande");
 return JSON.parse(input);
}
async function handle(request,env){
 const url=new URL(request.url), path=url.pathname;
 if(request.method==="GET" && path==="/api/health")return json({ok:true,service:"LZ Web Studio ADM",database:"connected"});
 if(request.method==="GET" && path==="/api/public")return json({ok:true,...await configRow(env)});
 if(request.method==="GET" && (path.startsWith("/media/")||path==="/og.jpg")){
    let id=path.split("/").pop();
    if(path==="/og.jpg") {
       const row=await configRow(env);
       const cover=row.config.images?.cover||"";
       const m=cover.match(/\/media\/([a-f0-9-]{36})$/);
       if(m)id=m[1];
       else return fetch("https://luizemsaopaulo.github.io/lz-web-studio/assets/og-whatsapp-20261105.jpg");
    }
    if(!/^[a-f0-9-]{36}$/.test(id))return err("Imagem inválida",404);
    const row=await env.DB.prepare("SELECT mime,data_b64 FROM media WHERE id=?").bind(id).first();
    if(!row)return err("Imagem não encontrada",404);
    return new Response(fromB64(row.data_b64),{headers:{
      "Content-Type":row.mime,"Cache-Control":path==="/og.jpg"?"public, max-age=60":"public, max-age=31536000, immutable",
      "X-Content-Type-Options":"nosniff","Access-Control-Allow-Origin":"*"
    }});
 }
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders(request)});
 if(request.method!=="POST")return err("Não encontrado",404);
 if(!allowedOrigin(request.headers.get("origin")))return err("Origem não autorizada",403);
 if(path==="/api/login"){
   const ip=(request.headers.get("CF-Connecting-IP")||"unknown").slice(0,60);
   let attempt=await env.DB.prepare("SELECT failures,blocked_until FROM login_attempts WHERE ip=?").bind(ip).first();
   if(attempt?.blocked_until>Date.now())return err("Muitas tentativas. Aguarde 15 minutos.",429);
   const body=await data(request,12000);
   const valid=await checkPassword(body.password,env);
   if(!valid){
     const failures=(attempt?.failures||0)+1, blocked=failures>=6?Date.now()+15*60000:0;
     await env.DB.prepare("INSERT INTO login_attempts (ip,failures,blocked_until) VALUES(?,?,?) ON CONFLICT(ip) DO UPDATE SET failures=?,blocked_until=?").bind(ip,blocked?0:failures,blocked,blocked?0:failures,blocked).run();
     return err("Senha incorreta",401);
   }
   await env.DB.prepare("DELETE FROM login_attempts WHERE ip=?").bind(ip).run();
   const session={id:crypto.randomUUID(),exp:Date.now()+4*3600000};
   await env.DB.prepare("INSERT INTO sessions (id,expires,created_at) VALUES(?,?,?)").bind(session.id,session.exp,Date.now()).run();
   return json({ok:true,token:await tokenFor(session,env),expires:session.exp});
 }
 const session=await getSession(request,env);
 if(!session)return err("Acesso não autorizado. Faça login.",401);
 if(path==="/api/logout"){
   await env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(session.id).run();
   return json({ok:true});
 }
 if(path==="/api/change-password"){
   const body=await data(request,10000);
   if(!await checkPassword(body.oldPassword,env))return err("Senha atual incorreta",403);
   if(typeof body.newPassword!=="string"||body.newPassword.length<12||body.newPassword.length>128)return err("A nova senha precisa ter 12 a 128 caracteres");
   const next=await generatePasswordHash(body.newPassword);
   await env.DB.prepare("INSERT INTO security (key,value) VALUES('admin_password_hash',?) ON CONFLICT(key) DO UPDATE SET value=?").bind(next,next).run();
   await env.DB.prepare("DELETE FROM sessions").run();
   return json({ok:true,logout:true});
 }
 if(path==="/api/save"){
   const body=await data(request,140000);
   const expected=Math.round(Number(body.version));
   if(!Number.isInteger(expected)||expected<0)return err("Versão inválida");
   const config=cleanConfig(body.config);
   await env.DB.prepare("INSERT OR IGNORE INTO site_config (id,data,version) VALUES('main',?,0)").bind(JSON.stringify(defaultConfig)).run();
   const result=await env.DB.prepare("UPDATE site_config SET data=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id='main' AND version=?").bind(JSON.stringify(config),expected).run();
   if(!result.meta.changes)return err("Outra edição foi salva. Recarregue antes de salvar novamente.",409);
   return json({ok:true,version:expected+1});
 }
 if(path==="/api/upload"){
   const body=await data(request,1150000);
   const mime=body.mime;
   if(!["image/jpeg","image/png","image/webp"].includes(mime))return err("Formato de imagem não permitido");
   const b64=String(body.base64||"").replace(/\s/g,"");
   if(!b64||b64.length>1120000||!/^[A-Za-z0-9+/]*={0,2}$/.test(b64))return err("A imagem ultrapassou o limite. Comprima-a antes de enviar.");
   const bytes=fromB64(b64);
   if(bytes.length>820000)return err("Imagem acima de 800 KB");
   const jpeg=bytes[0]===255 && bytes[1]===216;
   const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
   const webp=bytes[0]===82&&bytes[1]===73&&bytes[2]===70&&bytes[3]===70;
   if(!((mime==="image/jpeg"&&jpeg)||(mime==="image/png"&&png)||(mime==="image/webp"&&webp)))return err("Arquivo inválido");
   const id=crypto.randomUUID();
   await env.DB.prepare("INSERT INTO media (id,mime,data_b64) VALUES(?,?,?)").bind(id,mime,b64).run();
   return json({ok:true,url:new URL(request.url).origin+"/media/"+id});
 }
 return err("Endpoint desconhecido",404);
}
export default {
 async fetch(request,env){
    try{
      const path=new URL(request.url).pathname;
      const publicGet=request.method==="GET" && (path==="/api/public"||path==="/api/health"||path.startsWith("/media/")||path==="/og.jpg");
      return withCors(await handle(request,env),request,publicGet);
    }catch(e){
      return withCors(err(e instanceof SyntaxError?"JSON inválido":String(e?.message||"Erro interno").slice(0,180),e instanceof SyntaxError?400:500),request);
    }
 }
};

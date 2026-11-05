# coding: utf-8
from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[2]
backend=root/"backend"
pages=backend/"pages-site"
public=pages/"public"
(public/"admin").mkdir(parents=True,exist_ok=True)
(public/"assets").mkdir(parents=True,exist_ok=True)
source=(backend/"worker.js").read_text(encoding="utf-8")
source=source.replace('origin===SITE_ORIGIN||LOCAL_ORIGINS.includes(origin)','origin===SITE_ORIGIN||origin==="https://lz-web-studio-admin.pages.dev"||LOCAL_ORIGINS.includes(origin)')
source=source.replace('if(request.method==="GET" && path==="/api/public")return json({ok:true,...await configRow(env)});','if(request.method==="GET" && path==="/api/public")return json({ok:true,...await configRow(env)});\n if(request.method==="GET" && path==="/api/me"){const active=await getSession(request,env);return json({ok:!!active},active?200:401);}')
source=source.replace('async fetch(request,env){\n    try{','async fetch(request,env){\n    const p=new URL(request.url).pathname;\n    if(!(p.startsWith("/api/")||p.startsWith("/media/")||p==="/og.jpg"))return env.ASSETS.fetch(request);\n    try{')
(public/"_worker.js").write_text(source,encoding="utf-8")
for x in ("index.html","admin.css","admin.js"):
    shutil.copy2(root/"admin"/x,public/"admin"/x)
for x in ("logo-3d.jpg","og-whatsapp-20261105.jpg"):
    shutil.copy2(root/"assets"/x,public/"assets"/x)
(public/"index.html").write_text('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/admin/"><title>LZ Web Studio ADM</title></head><body><p><a href="/admin/">Abrir painel LZ Web Studio</a></p></body></html>',encoding="utf-8")
(public/"_headers").write_text('/admin/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n',encoding="utf-8")
print("PREPARADO",public, "files",len(list(public.rglob("*"))))

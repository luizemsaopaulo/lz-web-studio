# coding: utf-8
"""Artes de apresentação LZ Web Studio; execução local, sem serviços externos."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import math
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"assets"
OUT.mkdir(exist_ok=True)
FONTS=Path(r"C:\Windows\Fonts")
def font(size,bold=True):
    names=(["arialbd.ttf","seguisb.ttf","bahnschrift.ttf"] if bold else ["arial.ttf","segoeui.ttf"])
    for f in names:
        p=FONTS/f
        if p.exists(): return ImageFont.truetype(str(p),size)
    return ImageFont.load_default()
def background(w,h,light=1):
    im=Image.new("RGB",(w,h))
    px=im.load()
    for y in range(h):
        for x in range(w):
            dx=(x-.73*w)/w;dy=(y-.35*h)/h
            glow=max(0,1-math.sqrt(dx*dx+dy*dy)*1.55)*light
            rg=max(0,1-math.sqrt(((x-.04*w)/(.7*w))**2+((y-.015*h)/(.75*h))**2))*light
            px[x,y]=(int(9+62*glow+34*rg),int(11+24*glow+10*rg),int(15+13*glow+3*rg))
    return im
def glow_line(im,points,color=(255,107,22),width=9,blur=14):
    lay=Image.new("RGBA",im.size,(0,0,0,0))
    ld=ImageDraw.Draw(lay)
    ld.line(points,fill=(*color,190),width=width,joint="curve")
    im.alpha_composite(lay.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(im).line(points,fill=(*color,255),width=width,joint="curve")
def text3d(im,pos,txt,f,fill,shadow=(6,7),stroke=0,strokefill=None):
    d=ImageDraw.Draw(im)
    x,y=pos
    for n in range(7,0,-1):
        d.text((x+n,y+n),txt,font=f,fill=(25+n*3,15+n*2,11+n),stroke_width=stroke,stroke_fill=strokefill)
    d.text((x,y),txt,font=f,fill=fill,stroke_width=stroke,stroke_fill=strokefill)
    d.text((x-1,y-2),txt,font=f,fill=(255,255,255,32),stroke_width=0)
def draw_logo(size=900):
    s=size/900
    base=background(900,900).convert("RGBA")
    # Chrome browser silhouette / floating window
    d=ImageDraw.Draw(base)
    d.rounded_rectangle((124,135,772,622),radius=56,fill="#0f131a",outline="#777e87",width=20)
    d.rounded_rectangle((139,150,754,605),radius=47,outline="#2e343b",width=8)
    glow_line(base,[(164,218),(695,218)],width=5,blur=10)
    d=ImageDraw.Draw(base)
    for x in (194,244,294):
        d.ellipse((x,174,x+31,205),fill="#ff7925",outline="#ffc36d",width=3)
    # orbit behind letters
    arc=Image.new("RGBA",base.size,(0,0,0,0))
    ad=ImageDraw.Draw(arc)
    ad.arc((67,347,834,761),5,176,fill="#b53d0e",width=29)
    ad.arc((67,347,834,761),9,180,fill="#ffb34c",width=11)
    base.alpha_composite(arc.filter(ImageFilter.GaussianBlur(11)))
    base.alpha_composite(arc)
    # metallic monogram: shadows, highlights, strokes
    text3d(base,(157,215),"L",font(475),fill="#c3cbd2",stroke=7,strokefill="#272a31")
    text3d(base,(392,221),"Z",font(470),fill="#ff7d20",stroke=8,strokefill="#d4510d")
    # lower orbit rim
    front=Image.new("RGBA",base.size,(0,0,0,0));fd=ImageDraw.Draw(front)
    fd.arc((45,358,850,748),10,170,fill="#ff8d23",width=25)
    fd.arc((48,356,847,741),12,173,fill="#ffc26e",width=7)
    base.alpha_composite(front.filter(ImageFilter.GaussianBlur(8)))
    base.alpha_composite(front)
    # pointer/click flash
    d=ImageDraw.Draw(base)
    p=[(690,245),(702,376),(739,345),(779,416),(809,400),(767,328),(818,307)]
    d.polygon(p,fill="#070a0f")
    d.line(p+[p[0]],fill="#f0f2f5",width=9,joint="curve")
    for ang in [-85,-45,-5]:
        rad=math.radians(ang)
        x=694+70*math.cos(rad);y=236+70*math.sin(rad)
        x2=694+115*math.cos(rad);y2=236+115*math.sin(rad)
        glow_line(base,[(x,y),(x2,y2)],width=8,blur=12)
    # words
    d=ImageDraw.Draw(base)
    text3d(base,(130,693),"WEB",font(92),fill="#e4e9ed",stroke=1,strokefill="#43444a")
    text3d(base,(348,693),"STUDIO",font(92),fill="#ff7d1f",stroke=1,strokefill="#a53b10")
    glow_line(base,[(182,805),(715,805)],color=(255,122,31),width=7,blur=9)
    base=base.convert("RGB")
    if size!=900:base=base.resize((size,size),Image.Resampling.LANCZOS)
    return base
logo=draw_logo(900)
logo.save(OUT/"logo-3d.jpg",quality=91,optimize=True,progressive=True)
# WhatsApp social preview card 1200x630, concrete image, not CSS or an SVG
W,H=1200,630
base=background(W,H,1.45).convert("RGBA")
d=ImageDraw.Draw(base)
# Diagonal glows
glow_line(base,[(570,0),(430,630)],(255,103,26),width=5,blur=24)
d=ImageDraw.Draw(base)
# Left: real raster logo reproduction
preview_logo=logo.resize((505,505),Image.Resampling.LANCZOS).convert("RGBA")
mask=Image.new("L",preview_logo.size,255)
md=ImageDraw.Draw(mask);md.rectangle((0,0,505,505),fill=255)
base.alpha_composite(preview_logo,(35,30))
# Right: editorial readable content
d=ImageDraw.Draw(base)
d.text((565,96),"SUA PRESENÇA DIGITAL",font=font(44),fill="#f5f5f7",stroke_width=0)
d.text((565,151),"COMEÇA AQUI.",font=font(49),fill="#ff8536")
d.line((565,230,1134,230),fill="#69503f",width=3)
d.text((570,268),"Criação de sites profissionais",font=font(29,False),fill="#e8eaf0")
d.text((570,319),"Cardápios digitais e pedidos online",font=font(24,False),fill="#bdc5ce")
d.text((570,368),"Portfólios e páginas personalizadas",font=font(24,False),fill="#bdc5ce")
d.rounded_rectangle((567,463,1102,536),radius=18,fill="#ff7828")
d.text((601,481),"Conheça nossos projetos  ↗",font=font(28),fill="#1d1010")
d.text((569,572),"LZ WEB STUDIO  •  SITES QUE VALORIZAM SUA MARCA",font=font(16),fill="#bfc3ca")
base=base.convert("RGB")
base.save(OUT/"og-whatsapp.jpg",quality=91,optimize=True,progressive=True,subsampling=0)
# Icons for browsers
fav=Image.new("RGBA",(180,180),(17,19,24,255))
fd=ImageDraw.Draw(fav)
fd.rounded_rectangle((5,5,174,174),radius=36,outline="#fb791e",width=8)
fd.text((19,50),"L",font=font(97),fill="#ffffff")
fd.text((78,50),"Z",font=font(97),fill="#ff771e")
fav.save(OUT/"favicon-180.png")
# Portfolio visuals fallback mockups; replaced by actual captures when available.
def preview(name, subtitle, c1,c2,accent):
    w,h=1000,640
    im=Image.new("RGB",(w,h))
    dd=ImageDraw.Draw(im)
    for y in range(h):
        t=y/h
        dd.line((0,y,w,y),fill=tuple(int(c1[i]*(1-t)+c2[i]*t) for i in range(3)))
    dd.rounded_rectangle((108,68,896,598),radius=24,fill="#181b22",outline="#6c6a70",width=4)
    dd.rounded_rectangle((108,68,896,128),radius=20,fill="#292b32")
    for x in (147,176,205):dd.ellipse((x,88,x+16,104),fill=accent)
    dd.text((157,166),name,font=font(52),fill="#ffffff")
    dd.text((159,237),subtitle,font=font(28,False),fill="#c8cbd1")
    dd.rounded_rectangle((155,336,425,389),radius=15,fill=accent)
    dd.text((180,346),"Conheça mais ↗",font=font(24),fill="#101014")
    for a in range(3):
        x=488+a*111
        dd.rounded_rectangle((x,322,x+91,462),radius=12,fill="#353942")
        dd.ellipse((x+18,343,x+73,397),fill=accent)
        dd.line((x+18,420,x+72,420),fill="#949ca5",width=8)
        dd.line((x+18,440,x+61,440),fill="#5b636c",width=6)
    im.save(OUT/(name.lower().replace(" ","-")+"-preview.jpg"),quality=85,optimize=True)
preview("Cantinho", "Cardápio digital e pedidos", (92,40,32),(28,12,13),(255,106,55))
preview("Helena", "Decoração e eventos", (104,53,91),(32,18,41),(240,144,194))
preview("Beleza", "Beleza e experiência digital", (35,108,91),(17,35,40),(124,221,176))
print("ARTES_GERADAS:")
for p in sorted(OUT.glob("*")):print(p.name,p.stat().st_size)

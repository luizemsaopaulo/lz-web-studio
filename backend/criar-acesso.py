# coding: utf-8
"""Configura segredos seguros no Cloudflare. A senha gerada não é salva no disco."""
import base64,hashlib,secrets,subprocess,pathlib,sys
here=pathlib.Path(__file__).resolve().parent
password=secrets.token_urlsafe(19)
salt=secrets.token_bytes(16)
hashbytes=hashlib.pbkdf2_hmac('sha256',password.encode('utf-8'),salt,210000)
def b64url(d):return base64.urlsafe_b64encode(d).decode().rstrip('=')
hashvalue='210000:'+b64url(salt)+':'+b64url(hashbytes)
session=secrets.token_bytes(32)
for name,value in [('ADMIN_PASSWORD_HASH',hashvalue),('SESSION_SECRET',b64url(session))]:
    cmd=['wrangler.cmd','pages','secret','put',name,'--project-name','lz-web-studio-admin']
    cp=subprocess.run(cmd,input=value+'\n',cwd=here,encoding='utf-8',capture_output=True,timeout=45)
    if cp.returncode:
        print('FALHA_CONFIGURAR_SEGREDO',name,cp.stderr[-450:],cp.stdout[-450:])
        sys.exit(1)
    print('CONFIGURADO',name)
print('SENHA_INICIAL_ADM='+password)
print('USO=Alterar no painel ADM em Segurança quando desejar. A senha inicial não foi salva em arquivo.')

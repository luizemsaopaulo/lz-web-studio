# LZ Web Studio — administração

Site público: https://luizemsaopaulo.github.io/lz-web-studio/
ADM: https://lz-web-studio-admin.pages.dev/admin/
API/armazenamento: Cloudflare Pages (modo _worker.js) + Cloudflare D1.
Banco: lz-web-studio-db.

## Como usar
1. Acesse o endereço do ADM.
2. Entre com a senha inicial fornecida no chat. Ela não é gravada em arquivo, nem publicada no GitHub.
3. Edite as informações e clique em **Salvar alterações**.
4. Confira a página pública; ela consulta a configuração no Cloudflare, e mantém a apresentação original como reserva quando não há conexão.
5. Na seção Segurança é possível alterar a senha (mínimo de 12 caracteres); a troca encerra todas as sessões.

## O que pode ser editado
- Nome, slogan, título e descrição inicial, WhatsApp.
- Preço inicial, produtos incluídos, adicionais, tratamento/criação de imagem, sinal e manutenção.
- Títulos, descrições e categorias dos serviços.
- Portfólio com projetos, imagens, links, indicação de acesso restrito e ordem dos cards.
- Logo e imagem Open Graph/WhatsApp, via upload de imagem.

## Segurança
- Autenticação executada **no servidor**, com verificação PBKDF2-SHA256 e segredo de assinatura no Cloudflare.
- Sessões assinadas expiram em 4 horas e podem ser revogadas com logout.
- Proteção contra tentativas de senha repetidas.
- Arquivos visuais são armazenados no D1 após compressão e validação de formato.
- O HTML do painel pode ser inspecionado publicamente, mas as ações de gravação exigem sessão válida; nenhum token administrativo aparece no frontend.

## Arquitetura
- Arquivos de origem do site: diretório raiz.
- Interface ADM: /admin/ (origem).
- Servidor: backend/worker.js.
- Banco: backend/schema.sql.
- Gerador de pacote Pages: backend/pages-site/sync.py.
- Configuração Cloudflare: backend/pages-site/wrangler.toml.
- A pasta backend/pages-site/public é gerada, não versionada.

## Implantação do ADM
No Lenovo, na pasta backend/pages-site, rode:

    python sync.py
    wrangler.cmd pages deploy public --project-name lz-web-studio-admin --branch main

O site público permanece no GitHub Pages. Para alterações no HTML, CSS ou scripts, utilize GitHub; para editar conteúdos e fotos, use o ADM.

## Observações
- O WhatsApp pode armazenar a miniatura anterior no cache. O ADM sugere um link com versão dinâmica para compartilhar.
- Não use o ADM para gerenciar o banco dos clientes Gato Preto e Cantinho: este painel foi criado exclusivamente para a LZ Web Studio.

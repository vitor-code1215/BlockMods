# BlockMods v3

Catálogo estático de mods para Minecraft, construído com HTML, CSS e JavaScript puro.

## Executar
Abra `index.html` no navegador. Para testar instalação PWA e cache offline, rode em um servidor local (ex.: extensão Live Server) ou publique em HTTPS.

## Publicar gratuitamente
1. Crie um repositório no GitHub e envie os arquivos desta pasta.
2. No repositório, abra **Settings → Pages**.
3. Escolha **Deploy from a branch**, selecione `main` e a pasta `/root`.
4. Aguarde o endereço público aparecer na página do GitHub Pages.

Alternativas: Netlify ou Cloudflare Pages, usando a pasta do projeto como site estático.

## Recursos
- Catálogo com busca em nome, descrição, categoria, versão e loader.
- Filtros de categoria e versão; ordenação por destaque, nota, nome ou novidades.
- Visualização em grade ou lista.
- Página compartilhável de cada mod usando rota `#mod/identificador`.
- Favoritos, avaliação local e compartilhamento.
- Painel local para adicionar e excluir os próprios mods.
- Exportação e importação de backup JSON dos mods adicionados.
- Layout responsivo, acessibilidade básica e respeito a `prefers-reduced-motion`.
- Manifest e service worker para instalação como PWA e cache do shell do site.

## Limitações importantes
Este é um **protótipo estático sem backend**. Mods adicionados, favoritos e avaliações são guardados no `localStorage` do navegador e não são compartilhados entre visitantes ou dispositivos. O painel de adição não tem autenticação nem moderação e não deve ser tratado como painel administrativo seguro. O service worker/PWA requer hospedagem HTTP(S), normalmente HTTPS.

Para tornar o BlockMods uma comunidade real, será necessário backend com autenticação, banco de dados, regras de segurança, moderação e armazenamento de imagens. Não coloque chaves secretas no JavaScript público.

## Downloads e direitos
Os links de exemplo levam a páginas de projetos no CurseForge ou Modrinth, não a arquivos hospedados pelo BlockMods. Antes de instalar, confira a versão do Minecraft, loader, dependências, licença e instruções do autor. Não reenvie arquivos de terceiros sem autorização.

Minecraft é uma marca da Mojang Studios/Microsoft. BlockMods é um projeto independente e não é afiliado a essas empresas.

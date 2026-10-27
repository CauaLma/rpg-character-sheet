# FICHA KNAVE • 201X

Site independente de fichas de RPG com tema branco, preto e vermelho (inspirado na imagem 201X / parede de tijolos).

## Abrir
- Baixe o ZIP e extraia.
- Abra `index.html` ou execute `python -m http.server 8000` na pasta e acesse http://localhost:8000 .
- Pode publicar a pasta inteira numa hospedagem estática (ex.: Netlify).

## Página inicial
- Título compacto FICHA KNAVE, grupos logo abaixo e seleção de personagens em destaque.
- Até **sete personagens por linha** em telas desktop amplas; com menos personagens, as cartas ficam centralizadas. Mais de sete passam para a linha seguinte.
- Arte principal **de corpo inteiro**, em `object-fit: contain`, sem corte automático do corpo.
- Botão `+ Personagem` continua acessível com a linha completa.
- Textos decorativos e layout de dashboard removidos.
- Estilo 201X, fundo de tijolos, tipografia estilo graffiti e detalhes vermelhos.

## Arte do Stand
- Clique no menu `⋯` de uma carta para **enviar/trocar a foto do personagem** e **enviar/trocar ou remover a foto do Stand**.
- Stand fica **atrás do personagem**, parcialmente visível.
- Passe o mouse sobre a aba vermelha **STAND** para trazer a arte à frente, ou clique para manter a prévia (e clique novamente para voltar).
- Quando não há Stand, a aba `+ STAND` abre o seletor de imagem.
- Dentro da ficha existem botões **PERSONAGEM** e **STAND** para trocar ambas as artes e a mesma prévia.
- PNG/WebP com fundo transparente funciona melhor para o Stand.
- As imagens são compactadas para WebP antes de salvar para economizar espaço.

## Personagens e grupos
- Criar, renomear, excluir e buscar fichas.
- Criar, renomear e excluir grupos.
- Mover personagens entre grupos sem perder informações.
- Copiar personagens para outros grupos com conteúdo independente.
- Todos os dados da ficha (atributos, inventário, ordem dos slots, descrições e grimório) continuam sendo editados pelos **HTML e JavaScript originais do Nutripro II**. O tema 201X da ficha é separado em `knave-theme.css`.

## Arquivos
```
index.html             <- Tela principal
library.css            <- Visual 201X da biblioteca
library.js             <- Cartas, grupos, upload e preview do Stand
ficha_nutripro.html    <- Ficha original Nutripro II
knave-theme.css        <- Novo visual 201X para a ficha (sem modificar regras)
sheet-adapter.js       <- Integração com a ficha, retratos, Stand, voltar e backup
storage.js             <- Fichas, grupos, Stand e dados salvos no navegador
```

## Importante: salvamento local
Esta versão usa `localStorage` no **navegador atual**, sem login nem sincronização entre dispositivos. Uma mudança de domínio pode criar outro armazenamento; a limpeza de dados do site pode apagar as fichas. Utilize a função **Exportar** e faça backup JSON regularmente.

## Validação
Sintaxe dos scripts, integridade das ligações entre arquivos e presença das funções foram verificadas. Ainda **não foi possível realizar teste visual real em navegador**; ajuste de encaixe foi dimensionado em CSS por viewport e breakpoints.

## PNG e transparência — correção importante
- **Nunca remover o fundo automaticamente.** A transparência já presente no PNG é respeitada exatamente.
- As imagens são carregadas e armazenadas diretamente com FileReader, sem converter em WebP, recortar, modificar alfa, aplicar canvas ou apagar pixels.
- A foto aparece centralizada, com object-fit: contain, mantendo o corpo inteiro se ele existir na imagem.
- Caso uma imagem já tenha sido salva após a versão anterior ter apagado partes dela, é necessário reenviar o PNG original pelo menu ⋯ → Foto do personagem (ou restaurar um backup anterior). A edição destrutiva não pode ser revertida sem o original.
- Fotos muito grandes podem exceder a cota localStorage; nesse caso o site avisa e não substitui a imagem existente.

## Caso a ficha ainda mostre uma faixa preta no personagem
A foto original enviada pode ter canal alfa correto, mas versões anteriores do site salvaram JPEG/WebP com preto embutido na imagem. O CSS não consegue recuperar informação de transparência apagada. Neste caso: abra a carta, clique em **⋯ → Reenviar PNG original** e selecione o PNG transparente original (sem fazer nenhuma edição). A nova versão salva o arquivo bruto via FileReader, preservando o canal alfa. O restante da ficha não é alterado.

# FICHA KNAVE — Biblioteca de personagens

Uma biblioteca visual de RPG, não um dashboard corporativo.

## O que abre no ZIP

Abra **index.html** na raiz do projeto: é a nova tela **FICHA KNAVE**,
com título central, grupos logo abaixo e cards grandes para os personagens.
Não existe sidebar ou tela de indicadores.

Clique no retrato ou nome de um personagem para entrar na
**ficha original do Nutripro II**, com animação de transição.
Dentro da ficha, use **← FICHAS** para retornar suavemente à biblioteca.

## Organização

- **+ Grupo** cria um grupo de personagens logo abaixo do título.
- Clique em um grupo para filtrar a galeria.
- No menu ⋮ ao lado de cada grupo: renomear ou excluir grupo.
- Para criar personagem, clique na carta **Novo personagem**.
- Cada carta possui um menu ⋯ com **copiar, mover, renomear e excluir**.
- Copiar cria uma ficha independente; mover preserva os dados.
- Busca e exportação/importação de backup estão disponíveis discretamente.

## Ficha original preservada

O arquivo **ficha_nutripro.html** foi mantido com seu HTML, CSS e JavaScript
de atributos, inventário, slots, cálculos, descrições, grimório e regras originais.

Dois complementos tornam o site independente do servidor VTT:

- **storage.js**: implementa localmente as chamadas de salvamento da ficha,
  com dados próprios para cada personagem;
- **sheet-adapter.js**: retrato do personagem, backup individual,
  transição para voltar à biblioteca.

A tela inicial usa **library.css** e **library.js**, separados do código da ficha.

## Executar

1. Extraia o ZIP.
2. Para uma experiência mais confiável, execute um servidor HTTP estático
   dentro da pasta extraída, por exemplo: \`python -m http.server 8000\`.
3. Acesse **http://localhost:8000/**.

Você também pode publicar os arquivos da raiz numa hospedagem estática,
como o Netlify, sem precisar de um servidor Node ou SQLite.

## IMPORTANTE: persistência

Esta versão salva as fichas no **localStorage** do navegador.
Não existe login ou sincronização entre dispositivos. Ao limpar os
dados do navegador ou mudar a origem do site, as fichas não migram
automaticamente. Faça backup JSON regularmente.

## Verificação

Foram verificadas a presença dos arquivos, a integridade básica da
navegação, os pontos de integração da ficha e a sintaxe dos scripts.
Ainda não foi possível executar teste visual completo num navegador.

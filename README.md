# NUTRIPRO II — Site independente de fichas

A **página inicial** deste ZIP é \`index.html\` — a biblioteca de personagens com grupos.
Ao clicar em "Abrir ficha", o usuário acessa \`ficha_nutripro.html\`.

**Esta entrega não é a ficha de investigador antiga.** O arquivo de ficha é o HTML,
CSS e JavaScript do Nutripro II fornecido pelo usuário, com duas inclusões mínimas
para operar sem o servidor VTT:

- \`storage.js\`: simula as rotas /api/sheets e /api/token que a ficha original utiliza,
  salvando seus dados no navegador por personagem.
- \`sheet-adapter.js\`: restaura a possibilidade de escolher retrato e permite
  exportar backup de uma única ficha.

## Como usar

1. Extraia o ZIP.
2. Abra o arquivo **index.html** na raiz extraída.
3. Crie grupos e personagens e clique em **Abrir ficha**.

Para maior confiabilidade do armazenamento, abra o site usando um servidor estático
(por exemplo, dentro da pasta extraída, execute \`python -m http.server 8000\`
e acesse http://localhost:8000/), ou publique os arquivos da raiz em uma
hospedagem de sites estáticos, como Netlify.

## O que existe nesta versão

- Tela de biblioteca com grupos, busca e contagens.
- Criar, renomear, excluir e abrir personagens.
- Criar, renomear e excluir grupos (fichas de grupos excluídos vão para Sem grupo).
- Mover personagens entre grupos.
- Copiar personagem para qualquer grupo criando dados independentes.
- **Ficha real do Nutripro II** com os atributos, inventário, slots,
  cálculos, descrições, grimório, controles, modais e ordenação originais.
- Salvamento automático isolado por personagem, através da lógica já presente na ficha.
- Imagens de personagens, compactadas para armazenar localmente.
- Exportação/importação de backup JSON da biblioteca completa.
- Exportação de uma ficha dentro da própria ficha.

## Arquivos principais

\`\`\`
index.html            ← ABRA ESTE
ficha_nutripro.html   ← ficha original completa
library.css           ← estilo da biblioteca
library.js            ← operações da biblioteca e grupos
storage.js            ← salvamento independente do VTT
sheet-adapter.js      ← retrato e backup de uma ficha
README.md
\`\`\`

## Importante sobre os dados

Esta versão usa armazenamento local do navegador (\`localStorage\`) **sem banco online**.
Fichas criadas num dispositivo não aparecem automaticamente em outro.
O local onde o site é aberto (domínio/origem) também importa para o armazenamento.
Limpar dados do site pode apagar as fichas.

**Faça backup JSON regularmente** para poder migrar ou recuperar os personagens.
Para colaboração simultânea, login e armazenamento online, é necessária a adição
de um backend. Nenhuma alteração foi feita no VTT original ou na branch \`main\`.

## Nota sobre verificação

Foram conferidos a presença dos arquivos, sintaxe JavaScript e operações de
armazenamento/cópia/carregamento. Não foi realizado teste visual em um navegador.

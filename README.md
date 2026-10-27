# Nutripro II — Biblioteca Independente de Fichas

Este projeto aproveita **integralmente a ficha original** enviada como \`ficha_nutripro.html\` (HTML, CSS e JavaScript originais, inclusive os cálculos de atributos, PA, PV, nível, inventário, arrastar/ordenar slots, links de equipamentos, editor rico, grimório e autosave).

A única alteração feita dentro do arquivo da ficha foi carregar dois scripts complementares:
- \`storage.js\`, antes da lógica original: mantém as mesmas chamadas \`/api/sheets/:id\` e \`/api/token/:id\`, mas usa o armazenamento local do navegador em vez do servidor do VTT;
- \`sheet-adapter.js\`, ao fim: permite escolher retrato e exportar um backup individual.

A biblioteca inicial é nova e independente: não copia o CSS da referência de deploy.

## Arquivos

- \`index.html\`: tela inicial / biblioteca;
- \`library.css\`: visual da tela inicial;
- \`library.js\`: gerenciador de personagens e grupos;
- \`storage.js\`: armazenamento e compatibilidade com a ficha original;
- \`ficha_nutripro.html\`: ficha original + inclusão de scripts de integração;
- \`sheet-adapter.js\`: imagem de retrato e backup da ficha.

## Como executar

1. Baixe e extraia o repositório/ZIP.
2. Abra a pasta **nutripro-site**.
3. Preferencialmente rode um servidor estático nessa pasta:
   \`\`\`bash
   python -m http.server 8000
   \`\`\`
4. Abra \`http://localhost:8000/\` no navegador.

Se não tiver Python, publique **a pasta nutripro-site** em qualquer hospedagem estática (por exemplo, arrastando a pasta para um deploy manual no Netlify). Abrir \`index.html\` diretamente pelo explorador também pode funcionar, mas o comportamento de armazenamento em URLs \`file://\` depende do navegador.

## Funções

- Criar personagem, abrir e editar ficha original;
- Criar, renomear e excluir grupos;
- Mover ficha para qualquer grupo, mantendo os dados;
- Copiar ficha para outro grupo (cópia com ID e dados independentes);
- Renomear, buscar e excluir personagens;
- Autosalvar campos da ficha através da lógica original;
- Salvar retrato escolhido pelo usuário;
- Exportar e importar **backup JSON completo**, incluindo grupos, fichas, inventários, editores e retratos;
- Exportar backup individual dentro da ficha.

## IMPORTANTE — persistência

Esta versão usa **localStorage no navegador**. Os dados são locais ao navegador e ao endereço do site. Isso significa:
- **não existe login nem sincronização entre dispositivos** nesta versão;
- limpar os dados do site no navegador pode apagar as fichas;
- mudar de domínio/endereço não migra dados automaticamente;
- use **Exportar backup** regularmente e importe o backup no novo endereço se precisar migrar;
- fotos muito grandes podem ultrapassar a cota do navegador; as imagens escolhidas são comprimidas.

Não é preciso executar o servidor original do VTT para a ficha funcionar: as APIs que ela utiliza foram adaptadas localmente. Para compartilhamento em tempo real entre jogadores e salvamento em servidor, seria necessária uma segunda etapa de backend.

## Originalidade da ficha

O arquivo original foi preservado nas suas seções, funcionalidades e estilos, em vez de ser redesenhado. Todas as suas expressões de cálculo e rotinas de manipulação continuam no HTML da ficha, e a biblioteca gerencia apenas a identificação, o grupo e a persistência de cada personagem.

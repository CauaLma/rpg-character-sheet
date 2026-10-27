/* FICHA KNAVE • Stand independente e editores Obsidian (texto ↔ formatado). */
(function(){
'use strict';
const S=window.NutriproStore,id=new URLSearchParams(location.search).get('id');
if(!S||!id)return;
const $=x=>document.getElementById(x);
const render=text=>typeof window.itemMarkdownToHtml==='function'?window.itemMarkdownToHtml(text):'';
const sanitize=text=>typeof window.itemSanitizeHtml==='function'?window.itemSanitizeHtml(text):'';
const editor=$('itemDetailEditor'),modal=$('itemDetailModal');
const bar=modal?.querySelector('.item-detail-toolbar');
if(!editor||!modal||!bar)return;
function htmlToMarkdown(html){
 const root=document.createElement('div');root.innerHTML=sanitize(html||'');
 const tick=String.fromCharCode(96),fence=tick.repeat(3);
 function walk(node){
  if(node.nodeType===Node.TEXT_NODE)return node.nodeValue||'';
  if(node.nodeType!==Node.ELEMENT_NODE)return '';
  const tag=node.tagName,children=()=>Array.from(node.childNodes).map(walk).join('');
  switch(tag){
   case 'BR':return '\n';
   case 'B':case 'STRONG':return '**'+children()+'**';
   case 'I':case 'EM':return '*'+children()+'*';
   case 'S':case 'DEL':return '~~'+children()+'~~';
   case 'MARK':return '=='+children()+'==';
   case 'U':return '<u>'+children()+'</u>';
   case 'CODE':return node.parentElement?.tagName==='PRE'?children():tick+children()+tick;
   case 'PRE':return '\n'+fence+'\n'+node.textContent+'\n'+fence+'\n\n';
   case 'H1':case 'H2':case 'H3':case 'H4':case 'H5':case 'H6':return '#'.repeat(+tag[1])+' '+children().trim()+'\n\n';
   case 'HR':return '\n---\n\n';
   case 'IMG':return '!['+(node.getAttribute('alt')||'')+']('+(node.getAttribute('src')||'')+')';
   case 'A':return '['+children()+']('+(node.getAttribute('href')||'')+')';
   case 'SPAN':
     if(node.classList.contains('internal-link')){
      const target=node.getAttribute('title')||children();
      return '[['+target+(target===children()?'':'|'+children())+']]';
     }
     return children();
   case 'BLOCKQUOTE':return children().trim().split('\n').map(l=>'> '+l).join('\n')+'\n\n';
   case 'UL':case 'OL':
     return Array.from(node.children).map((li,i)=>{
       const input=li.querySelector('input[type="checkbox"]');
       const text=Array.from(li.childNodes).filter(n=>n!==input).map(walk).join('').trim();
       if(input)return '- ['+(input.checked?'x':' ')+'] '+text;
       return (tag==='OL'?(i+1)+'. ':'- ')+text;
     }).join('\n')+'\n\n';
   case 'LI':return children();
   case 'TABLE':{
     const rows=Array.from(node.querySelectorAll('tr')).map(tr=>
      Array.from(tr.querySelectorAll('th,td')).map(cell=>cell.textContent.trim().replace(/\|/g,'\\|')));
     if(!rows.length)return '';
     return '| '+rows[0].join(' | ')+' |\n| '+rows[0].map(()=>'---').join(' | ')+' |\n'+
       rows.slice(1).map(row=>'| '+row.join(' | ')+' |').join('\n')+'\n\n';
   }
   case 'ASIDE':
     if(node.classList.contains('callout')){
      const title=node.querySelector('.callout-title')?.textContent||'Nota';
      const body=node.querySelector('.callout-content');
      return '> [!note] '+title+'\n'+(body?.textContent||'').split('\n').map(l=>'> '+l).join('\n')+'\n\n';
     }
     return children().trim()+'\n\n';
   case 'P':case 'DIV':case 'SECTION':return children().trim()+'\n\n';
   default:return children();
  }
 }
 return Array.from(root.childNodes).map(walk).join('').replace(/\n{3,}/g,'\n\n').trim();
}
function ensureItemRaw(item){
 let field=$('npItemMarkdown_'+item);
 if(!field){
  field=document.createElement('textarea');
  field.id='npItemMarkdown_'+item;field.hidden=true;field.setAttribute('aria-hidden','true');
  document.body.appendChild(field);
 }
 return field;
}
// Os campos Markdown ficam prontos antes do carregarDados() original.
document.querySelectorAll('#items .item,#itemsExtras .item').forEach(card=>
 ensureItemRaw(card.id.replace(/^item/,'')));

const source=document.createElement('textarea');
source.className='knave-md-source';source.tabIndex=0;source.spellcheck=false;
source.placeholder='# Nome do item\n\nUse **negrito**, *itálico*, listas, [[links]] e > [!note] avisos.';
const preview=document.createElement('div');
preview.className='knave-md-preview';preview.tabIndex=0;
const toggle=document.createElement('button');
toggle.className='knave-md-toggle';toggle.type='button';
bar.replaceChildren(toggle);
const shell=modal.querySelector('.item-detail-shell');
shell.insertBefore(source,editor);shell.insertBefore(preview,editor);
let active=null,mode='preview',changed=false;
function setItemMode(value){
 mode=value;
 source.hidden=value!=='source';preview.hidden=value==='source';
 toggle.textContent=value==='source'?'◉ Visualizar formatado':'✎ Editar texto';
 toggle.setAttribute('aria-pressed',String(value==='source'));
 if(value==='preview')preview.innerHTML=sanitize(editor.innerHTML);
 else requestAnimationFrame(()=>source.focus({preventScroll:true}));
}
const oldOpen=window.abrirFakeModal;
if(typeof oldOpen==='function')window.abrirFakeModal=function(item){
 oldOpen(item);
 active=item;changed=false;
 const markdown=ensureItemRaw(item).value;
 source.value=markdown||htmlToMarkdown(editor.innerHTML);
 if(markdown)editor.innerHTML=render(markdown);
 setItemMode('preview');
};
toggle.addEventListener('click',()=>{if(active)setItemMode(mode==='preview'?'source':'preview');});
source.addEventListener('input',()=>{
 if(!active)return;
 changed=true;
 ensureItemRaw(active).value=source.value;
 editor.innerHTML=render(source.value);
 preview.innerHTML=editor.innerHTML;
 if(typeof window.itemAgendarSalvamento==='function')window.itemAgendarSalvamento();
});
source.addEventListener('keydown',e=>e.stopPropagation());
const oldClose=window.fecharFakeModal;
if(typeof oldClose==='function')window.fecharFakeModal=async function(...args){
 if(changed&&active)ensureItemRaw(active).value=source.value;
 active=null;changed=false;
 return oldClose(...args);
};

// Outra ficha, inteiramente dedicada ao Stand: nome e descrição Obsidian.
const stand=document.createElement('section');
stand.id='npStandSheet';stand.className='np-stand-sheet';stand.hidden=true;
stand.innerHTML=[
 '<header class="np-stand-header">',
 '<button type="button" class="np-stand-back">← PERSONAGEM</button>',
 '<strong>201X / STAND</strong>',
 '<small class="np-stand-save">SALVO</small></header>',
 '<div class="np-stand-layout">',
 '<aside class="np-stand-portrait"><img class="np-stand-art" alt="Arte do Stand" hidden>',
 '<div class="np-stand-empty">✕<small>STAND</small></div></aside>',
 '<div class="np-stand-fields">',
 '<label for="npStandNome">NOME DO STAND</label>',
 '<input id="npStandNome" class="np-stand-name" placeholder="Nome do Stand..." autocomplete="off">',
 '<div class="np-stand-writing">',
 '<div class="knave-stand-toolbar"><strong>DESCRIÇÃO / HABILIDADES</strong>',
 '<button type="button" class="knave-md-toggle np-stand-toggle">✎ Editar texto</button></div>',
 '<div class="np-stand-preview knave-md-preview" tabindex="0"></div>',
 '<textarea class="np-stand-source knave-md-source" tabindex="0" spellcheck="false" hidden',
 ' placeholder="# Descrição\n\n## Habilidades\n\nEscreva usando o Markdown do Obsidian..."></textarea>',
 '<textarea id="npStandMarkdown" hidden aria-hidden="true"></textarea>',
 '</div></div></div>'
].join('');
document.body.appendChild(stand);
const standName=$('npStandNome'),standData=$('npStandMarkdown');
const standSource=stand.querySelector('.np-stand-source');
const standPreview=stand.querySelector('.np-stand-preview');
const standToggle=stand.querySelector('.np-stand-toggle');
const art=stand.querySelector('.np-stand-art');
const empty=stand.querySelector('.np-stand-empty');
const saveState=stand.querySelector('.np-stand-save');
let standMode='preview',saveTimer;
function setStandMode(value){
 standMode=value;
 standSource.hidden=value!=='source';standPreview.hidden=value==='source';
 standToggle.textContent=value==='source'?'◉ Visualizar formatado':'✎ Editar texto';
 standToggle.setAttribute('aria-pressed',String(value==='source'));
 if(value==='preview')standPreview.innerHTML=render(standData.value||'');
 else requestAnimationFrame(()=>standSource.focus({preventScroll:true}));
}
function saveStandSoon(){
 clearTimeout(saveTimer);saveState.textContent='SALVANDO…';
 saveTimer=setTimeout(async()=>{
  if(typeof window.salvarDados==='function')await window.salvarDados();
  saveState.textContent='SALVO';
 },500);
}
standSource.addEventListener('input',()=>{
 standData.value=standSource.value;
 standPreview.innerHTML=render(standData.value);
 saveStandSoon();
});
standName.addEventListener('input',saveStandSoon);
standToggle.addEventListener('click',()=>setStandMode(standMode==='preview'?'source':'preview'));
async function closeStand(){
 clearTimeout(saveTimer);
 if(typeof window.salvarDados==='function')await window.salvarDados();
 stand.hidden=true;document.body.classList.remove('np-stand-active');
}
stand.querySelector('.np-stand-back').addEventListener('click',closeStand);
window.KnaveStandSheet={
 open(){
  const picture=S.get(id)?.standPortrait||'';
  art.hidden=!picture;empty.hidden=!!picture;
  if(picture)art.src=picture;else art.removeAttribute('src');
  standSource.value=standData.value||'';
  setStandMode('preview');
  stand.hidden=false;document.body.classList.add('np-stand-active');
  window.scrollTo(0,0);
 },
 close:closeStand
};
})();
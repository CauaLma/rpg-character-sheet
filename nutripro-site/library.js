(function(){
'use strict';
const S=window.NutriproStore;
let filter='all',query='',transferMode='move',transferId='';
const $=id=>document.getElementById(id);
const esc=str=>String(str??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const initials=name=>String(name||'NP').trim().split(/\s+/).slice(0,2).map(s=>s.charAt(0)).join('').toUpperCase();
const getGroup=(db,id)=>db.groups.find(g=>g.id===id);
const groupName=(db,id)=>getGroup(db,id)?.name||'Sem grupo';
const sheetUrl=c=>'ficha_nutripro.html?id='+encodeURIComponent(c.id)+'&name='+encodeURIComponent(c.name);
let toastTimer;
function toast(msg){
  const t=$('toast');t.textContent=msg;t.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),2800);
}
function allOptions(selected){
  const db=S.read();
  return '<option value="">Sem grupo</option>'+db.groups.map(g=>
    '<option value="'+esc(g.id)+'" '+(selected===g.id?'selected':'')+'>'+esc(g.name)+'</option>').join('');
}
function groupFilter(db){
  if(filter==='all')return db.characters;
  if(filter==='ungrouped')return db.characters.filter(c=>!c.groupId);
  return db.characters.filter(c=>c.groupId===filter);
}
function draw(){
  const db=S.read(),currentGroup=getGroup(db,filter);
  if(filter!=='all'&&filter!=='ungrouped'&&!currentGroup)filter='all';
  const filterTitle=filter==='all'?'Todos os personagens':filter==='ungrouped'?'Sem grupo':currentGroup?.name||'Todos os personagens';
  $('allCount').textContent=db.characters.length;
  $('ungroupedCount').textContent=db.characters.filter(c=>!c.groupId).length;
  $('statCharacters').textContent=db.characters.length;
  $('statGroups').textContent=db.groups.length;
  $('breadcrumbGroup').textContent=filterTitle.toUpperCase();
  $('sectionTitle').textContent=filterTitle;
  $('viewTitle').innerHTML=filter==='all'?'Seus personagens<span>.</span>':esc(filterTitle)+'<span>.</span>';
  document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b.dataset.filter===filter));
  $('groupList').innerHTML=db.groups.map(g=>{
    const count=db.characters.filter(c=>c.groupId===g.id).length;
    return '<div class="group-row"><button class="group-entry '+(filter===g.id?'selected':'')+'" data-filter="'+esc(g.id)+'">'+
    '<span class="group-icon">▱</span><span>'+esc(g.name)+'</span><em>'+count+'</em></button>'+
    '<button class="group-options" data-group-options="'+esc(g.id)+'" title="Renomear ou excluir grupo">⋮</button></div>';
  }).join('')||'<p style="color:#6e8571;font-size:11px;padding-left:12px">Nenhum grupo criado</p>';
  let arr=groupFilter(db).filter(c=>c.name.toLowerCase().includes(query.toLowerCase()));
  arr.sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
  $('statVisible').textContent=arr.length;
  const grid=$('characterGrid');
  grid.innerHTML=arr.map(c=>{
    const portrait=c.portrait?'<img alt="" loading="lazy" src="'+esc(c.portrait)+'">':
      '<div class="initials">'+esc(initials(c.name))+'</div>';
    const level=c.dados&&c.dados.nivel ? ' • Nível '+esc(c.dados.nivel):'';
    return '<article class="character-card" data-id="'+esc(c.id)+'">'+
      '<div class="card-portrait">'+portrait+'<span class="tag">'+esc(groupName(db,c.groupId))+'</span></div>'+
      '<div class="card-main"><h3 class="card-name">'+esc(c.name)+'</h3>'+
      '<div class="card-meta">FICHA NUTRIPRO II'+level+'</div></div>'+
      '<div class="card-actions">'+
      '<button class="open" data-action="open" title="Abrir ficha">Abrir ficha ↗</button>'+
      '<button data-action="copy" title="Copiar ficha">Copiar</button>'+
      '<button data-action="move" title="Mover de grupo">Mover</button>'+
      '<button data-action="rename" title="Renomear">✎</button>'+
      '<button class="danger" data-action="delete" title="Excluir ficha">×</button>'+
      '</div></article>';
  }).join('');
  $('emptyState').hidden=arr.length!==0;grid.hidden=arr.length===0;
}
function newCharacter(){
  $('characterName').value='';
  $('characterGroup').innerHTML=allOptions(filter==='all'||filter==='ungrouped'?'':filter);
  $('characterDialog').showModal();$('characterName').focus();
}
function createGroup(){
  const name=prompt('Nome do novo grupo:');
  if(name===null)return;
  if(!name.trim())return toast('Informe um nome de grupo.');
  try{const g=S.createGroup(name);filter=g.id;draw();toast('Grupo criado.');}catch(e){toast(e.message);}
}
function groupActions(id){
  const db=S.read(),g=getGroup(db,id);if(!g)return;
  const action=prompt('Grupo: '+g.name+'\nDigite R para renomear ou E para excluir:','R');
  if(action===null)return;
  if(action.toUpperCase()==='R'){
    const name=prompt('Novo nome do grupo:',g.name);
    if(name&&name.trim()){S.renameGroup(id,name);draw();toast('Grupo renomeado.');}
  } else if(action.toUpperCase()==='E'){
    if(confirm('Excluir o grupo '+g.name+'?\nAs fichas NÃO serão apagadas: irão para Sem grupo.')){
      S.deleteGroup(id);filter='ungrouped';draw();toast('Grupo excluído. As fichas foram preservadas.');
    }
  }
}
function openTransfer(id,mode){
  const c=S.get(id);if(!c)return;
  transferId=id;transferMode=mode;
  $('transferKicker').textContent=mode==='copy'?'DUPLICAR REGISTRO':'ORGANIZAR REGISTRO';
  $('transferTitle').textContent=mode==='copy'?'Copiar personagem':'Mover personagem';
  $('transferInfo').textContent=c.name+' — '+(mode==='copy'?'a cópia terá dados independentes.':'todos os dados serão preservados.');
  $('targetGroup').innerHTML=allOptions(c.groupId);
  $('transferConfirm').textContent=mode==='copy'?'Criar cópia':'Mover ficha';
  $('transferDialog').showModal();
}
function performAction(action,id){
  const c=S.get(id);if(!c)return toast('Personagem não encontrado.');
  if(action==='open'){location.href=sheetUrl(c);return;}
  if(action==='copy'||action==='move'){openTransfer(id,action);return;}
  if(action==='rename'){
    const name=prompt('Novo nome do personagem:',c.name);
    if(name&&name.trim()){S.rename(id,name);draw();toast('Nome atualizado.');}
    return;
  }
  if(action==='delete'&&confirm('Excluir definitivamente a ficha de '+c.name+'?\nEssa ação só pode ser desfeita com um backup.')){
    S.remove(id);draw();toast('Ficha excluída.');
  }
}
function downloadBackup(){
  const blob=new Blob([JSON.stringify(S.read(),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='Nutripro-Fichas-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
  toast('Backup exportado.');
}
async function restoreBackup(file){
  if(!file)return;
  if(!confirm('Importar este backup vai SUBSTITUIR a biblioteca atual. Deseja continuar?'))return;
  try{
    const contents=await file.text();
    const data=JSON.parse(contents);
    S.importDB(data);filter='all';query='';$('searchInput').value='';
    draw();toast('Backup importado com sucesso.');
  }catch(e){alert('Não foi possível importar o backup: '+e.message);}
}
$('newGroupBtn').addEventListener('click',createGroup);
$('newCharacterBtn').addEventListener('click',newCharacter);
$('emptyCreateBtn').addEventListener('click',newCharacter);
$('groupList').addEventListener('click',e=>{
  const b=e.target.closest('[data-group-options]');if(b){groupActions(b.dataset.groupOptions);return;}
  const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;draw();}
});
document.querySelectorAll('.sidebar > [data-filter]').forEach(b=>b.addEventListener('click',()=>{
  filter=b.dataset.filter;draw();
}));
$('characterGrid').addEventListener('click',e=>{
  const b=e.target.closest('button[data-action]');if(!b)return;
  const card=b.closest('[data-id]');if(card)performAction(b.dataset.action,card.dataset.id);
});
$('searchInput').addEventListener('input',e=>{query=e.target.value.trim();draw();});
$('createForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=$('characterName').value.trim();if(!name)return;
  try{
    const c=S.create(name,$('characterGroup').value||null);
    $('characterDialog').close();location.href=sheetUrl(c);
  }catch(err){alert('Não foi possível criar: '+err.message);}
});
$('transferForm').addEventListener('submit',e=>{
  e.preventDefault();
  const target=$('targetGroup').value||null;
  try{
    if(transferMode==='copy')S.duplicate(transferId,target);
    else S.move(transferId,target);
    $('transferDialog').close();draw();toast(transferMode==='copy'?'Cópia criada.':'Personagem movido.');
  }catch(err){alert('Falha ao organizar personagem: '+err.message);}
});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>
  $(b.dataset.close)?.close()));
$('backupBtn').addEventListener('click',downloadBackup);
$('restoreBtn').addEventListener('click',()=>$('backupInput').click());
$('backupInput').addEventListener('change',async e=>{await restoreBackup(e.target.files[0]);e.target.value='';});
window.addEventListener('storage',e=>{if(e.key===S.KEY)draw();});
window.addEventListener('nutripro:changed',draw);
draw();
})();
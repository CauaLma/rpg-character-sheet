(function(){
'use strict';
const S=window.NutriproStore;
if(!S){console.error('NutriproStore não carregou.');return;}
let filter='all',query='',transferMode='move',transferId='',navigating=false;
const $=id=>document.getElementById(id);
const esc=str=>String(str??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const initials=name=>String(name||'K').trim().split(/\s+/).slice(0,2).map(p=>p.charAt(0)).join('').toUpperCase();
const getGroup=(db,id)=>db.groups.find(g=>g.id===id);
const groupName=(db,id)=>getGroup(db,id)?.name||'Sem grupo';
const urlFor=c=>'ficha_nutripro.html?id='+encodeURIComponent(c.id)+'&name='+encodeURIComponent(c.name);
const safePortrait=s=>{
  const value=String(s||'').trim();
  return /^(data:image\/(png|jpeg|webp|gif);base64,|https:\/\/)/i.test(value)?value:'';
};
let toastTimer;
function notify(message){
 const el=$('toast');el.textContent=message;el.classList.add('visible');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3100);
}
function groupOptions(selected){
 const db=S.read();
 return '<option value=""'+(!selected?' selected':'')+'>Sem grupo</option>'+
 db.groups.map(g=>'<option value="'+esc(g.id)+'"'+(selected===g.id?' selected':'')+'>'+esc(g.name)+'</option>').join('');
}
function byGroup(db){
 return db.characters.filter(c=>filter==='all'||(filter==='ungrouped'?!c.groupId:c.groupId===filter));
}
function groupCard(g,current){
 return '<div class="group-holder"><button type="button" class="group-chip'+(current===g.id?' active':'')+
 '" data-filter="'+esc(g.id)+'">'+esc(g.name)+'</button>'+
 '<details class="group-menu"><summary title="Opções do grupo '+esc(g.name)+'" aria-label="Opções do grupo '+esc(g.name)+'">⋮</summary>'+
 '<div class="group-actions-menu"><button type="button" data-group-action="rename" data-group-id="'+esc(g.id)+'">✎ Renomear grupo</button>'+
 '<button type="button" class="danger" data-group-action="delete" data-group-id="'+esc(g.id)+'">× Excluir grupo</button></div></details></div>';
}
function characterCard(c,db,index){
 const portrait=safePortrait(c.portrait);
 const portraitPart=portrait?'<img loading="lazy" alt="Retrato de '+esc(c.name)+'" src="'+esc(portrait)+'">':
 '<div class="no-portrait"><span class="monogram">'+esc(initials(c.name))+'</span><span class="monogram-ornament">❧</span></div>';
 return '<article class="character-card" data-id="'+esc(c.id)+'" style="animation-delay:'+Math.min(index*45,450)+'ms">'+
 '<button class="character-image" type="button" data-action="open" aria-label="Abrir ficha de '+esc(c.name)+'">'+portraitPart+
 '<span class="open-hint">✦ ABRIR FICHA ✦</span></button>'+
 '<i class="frame-corner tl"></i><i class="frame-corner tr"></i>'+
 '<i class="frame-corner bl"></i><i class="frame-corner br"></i>'+
 '<details class="card-menu"><summary aria-label="Mais opções para '+esc(c.name)+'" title="Opções">⋯</summary>'+
 '<div class="card-actions-menu">'+
 '<button type="button" data-action="copy">✧ Fazer uma cópia</button>'+
 '<button type="button" data-action="move">↗ Mover para grupo</button>'+
 '<button type="button" data-action="rename">✎ Renomear</button>'+
 '<button type="button" class="danger" data-action="delete">× Excluir ficha</button></div></details>'+
 '<div class="card-info"><button type="button" class="card-name" data-action="open" title="Abrir ficha">'+esc(c.name)+'</button>'+
 '<span class="card-group">'+esc(groupName(db,c.groupId))+'</span></div></article>';
}
function draw(){
 const db=S.read();
 if(filter!=='all'&&filter!=='ungrouped'&&!getGroup(db,filter))filter='all';
 const title=filter==='all'?'Seus personagens':filter==='ungrouped'?'Sem grupo':getGroup(db,filter)?.name||'Personagens';
 const list=$('groupList');
 list.innerHTML=db.groups.map(g=>groupCard(g,filter)).join('');
 document.querySelectorAll('.groups [data-filter]').forEach(btn=>btn.classList.toggle('active',btn.dataset.filter===filter));
 $('allCount').textContent=db.characters.length;
 $('sectionTitle').textContent=title;
 let arr=byGroup(db).filter(c=>String(c.name||'').toLowerCase().includes(query.toLowerCase()));
 arr.sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
 $('visibleCount').textContent=arr.length;
 const showCreate=!query;
 let markup=arr.map((c,i)=>characterCard(c,db,i)).join('');
 if(showCreate)markup+='<button type="button" class="create-card" id="newCharacterCard">'+
 '<span class="create-symbol">+</span><strong>Novo personagem</strong><small>Uma aventura começa aqui</small></button>';
 $('characterGrid').innerHTML=markup;
 $('emptyState').hidden=arr.length!==0 || showCreate;
}
function createGroup(){
 const name=prompt('Nome do novo grupo:');
 if(name===null)return;
 if(!name.trim())return notify('Informe um nome para o grupo.');
 try{const g=S.createGroup(name);filter=g.id;draw();notify('Novo grupo criado.');}
 catch(e){notify('Não foi possível criar o grupo: '+e.message);}
}
function groupAction(action,id){
 const g=getGroup(S.read(),id);
 if(!g)return;
 if(action==='rename'){
   const name=prompt('Novo nome do grupo:',g.name);
   if(name && name.trim()){S.renameGroup(id,name);draw();notify('Grupo renomeado.');}
 }else if(action==='delete'){
   if(confirm('Excluir o grupo "'+g.name+'"?\nOs personagens NÃO serão apagados. Eles ficarão em "Sem grupo".')){
     S.deleteGroup(id);filter='ungrouped';draw();notify('Grupo excluído sem apagar personagens.');
   }
 }
}
function openCreate(){
 $('characterName').value='';
 $('characterGroup').innerHTML=groupOptions(filter==='all'||filter==='ungrouped'?null:filter);
 $('characterDialog').showModal();
 $('characterName').focus();
}
function openSheet(c){
 if(navigating)return;
 navigating=true;
 $('transitionName').textContent=c.name;
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduced){location.href=urlFor(c);return;}
 document.body.classList.add('leaving');
 setTimeout(()=>{location.href=urlFor(c);},520);
}
function openTransfer(id,mode){
 const c=S.get(id);if(!c)return;
 transferId=id;transferMode=mode;
 $('transferKicker').textContent=mode==='copy'?'UMA NOVA VERSÃO':'MUDANÇA DE GRUPO';
 $('transferTitle').textContent=mode==='copy'?'Copiar personagem':'Mover personagem';
 $('transferInfo').textContent=mode==='copy'?'Uma nova ficha de '+c.name+' com os mesmos dados, mas independente da original.':
 'Escolha para onde '+c.name+' irá. Nenhuma informação será perdida.';
 $('targetGroup').innerHTML=groupOptions(c.groupId);
 $('transferConfirm').innerHTML=mode==='copy'?'Criar cópia <span>→</span>':'Mover ficha <span>→</span>';
 $('transferDialog').showModal();
}
function cardAction(action,id){
 const c=S.get(id);if(!c)return notify('Personagem não encontrado.');
 if(action==='open'){openSheet(c);return;}
 if(action==='copy'||action==='move'){openTransfer(id,action);return;}
 if(action==='rename'){
  const name=prompt('Renomear personagem:',c.name);
  if(name && name.trim()){S.rename(id,name);draw();notify('Nome atualizado.');}
  return;
 }
 if(action==='delete'){
  if(confirm('Excluir a ficha de '+c.name+'?\nEsta ação não pode ser desfeita sem um backup.')){
   S.remove(id);draw();notify('Ficha excluída.');
  }
 }
}
function backup(){
 const json=JSON.stringify(S.read(),null,2);
 const blob=new Blob([json],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;
 a.download='Fichas-Knave-backup-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
 notify('Backup das fichas exportado.');
}
async function restore(file){
 if(!file)return;
 if(!confirm('O backup substituirá TODAS as fichas e grupos deste navegador. Continuar?'))return;
 try{
  S.importDB(JSON.parse(await file.text()));
  filter='all';query='';$('searchInput').value='';draw();notify('Backup importado com sucesso.');
 }catch(err){alert('Não foi possível importar o backup: '+err.message);}
}
$('newGroupBtn').addEventListener('click',createGroup);
document.querySelector('.groups').addEventListener('click',e=>{
 const option=e.target.closest('[data-group-action]');
 if(option){e.stopPropagation();groupAction(option.dataset.groupAction,option.dataset.groupId);return;}
 const chip=e.target.closest('[data-filter]');
 if(chip){filter=chip.dataset.filter;draw();}
});
$('characterGrid').addEventListener('click',e=>{
 const create=e.target.closest('#newCharacterCard');if(create){openCreate();return;}
 const btn=e.target.closest('button[data-action]');if(!btn)return;
 const card=btn.closest('[data-id]');if(card)cardAction(btn.dataset.action,card.dataset.id);
});
$('emptyCreateBtn').addEventListener('click',openCreate);
$('searchInput').addEventListener('input',e=>{query=e.target.value.trim();draw();});
$('createForm').addEventListener('submit',e=>{
 e.preventDefault();
 const name=$('characterName').value.trim();if(!name)return;
 try{
  const c=S.create(name,$('characterGroup').value||null);
  $('characterDialog').close();openSheet(c);
 }catch(err){notify('Não foi possível criar a ficha: '+err.message);}
});
$('transferForm').addEventListener('submit',e=>{
 e.preventDefault();
 try{
  const group=$('targetGroup').value||null;
  if(transferMode==='copy'){S.duplicate(transferId,group);notify('Cópia independente criada.');}
  else{S.move(transferId,group);notify('Personagem movido para outro grupo.');}
  $('transferDialog').close();draw();
 }catch(err){alert('Erro ao organizar ficha: '+err.message);}
});
document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>{
 $(btn.dataset.close)?.close();
}));
$('backupBtn').addEventListener('click',backup);
$('restoreBtn').addEventListener('click',()=>$('backupInput').click());
$('backupInput').addEventListener('change',async e=>{await restore(e.target.files[0]);e.target.value='';});
window.addEventListener('storage',e=>{if(e.key===S.KEY)draw();});
window.addEventListener('nutripro:changed',draw);
window.addEventListener('pageshow',()=>{document.body.classList.remove('leaving');navigating=false;});
document.addEventListener('click',e=>{
 if(e.target.closest('details'))return;
 document.querySelectorAll('details[open]').forEach(d=>{d.open=false;});
});
draw();
})();
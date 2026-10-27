/* Nutripro II — armazenamento local independente do VTT.
   A ficha original permanece intacta; esta camada implementa a API que ela espera. */
const DB = 'nutripro-fichas-v1';
const VERSION = 1;
const CACHE = 'nutripro-static-v1';
const DEFAULT_GROUPS = [
  {id:'jogadores',name:'Jogadores',createdAt:'2026-01-01T00:00:00Z'},
  {id:'npcs',name:'NPCs',createdAt:'2026-01-01T00:00:00Z'},
  {id:'reservas',name:'Reservas',createdAt:'2026-01-01T00:00:00Z'}
];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./ficha_nutripro.html'])).catch(()=>{}));
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
function database() {
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB,VERSION);
    r.onupgradeneeded=()=>{
      const db=r.result;
      if(!db.objectStoreNames.contains('groups')) db.createObjectStore('groups',{keyPath:'id'});
      if(!db.objectStoreNames.contains('characters')) db.createObjectStore('characters',{keyPath:'id'});
    };
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
  });
}
async function operation(store,method,key) {
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,method==='get'||method==='getAll'?'readonly':'readwrite');
    const os=tx.objectStore(store);
    const r=method==='getAll'?os.getAll():method==='get'?os.get(key):method==='put'?os.put(key):method==='delete'?os.delete(key):os.clear();
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
    tx.oncomplete=()=>db.close();
  });
}
const all=(s)=>operation(s,'getAll');
const one=(s,id)=>operation(s,'get',id);
const save=(s,v)=>operation(s,'put',v);
const remove=(s,id)=>operation(s,'delete',id);
const clear=(s)=>operation(s,'clear');
let bootstrapPromise;
function bootstrap(){
  if(!bootstrapPromise)bootstrapPromise=(async()=>{
    const groups=await all('groups');
    if(!groups.length) for(const group of DEFAULT_GROUPS) await save('groups',group);
  })();
  return bootstrapPromise;
}
const newid=()=>self.crypto&&self.crypto.randomUUID?self.crypto.randomUUID():'p'+Date.now()+Math.random().toString(36).slice(2);
const now=()=>new Date().toISOString();
function json(obj,status=200){
  return new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}
async function parse(req){try{return await req.json()}catch{return {}}}
async function api(req){
  await bootstrap();
  const u=new URL(req.url),parts=u.pathname.split('/').filter(Boolean),method=req.method.toUpperCase();
  if(parts[1]==='library'&&method==='GET'){
    const [groups,characters]=await Promise.all([all('groups'),all('characters')]);
    return json({groups,characters:characters.map(c=>({id:c.id,name:c.name,groupId:c.groupId,portrait:c.portrait||'',createdAt:c.createdAt,updatedAt:c.updatedAt,nivel:c.sheet?.nivel||'',vida:c.sheet?.pvAtual||''}))});
  }
  if(parts[1]==='backup'&&method==='GET'){
    return json({version:1,exportedAt:now(),groups:await all('groups'),characters:await all('characters')});
  }
  if(parts[1]==='restore'&&method==='POST'){
    const p=await parse(req);
    if(!Array.isArray(p.groups)||!Array.isArray(p.characters)||p.characters.length>10000)return json({error:'Backup inválido'},400);
    if(p.groups.some(g=>typeof g.id!=='string'||typeof g.name!=='string')||
       p.characters.some(c=>typeof c.id!=='string'||typeof c.name!=='string'))return json({error:'Backup inválido'},400);
    await clear('characters');await clear('groups');
    for(const g of p.groups)await save('groups',g);
    for(const c of p.characters)await save('characters',c);
    bootstrapPromise=null;await bootstrap();
    return json({ok:true});
  }
  if(parts[1]==='groups'){
    if(parts.length===2&&method==='POST'){
      const p=await parse(req),name=String(p.name||'').trim().slice(0,80);
      if(!name)return json({error:'Nome obrigatório'},400);
      const group={id:newid(),name,createdAt:now()};
      await save('groups',group);return json(group,201);
    }
    const id=decodeURIComponent(parts[2]||'');
    if(id){
      const g=await one('groups',id);
      if(!g)return json({error:'Grupo não encontrado'},404);
      if(method==='PATCH'){
        const p=await parse(req),name=String(p.name||'').trim().slice(0,80);
        if(!name)return json({error:'Nome obrigatório'},400);
        g.name=name;await save('groups',g);return json(g);
      }
      if(method==='DELETE'){
        const cs=await all('characters');
        for(const c of cs)if(c.groupId===id){c.groupId='jogadores';await save('characters',c)}
        await remove('groups',id);
        if(id==='jogadores')await save('groups',{id:'jogadores',name:'Jogadores',createdAt:now()});
        return json({ok:true});
      }
    }
  }
  if(parts[1]==='characters'){
    if(parts.length===2&&method==='POST'){
      const p=await parse(req),name=String(p.name||'Novo personagem').trim().slice(0,120)||'Novo personagem';
      const ch={id:newid(),name,groupId:String(p.groupId||'jogadores'),portrait:'',sheet:{charNome:name},createdAt:now(),updatedAt:now()};
      await save('characters',ch);return json(ch,201);
    }
    const id=decodeURIComponent(parts[2]||'');
    const ch=await one('characters',id);
    if(!ch)return json({error:'Personagem não encontrado'},404);
    if(parts[3]==='copy'&&method==='POST'){
      const p=await parse(req),clone=JSON.parse(JSON.stringify(ch));
      clone.id=newid();clone.name=String(p.name||ch.name+' (cópia)').slice(0,120);
      clone.groupId=String(p.groupId||ch.groupId);clone.sheet.charNome=clone.name;
      clone.createdAt=now();clone.updatedAt=now();await save('characters',clone);return json(clone,201);
    }
    if(method==='PATCH'){
      const p=await parse(req);
      if(typeof p.name==='string'&&p.name.trim()){ch.name=p.name.trim().slice(0,120);ch.sheet=ch.sheet||{};ch.sheet.charNome=ch.name}
      if(typeof p.groupId==='string')ch.groupId=p.groupId;
      if(typeof p.portrait==='string'){if(p.portrait.length>2500000)return json({error:'Imagem muito grande'},413);ch.portrait=p.portrait}
      ch.updatedAt=now();await save('characters',ch);return json({ok:true,id:ch.id});
    }
    if(method==='DELETE'){await remove('characters',id);return json({ok:true})}
  }
  if(parts[1]==='sheets'){
    const id=decodeURIComponent(parts[2]||'');
    const ch=await one('characters',id);
    if(!ch)return json({error:'Ficha não encontrada'},404);
    if(method==='GET')return json(u.searchParams.has('meta')?{updated_at:ch.updatedAt}:{nome:ch.name,dados:ch.sheet||{},updated_at:ch.updatedAt});
    if(method==='POST'){
      const p=await parse(req);
      if(!p.dados||typeof p.dados!=='object')return json({error:'Dados ausentes'},400);
      ch.sheet=p.dados;ch.name=String(p.nome||p.dados.charNome||ch.name).slice(0,120);
      ch.updatedAt=now();await save('characters',ch);
      return json({ok:true,updated_at:ch.updatedAt});
    }
  }
  if(parts[1]==='token'&&method==='GET'){
    const ch=await one('characters',decodeURIComponent(parts[2]||''));
    if(!ch)return json({error:'Personagem não encontrado'},404);
    return json({name:ch.name,focusImage:ch.portrait||'',mapImage:ch.portrait||''});
  }
  return json({error:'Rota não encontrada'},404);
}
self.addEventListener('fetch',event=>{
  const u=new URL(event.request.url);
  if(u.origin!==self.location.origin)return;
  if(u.pathname.startsWith('/api/')){
    event.respondWith(api(event.request).catch(e=>json({error:String(e.message||e)},500)));
    return;
  }
  if(event.request.method==='GET'&&event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
  }
});

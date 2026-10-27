/* Nutripro II — armazenamento independente do VTT.
   Esta camada NÃO substitui os cálculos da ficha original: apenas atende às
   mesmas rotas /api/sheets e /api/token usando dados salvos neste navegador. */
(function(){
  'use strict';
  const KEY = 'nutripro:gestor:fichas:v1';
  const base = () => ({version:1, groups:[], characters:[]});
  const now = () => new Date().toISOString();
  const unique = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() :
    'np-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  const copy = x => JSON.parse(JSON.stringify(x));
  function read(){
    try {
      const db=JSON.parse(localStorage.getItem(KEY)||'null');
      if(db && Array.isArray(db.groups) && Array.isArray(db.characters)) return db;
    } catch(e){ console.error('Erro lendo personagens',e); }
    return base();
  }
  function write(db){
    const data=JSON.stringify(db);
    localStorage.setItem(KEY,data);
    window.dispatchEvent(new Event('nutripro:changed'));
    return db;
  }
  function get(id){return read().characters.find(x=>x.id===id)||null;}
  function create(name,groupId){
    const db=read();
    const item={id:unique(),name:String(name||'Sem nome').trim()||'Sem nome',
      groupId:groupId||null,created_at:now(),updated_at:now(),dados:{},portrait:''};
    db.characters.unshift(item);write(db);return item;
  }
  function saveSheet(id,dados,nome){
    const db=read();const c=db.characters.find(x=>x.id===id);
    if(!c)return null;
    c.dados=copy(dados||{});
    c.name=String(nome||c.name||'Personagem').trim()||'Personagem';
    c.updated_at=now();write(db);return c;
  }
  function setPortrait(id,url){
    const db=read();const c=db.characters.find(x=>x.id===id);if(!c)return false;
    c.portrait=String(url||'');c.updated_at=now();write(db);return true;
  }
  function duplicate(id,groupId){
    const db=read(),source=db.characters.find(x=>x.id===id);if(!source)return null;
    const item=copy(source);item.id=unique();item.groupId=groupId===undefined?source.groupId:groupId;
    item.name=source.name+' (cópia)';item.created_at=now();item.updated_at=now();
    // Campos da ficha permanecem idênticos e independentes.
    if(item.dados && item.dados.charNome)item.dados.charNome=item.name;
    db.characters.unshift(item);write(db);return item;
  }
  function rename(id,name){
    const db=read(),c=db.characters.find(x=>x.id===id);if(!c)return false;
    c.name=String(name||'').trim()||c.name;c.updated_at=now();
    if(c.dados && c.dados.charNome!==undefined)c.dados.charNome=c.name;
    write(db);return true;
  }
  function move(id,groupId){
    const db=read(),c=db.characters.find(x=>x.id===id);if(!c)return false;
    c.groupId=groupId||null;c.updated_at=now();write(db);return true;
  }
  function remove(id){const db=read();db.characters=db.characters.filter(x=>x.id!==id);write(db);}
  function createGroup(name){
    const db=read();const nameClean=String(name||'').trim();
    if(!nameClean)throw Error('Informe um nome para o grupo.');
    const g={id:unique(),name:nameClean,created_at:now()};
    db.groups.push(g);write(db);return g;
  }
  function renameGroup(id,name){
    const db=read(),g=db.groups.find(x=>x.id===id);if(!g)return false;
    g.name=String(name||'').trim()||g.name;write(db);return true;
  }
  function deleteGroup(id){
    const db=read();db.groups=db.groups.filter(x=>x.id!==id);
    db.characters.forEach(c=>{if(c.groupId===id)c.groupId=null;});
    write(db);
  }
  function importDB(raw){
    if(!raw || !Array.isArray(raw.groups) || !Array.isArray(raw.characters))
      throw Error('Arquivo não é um backup de fichas Nutripro.');
    const db=base(), ids=new Set(), groupIds=new Set();
    for(const g of raw.groups){
      if(!g || typeof g.id!=='string'||typeof g.name!=='string'||groupIds.has(g.id))continue;
      db.groups.push({id:g.id,name:g.name,created_at:g.created_at||now()});groupIds.add(g.id);
    }
    for(const c of raw.characters){
      if(!c || typeof c.id!=='string'||ids.has(c.id))continue;
      ids.add(c.id);
      db.characters.push({id:c.id,name:String(c.name||'Personagem'),
        groupId:groupIds.has(c.groupId)?c.groupId:null,
        dados:c.dados && typeof c.dados==='object' && !Array.isArray(c.dados)?c.dados:{},
        portrait:typeof c.portrait==='string'?c.portrait:'',
        created_at:c.created_at||now(),updated_at:c.updated_at||now()});
    }
    write(db);return db;
  }
  window.NutriproStore={KEY,read,write,get,create,saveSheet,setPortrait,duplicate,
    rename,move,remove,createGroup,renameGroup,deleteGroup,importDB};

  // Compatibilidade 1:1 com as chamadas de salvamento da ficha original.
  if(typeof window.fetch==='function'){
    const networkFetch=window.fetch.bind(window);
    window.fetch=function(input,opts){
      let u;
      try{u=new URL(typeof input==='string'?input:input.url,location.href);}
      catch(e){return networkFetch(input,opts);}
      const path=u.pathname;
      const mSheet=path.match(/\/api\/sheets\/([^/]+)$/);
      const mToken=path.match(/\/api\/token\/([^/]+)$/);
      if(!mSheet && !mToken)return networkFetch(input,opts);
      const id=decodeURIComponent((mSheet||mToken)[1]);
      const method=String((opts&&opts.method)||(typeof input!=='string'&&input.method)||'GET').toUpperCase();
      const response=(data,status)=>Promise.resolve(new Response(JSON.stringify(data),{
        status:status||200,headers:{'Content-Type':'application/json; charset=utf-8'}}));
      if(mToken){
        const c=get(id);
        if(!c)return response({error:'Personagem não encontrado'},404);
        return response({name:c.name,focusImage:c.portrait||'',mapImage:''});
      }
      if(method==='GET'){
        const c=get(id);
        if(!c)return response({error:'Ficha não encontrada'},404);
        if(u.searchParams.has('meta'))return response({updated_at:c.updated_at});
        return response({id:c.id,nome:c.name,dados:c.dados||{},updated_at:c.updated_at});
      }
      if(method==='POST'){
        try{
          const body=JSON.parse(opts&&opts.body||'{}');
          const result=saveSheet(id,body.dados,body.nome);
          return result?response({id,updated_at:result.updated_at}):
            response({error:'Ficha não encontrada'},404);
        }catch(e){return response({error:String(e.message||e)},400);}
      }
      return response({error:'Método não suportado'},405);
    };
  }
})();
/* Complementos mínimos para usar a ficha do Nutripro fora do VTT.
   A lógica de atributos, PA, slots, cálculos e editor permanece no HTML original. */
(function(){
  'use strict';
  const qs=new URLSearchParams(location.search);
  const id=qs.get('id');
  const S=window.NutriproStore;
  if(!S||!id)return;

  const portrait=document.querySelector('.np-portrait-wrap')||document.querySelector('.foto-box');
  const input=document.createElement('input');
  input.type='file';input.accept='image/png,image/jpeg,image/webp,image/gif';input.hidden=true;
  const button=document.createElement('button');
  button.type='button';button.textContent='↑ PERSONAGEM';
  button.title='Escolher imagem do personagem — salva junto da ficha';
  button.style.cssText='width:100%;margin-top:12px;padding:12px 8px;background:#0e160f;color:#b9d6a7;'+
    'border:1px solid #425743;letter-spacing:.13em;font-weight:900;font-size:10px;cursor:pointer';
  button.addEventListener('click',()=>input.click());
  input.addEventListener('change',()=>{
 const file=input.files&&input.files[0];if(!file)return;
 if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)){
   alert('Escolha PNG, JPG, WEBP ou GIF.');return;
 }
 const reader=new FileReader();
 reader.onload=()=>{
   const original=reader.result;
   if(typeof original!=='string')return;
   try{
     S.setPortrait(id,original);
     const view=document.getElementById('fotoPreview');
     if(view){view.src=original;view.style.display='block';}
     document.getElementById('dropZone')?.classList.add('has-image');
   }catch(err){alert('Imagem grande demais para salvar localmente. Escolha um arquivo menor.');}
 };
 reader.onerror=()=>alert('Não foi possível ler o arquivo.');
 reader.readAsDataURL(file);
});
  const standInput=document.createElement('input');
  standInput.type='file';standInput.accept='image/png,image/jpeg,image/webp,image/gif';standInput.hidden=true;
  const standButton=document.createElement('button');
  standButton.type='button';standButton.textContent='✕ STAND';
  standButton.title='Enviar a arte de corpo inteiro do Stand. PNG/WebP com fundo transparente funcionam melhor.';
  const actions=document.createElement('div');
  actions.className='np-art-actions';
  actions.append(button,standButton);
  const dropZone=document.getElementById('dropZone');
  const mainPortrait=document.getElementById('fotoPreview');
  let standPreview=null,standSwitch=null,standPinned=false;
  function updateStandPreview(){
    const c=S.get(id);
    if(!dropZone||!mainPortrait)return;
    if(!standPreview){
      standPreview=document.createElement('img');
      standPreview.className='np-stand-image';
      standPreview.alt='Stand do personagem';
      dropZone.insertBefore(standPreview,mainPortrait);
    }
    if(!standSwitch){
      standSwitch=document.createElement('button');
      standSwitch.type='button';standSwitch.className='np-stand-switch';
      standSwitch.title='Passe o mouse para prévia; clique para abrir a ficha do Stand';
      standSwitch.addEventListener('mouseenter',()=>{
        if(S.get(id)?.standPortrait)dropZone.classList.add('stand-focus');
      });
      standSwitch.addEventListener('mouseleave',()=>{
        if(!standPinned)dropZone.classList.remove('stand-focus');
      });
      standSwitch.addEventListener('click',()=>{
        if(window.KnaveStandSheet?.open){
          dropZone.classList.remove('stand-focus');
          standPinned=false;
          window.KnaveStandSheet.open();
          return;
        }
        if(!S.get(id)?.standPortrait){standInput.click();return;}
        standPinned=!standPinned;
        standSwitch.setAttribute('aria-pressed',String(standPinned));
        dropZone.classList.toggle('stand-focus',standPinned);
        standSwitch.textContent=standPinned?'PERSONAGEM':'STAND';
      });
      dropZone.appendChild(standSwitch);
    }
    if(c?.standPortrait){
      standPreview.src=c.standPortrait;
      standPreview.hidden=false;
      standSwitch.textContent='STAND';
      standSwitch.disabled=false;
    } else {
      standPreview.removeAttribute('src');
      standPreview.hidden=true;
      standSwitch.textContent='＋ STAND';
      standSwitch.disabled=false;
      standPinned=false;dropZone.classList.remove('stand-focus');
    }
  }
  standButton.addEventListener('click',()=>standInput.click());
  standInput.addEventListener('change',()=>{
 const file=standInput.files&&standInput.files[0];if(!file)return;
 if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)){
   alert('Escolha PNG, JPG, WEBP ou GIF.');return;
 }
 const reader=new FileReader();
 reader.onload=()=>{
   const original=reader.result;
   if(typeof original!=='string')return;
   try{S.setStandPortrait(id,original);updateStandPreview();}
   catch(err){alert('Imagem grande demais para o armazenamento local.');}
 };
 reader.onerror=()=>alert('Não foi possível ler a imagem.');
 reader.readAsDataURL(file);
});
  if(portrait){
    portrait.append(input,standInput,actions);
    const note=portrait.querySelector('.np-live-note');
    if(note)note.textContent='Clique no STAND ou passe o mouse para revelar a segunda arte.';
  }
  updateStandPreview();
  // A ficha mantém seu CSS/JS original; adicionamos somente animação de entrada
  // e retorno para a biblioteca, sem mudar as regras ou os cálculos.
  const transitionStyle=document.createElement('style');
  transitionStyle.textContent='@keyframes npKnaveEnter{from{opacity:0}to{opacity:1}}'+
    'body{animation:npKnaveEnter .55s ease-out both}'+
    'body.np-knave-exiting{animation:none!important;opacity:0!important;transition:opacity .34s ease!important}';
  document.head.appendChild(transitionStyle);
  const backToLibrary=document.querySelector('.np-back');
  if(backToLibrary){
    backToLibrary.removeAttribute('onclick');
    backToLibrary.textContent='← FICHAS';
    backToLibrary.title='Voltar para a biblioteca Ficha Knave';
    backToLibrary.addEventListener('click',async event=>{
      event.preventDefault();
      if(backToLibrary.disabled)return;
      backToLibrary.disabled=true;
      try{if(typeof window.salvarDados==='function')await window.salvarDados();}
      catch(error){console.warn('Salvamento antes de voltar:',error);}
      document.body.classList.add('np-knave-exiting');
      setTimeout(()=>{location.href='index.html';},340);
    });
  }

  const topBar=document.querySelector('.np-commandbar')||document.querySelector('.np-sheet-head');
  if(topBar){
    const exportBtn=document.createElement('button');
    exportBtn.type='button';exportBtn.textContent='↓ BACKUP DA FICHA';
    exportBtn.title='Exportar os dados desta ficha para JSON';
    exportBtn.style.cssText='border:1px solid #3f5841;background:#0e160f;color:#c4dcb9;'+
      'font-size:9px;font-weight:850;letter-spacing:.08em;padding:9px 10px;cursor:pointer';
    exportBtn.addEventListener('click',async()=>{
      if(typeof salvarDados==='function')await salvarDados();
      const c=S.get(id);if(!c)return;
      const data={version:1,groups:[],characters:[Object.assign({},c,{groupId:null})]};
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const u=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=u;a.download='Ficha-'+(c.name||'Nutripro').replace(/[^\wÀ-ÿ-]+/g,'-')+'.json';
      a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);
    });
    topBar.appendChild(exportBtn);
  }
})();
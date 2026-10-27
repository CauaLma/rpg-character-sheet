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
      alert('Escolha uma imagem PNG, JPG, WEBP ou GIF.');return;
    }
    const r=new FileReader();
    r.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        const size=950,scale=Math.min(1,size/Math.max(img.width,img.height));
        canvas.width=Math.max(1,Math.round(img.width*scale));
        canvas.height=Math.max(1,Math.round(img.height*scale));
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const data=canvas.toDataURL('image/webp',.86);
        const cleaned=window.KnaveBackground?window.KnaveBackground.clean(data):Promise.resolve(data);
        cleaned.then(output=>{
          try{
            S.setPortrait(id,output);
            const view=document.getElementById('fotoPreview');
            if(view){view.src=output;view.style.display='block';}
            document.getElementById('dropZone')?.classList.add('has-image');
          }catch(e){alert('Não foi possível salvar o retrato. Exporte um backup ou tente uma imagem menor.');}
        });
      };
      img.onerror=()=>alert('Não foi possível ler a imagem.');
      img.src=r.result;
    };
    r.readAsDataURL(file);
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
      standSwitch.title='Passar o mouse para ver Stand ou clicar para alternar';
      standSwitch.addEventListener('mouseenter',()=>{
        if(S.get(id)?.standPortrait)dropZone.classList.add('stand-focus');
      });
      standSwitch.addEventListener('mouseleave',()=>{
        if(!standPinned)dropZone.classList.remove('stand-focus');
      });
      standSwitch.addEventListener('click',()=>{
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
      alert('Escolha PNG, JPG, WebP ou GIF para o Stand.');return;
    }
    const url=URL.createObjectURL(file), img=new Image();
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const canvas=document.createElement('canvas');
      const factor=Math.min(1,950/Math.max(img.naturalWidth,img.naturalHeight));
      canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      const data=canvas.toDataURL('image/webp',.77);
      try{
        S.setStandPortrait(id,data);
        updateStandPreview();
  // Limpa visualmente também os retratos existentes salvos antes desta versão.
  // A imagem original só é substituída no armazenamento se o jogador reenviar.
  function cleanCurrentPortrait(){
    const raw=S.get(id)?.portrait;
    if(!raw||!window.KnaveBackground)return;
    window.KnaveBackground.clean(raw).then(cleaned=>{
      if(!cleaned||cleaned===raw||S.get(id)?.portrait!==raw)return;
      const view=document.getElementById('fotoPreview');
      if(view){
        view.src=cleaned;
        view.style.display='block';
        document.getElementById('dropZone')?.classList.add('has-image');
      }
    });
  }
  setTimeout(cleanCurrentPortrait,220);
      }catch(err){
        console.error(err);
        alert('Espaço local insuficiente para salvar Stand. Exporte backup ou use imagem menor.');
      }
    };
    img.onerror=()=>{URL.revokeObjectURL(url);alert('Erro ao ler a imagem do Stand.');};
    img.src=url;
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
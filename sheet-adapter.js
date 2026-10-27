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
  button.type='button';button.textContent='↑ TROCAR RETRATO';
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
        const size=600,scale=Math.min(1,size/Math.max(img.width,img.height));
        canvas.width=Math.max(1,Math.round(img.width*scale));
        canvas.height=Math.max(1,Math.round(img.height*scale));
        const ctx=canvas.getContext('2d');
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const data=canvas.toDataURL('image/jpeg',.76);
        try{
          S.setPortrait(id,data);
          const view=document.getElementById('fotoPreview');
          if(view){view.src=data;view.style.display='block';}
          document.getElementById('dropZone')?.classList.add('has-image');
        }catch(e){alert('Não foi possível salvar o retrato. Exporte um backup ou tente uma imagem menor.');}
      };
      img.onerror=()=>alert('Não foi possível ler a imagem.');
      img.src=r.result;
    };
    r.readAsDataURL(file);
  });
  if(portrait){
    portrait.appendChild(input);portrait.appendChild(button);
    const note=portrait.querySelector('.np-live-note');
    if(note)note.textContent='Retrato salvo neste navegador. Use o botão acima para escolher ou trocar a imagem.';
  }

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
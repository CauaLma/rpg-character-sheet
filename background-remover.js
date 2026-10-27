/* FICHA KNAVE • Remocao local e conservadora de fundos uniformes.
   Funciona sem servidor, sem enviar imagens para terceiros e preserva transparencia.
   Requer bordas com cor semelhante; fotos com fundos complexos ficam intactas. */
(function(){
  'use strict';
  const cache=new Map();
  const maxEntries=24;
  function distance(r,g,b,ref){
    return Math.max(Math.abs(r-ref[0]),Math.abs(g-ref[1]),Math.abs(b-ref[2]));
  }
  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img); img.onerror=()=>reject(new Error('Imagem indisponível'));
      img.src=src;
    });
  }
  function borderColor(pixels,w,h){
    const corners=[[1,1],[w-2,1],[1,h-2],[w-2,h-2]];
    const samples=corners.map(([cx,cy])=>{
      let r=0,g=0,b=0,count=0,alphas=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const x=Math.max(0,Math.min(w-1,cx+dx)),y=Math.max(0,Math.min(h-1,cy+dy));
        const i=(y*w+x)*4;
        if(pixels[i+3]<235){alphas++;continue;}
        r+=pixels[i];g+=pixels[i+1];b+=pixels[i+2];count++;
      }
      return count>=6?[r/count,g/count,b/count]:null;
    }).filter(Boolean);
    if(samples.length<3)return null; // Ja tem transparência nas bordas.
    let best=[],max=0;
    for(const center of samples){
      const related=samples.filter(s=>distance(s[0],s[1],s[2],center)<31);
      if(related.length>max){best=related;max=related.length;}
    }
    if(max<3)return null;
    const avg=[0,0,0];
    best.forEach(s=>s.forEach((v,k)=>avg[k]+=v));
    return avg.map(v=>v/best.length);
  }
  async function work(source,{force=false}={}){
    if(!source || !/^(data:image\/|blob:|https?:)/i.test(source))return source;
    // URLs de fotos externas podem bloquear a leitura de pixels por CORS.
    let img;
    try{img=await loadImage(source);}catch(e){return source;}
    const w0=img.naturalWidth,h0=img.naturalHeight;
    if(!w0||!h0)return source;
    const scale=Math.min(1,1100/Math.max(w0,h0));
    const w=Math.max(1,Math.round(w0*scale)),h=Math.max(1,Math.round(h0*scale));
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    try{ctx.drawImage(img,0,0,w,h);}catch(e){return source;}
    let frame;
    try{frame=ctx.getImageData(0,0,w,h);}catch(e){return source;}
    const rgba=frame.data;
    const bg=borderColor(rgba,w,h);
    if(!bg)return source;
    const darkness=Math.max(...bg)<55;
    // Remove fundos pretos/claros chapados; protege fotografias coloridas.
    const brightness=(bg[0]+bg[1]+bg[2])/3;
    if(!force && !darkness && brightness<175)return source;
    const tolerance=darkness?24:33;
    const visited=new Uint8Array(w*h);
    const queue=new Uint32Array(w*h);let head=0,tail=0;
    const near=index=>{
      const off=index*4;
      return rgba[off+3]>220&&distance(rgba[off],rgba[off+1],rgba[off+2],bg)<=tolerance;
    };
    const seed=index=>{if(visited[index]||!near(index))return;visited[index]=1;queue[tail++]=index;};
    for(let x=0;x<w;x++){seed(x);seed((h-1)*w+x);}
    for(let y=0;y<h;y++){seed(y*w);seed(y*w+w-1);}
    while(head<tail){
      const n=queue[head++],x=n%w,y=(n/w)|0;
      if(x>0)seed(n-1);if(x<w-1)seed(n+1);
      if(y>0)seed(n-w);if(y<h-1)seed(n+w);
    }
    const percent=tail/(w*h);
    if(percent<.07||percent>.97)return source;
    for(let n=0;n<w*h;n++)if(visited[n])rgba[n*4+3]=0;
    // Suaviza so um pixel na borda para evitar o contorno preto.
    for(let n=0;n<w*h;n++){
      if(visited[n])continue;
      const x=n%w,y=(n/w)|0;
      const touches=(x>0&&visited[n-1])||(x<w-1&&visited[n+1])||
        (y>0&&visited[n-w])||(y<h-1&&visited[n+w]);
      if(!touches)continue;
      const k=n*4;
      const diff=distance(rgba[k],rgba[k+1],rgba[k+2],bg);
      const factor=Math.max(.25,Math.min(1,(diff-tolerance+4)/34));
      rgba[k+3]=Math.round(rgba[k+3]*factor);
    }
    ctx.putImageData(frame,0,0);
    try{return canvas.toDataURL('image/webp',.9);}catch(e){return source;}
  }
  async function clean(source, options={}){
    if(!source)return source;
    const key=String(source).length+':'+String(source).slice(0,42)+':'+String(source).slice(-42)+':'+!!options.force;
    if(cache.has(key))return cache.get(key);
    const promise=work(source,options).catch(()=>source);
    cache.set(key,promise);
    if(cache.size>maxEntries)cache.delete(cache.keys().next().value);
    return promise;
  }
  window.KnaveBackground={clean};
})();
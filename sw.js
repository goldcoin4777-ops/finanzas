const VERSION='finanzas-v2';
const LOCAL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
const CDN=['https://cdn.tailwindcss.com','https://cdn.jsdelivr.net/npm/lucide@1.49.0/dist/umd/lucide.min.js','https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js'];

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(VERSION);
    await c.addAll(LOCAL);
    await Promise.all(CDN.map(async u=>{try{await c.put(u,await fetch(u,{mode:'no-cors'}))}catch(_){}}));
    self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys())if(k!==VERSION)await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  // solo se guardan la app y sus librerías; todo lo demás (p. ej. las tasas) siempre va a internet
  if(u.origin!==location.origin&&!CDN.some(c=>r.url.startsWith(c)))return;
  // la app: primero internet (para recibir actualizaciones), si no hay, la copia guardada
  if(r.mode==='navigate'||(u.origin===location.origin&&u.pathname.endsWith('/index.html'))){
    e.respondWith((async()=>{
      try{const n=await fetch(r);(await caches.open(VERSION)).put('./index.html',n.clone());return n}
      catch(_){return (await caches.match('./index.html'))||(await caches.match('./'))}
    })());return;
  }
  // librerías e íconos: primero la copia guardada, si no existe, internet
  e.respondWith((async()=>{
    const hit=await caches.match(r,{ignoreVary:true})||await caches.match(r.url);
    if(hit)return hit;
    try{const n=await fetch(r);if(n.ok||n.type==='opaque')(await caches.open(VERSION)).put(r,n.clone());return n}
    catch(_){return new Response('',{status:504})}
  })());
});

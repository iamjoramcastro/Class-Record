const CACHE="ecr-shell-v20";
const ASSETS=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/eClassRecord192.png",
  "./icons/eClassRecord512.png",
  "./icons/eClassRecord512.png",
  "./icons/eClassRecord512.png",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return;
  if(u.hostname.endsWith("firebaseio.com")||u.hostname.endsWith("firebasedatabase.app")||u.hostname.endsWith("googleapis.com")||u.pathname.includes("__/auth"))return;
  e.respondWith(
    caches.match(e.request).then(hit=>{
      const net=fetch(e.request).then(res=>{
        if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}
        return res;
      }).catch(()=>hit);
      return hit||net;
    })
  );
});

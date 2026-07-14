const CACHE="ecr-shell-v31";
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
self.addEventListener("message",e=>{
  if(e.data&&e.data.type==="SKIP_WAITING")self.skipWaiting();
});
function isHTML(req,u){
  return req.mode==="navigate"||(req.destination==="document")||u.pathname.endsWith("/")||u.pathname.endsWith(".html");
}
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const u=new URL(req.url);

  if(u.hostname.endsWith("firebaseio.com")||u.hostname.endsWith("firebasedatabase.app")||u.hostname.endsWith("googleapis.com")||u.pathname.includes("__/auth"))return;

  if(isHTML(req,u)){
    e.respondWith(
      fetch(req,{cache:"no-store"}).then(res=>{
        if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp))}
        return res;
      }).catch(()=>caches.match(req).then(hit=>hit||caches.match("./index.html").then(h=>h||caches.match("./"))))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit=>{
      const net=fetch(req).then(res=>{
        if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp))}
        return res;
      }).catch(()=>hit);
      return hit||net;
    })
  );
});

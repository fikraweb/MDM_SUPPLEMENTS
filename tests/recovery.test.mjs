import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
const root=new URL('../',import.meta.url).pathname;
const wrangler=join(root,'node_modules/wrangler/bin/wrangler.js');
function run(args){return new Promise((resolve,reject)=>{const p=spawn(process.execPath,[wrangler,...args],{cwd:root,env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:['ignore','pipe','ignore']});let output='';p.stdout.on('data',data=>output+=data);p.on('error',reject);p.on('exit',code=>resolve({code,output}));});}
test('Premier accès D1 vide : préparation authentifiée, conservation des données et compatibilité Wrangler',{timeout:60000},async()=>{
 const path=await mkdtemp(join(tmpdir(),'mdm-recovery-test-'));
 const base='http://127.0.0.1:8791';
 const password=process.env.TEST_ADMIN_PASSWORD||(await readFile(join(root,'.dev.vars.local'),'utf8')).split('\n').find(line=>line.startsWith('ADMIN_PASSWORD='))?.slice(15);
 assert.ok(password,'npm run setup:local doit préparer les secrets locaux.');
 const worker=spawn(process.execPath,[wrangler,'dev','--env','local','--local','--persist-to',path,'--port','8791'],{cwd:root,env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:'ignore',detached:true});
 let cookie='';
 const call=async(url,{method='GET',body,headers={},auth=false}={})=>{
  const response=await fetch(base+url,{method,headers:{...(body!==undefined?{'Content-Type':'application/json',Origin:base}:{}),...(auth?{Cookie:cookie}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});return{status:response.status,body:await response.json(),response};
 };
 try{
  let ready=false;for(let i=0;i<120;i++){try{const r=await fetch(base+'/api/catalog');if(r.status===200){ready=true;break;}}catch{}await delay(250);}
  assert.ok(ready,'Le Worker isolé doit démarrer.');
  assert.equal((await call('/api/catalog')).body.checkoutEnabled,false);
  assert.equal((await call('/api/admin/login',{method:'POST',body:{password:'incorrect-password'}})).status,401);
  assert.equal((await call('/api/catalog')).body.checkoutEnabled,false,'Un mot de passe incorrect ne doit pas initialiser la boutique.');
  assert.equal((await call('/api/orders',{method:'POST',body:{}})).status,503);
  const logins=await Promise.all([call('/api/admin/login',{method:'POST',body:{password}}),call('/api/admin/login',{method:'POST',body:{password}})]);
  assert.deepEqual(logins.map(r=>r.status),[200,200]);cookie=logins[0].response.headers.get('Set-Cookie').split(';')[0];
  const catalog=(await call('/api/catalog')).body;assert.equal(catalog.checkoutEnabled,true);assert.equal(catalog.products.length,15);assert.equal(catalog.settings.freeShipping,true);
  let products=(await call('/api/admin/products',{auth:true})).body.products;const original=products.find(p=>p.id===101);
  assert.equal((await call('/api/admin/products/101',{auth:true,method:'PUT',body:{...original,name:'Produit conservé après connexion',price:888,priceSource:'fixed',stock:5}})).status,200);
  const receipt=await call('/api/orders',{method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()},body:{customer:{name:'Test récupération local',phone:'0612345678',city:'Rabat',address:'10 Rue de test',notes:'Test isolé, jamais en production.'},items:[{id:101,qty:1}],expectedTotalCents:88800}});assert.equal(receipt.status,201);
  const repeat=await call('/api/admin/login',{method:'POST',body:{password}});assert.equal(repeat.status,200);cookie=repeat.response.headers.get('Set-Cookie').split(';')[0];
  products=(await call('/api/admin/products',{auth:true})).body.products;const preserved=products.find(p=>p.id===101);assert.equal(preserved.name,'Produit conservé après connexion');assert.equal(preserved.price,888);assert.equal(preserved.stock,4);
  const orders=await call('/api/admin/orders?q='+receipt.body.reference,{auth:true});assert.equal(orders.body.total,1);assert.equal(orders.body.orders[0].total,888);
 }finally{
  const stopped=new Promise(resolve=>worker.once('exit',resolve));try{process.kill(-worker.pid,'SIGTERM');}catch{}
  await Promise.race([stopped,delay(2000)]);try{process.kill(-worker.pid,'SIGKILL');}catch{}
 }
 try{
  const migrations=await run(['d1','migrations','apply','mdm-store-local','--env','local','--local','--persist-to',path]);assert.equal(migrations.code,0);assert.match(migrations.output,/No migrations to apply/);
 }finally{await rm(path,{recursive:true,force:true});}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8787';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Ces tests écrivent des données et sont limités au Worker local.');
const password=process.env.TEST_ADMIN_PASSWORD||readFileSync('.dev.vars.local','utf8').split('\n').find(line=>line.startsWith('ADMIN_PASSWORD='))?.slice(15);
let cookie='';
async function call(path,{method='GET',data,auth=false,origin=base,headers={}}={}){
 const response=await fetch(base+path,{method,headers:{...(data!==undefined?{'Content-Type':'application/json'}:{}),...(method!=='GET'?{Origin:origin}:{}),...(auth?{Cookie:cookie}:{}),...headers},...(data!==undefined?{body:JSON.stringify(data)}:{})});
 let body;try{body=await response.clone().json();}catch{body=await response.text();}return {status:response.status,body,response};
}
const customer={name:'Client test intégration',phone:'0612345678',city:'Casablanca',address:'12 Rue de test, appartement 3',notes:'Commande de test local, ne pas traiter.'};
const order=(key,items=[{id:110,qty:2}],extra={})=>call('/api/orders',{method:'POST',data:{customer,items,...extra},headers:{'Idempotency-Key':key}});
async function allProduct(id){return (await call('/api/admin/products',{auth:true})).body.products.find(p=>p.id===id);}
async function edit(p,changes){return call('/api/admin/products/'+p.id,{method:'PUT',auth:true,data:{...p,...changes}});}
await test('Commandes persistantes, authentification, prix serveur, idempotence et stock atomique',async t=>{
 await t.test('API privée et CSRF',async()=>{
  assert.equal((await call('/api/admin/orders')).status,401);
  assert.equal((await call('/api/admin/customers')).status,401);
  assert.equal((await call('/api/admin/export/orders')).status,401);
  assert.equal((await call('/api/admin/login',{method:'POST',origin:'https://example.invalid',data:{password:'wrong-password'}})).status,403);
  assert.equal((await call('/api/admin/login',{method:'POST',data:{password:'wrong-password'}})).status,401);
  const login=await call('/api/admin/login',{method:'POST',data:{password}});assert.equal(login.status,200);const header=login.response.headers.get('Set-Cookie');assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Strict/);cookie=header.split(';')[0];
  assert.equal((await call('/api/admin/session',{auth:true})).body.authenticated,true);
  assert.equal((await call('/api/admin/settings',{auth:true,method:'PUT',origin:'https://example.invalid',data:{}})).status,403);
 });
 const initial=await allProduct(110);
 try{
  await edit(initial,{stock:null,active:true,price:250,priceSource:'estimate'});
  let reference,orderId,firstOrder;
  await t.test('Validation, prix serveur et répétition sans doublon',async()=>{
   assert.equal((await order(crypto.randomUUID(),[])).status,400);
   assert.equal((await order(crypto.randomUUID(),[{id:110,qty:-1}])).status,400);
   assert.equal((await order(crypto.randomUUID(),[{id:110,qty:1}],{customer:{...customer,phone:'123'}})).status,400);
   assert.equal((await call('/api/orders',{method:'POST',origin:'https://example.invalid',data:{customer,items:[{id:110,qty:1}]},headers:{'Idempotency-Key':crypto.randomUUID()}})).status,403);
   const key=crypto.randomUUID();const created=await order(key,[{id:110,qty:2,price:0}],{total:0,shipping:-100});assert.equal(created.status,201);assert.equal(created.body.total,500);assert.equal(created.body.shipping,0);reference=created.body.reference;assert.match(reference,/^MDM-\d{8}-[A-F0-9]{8}$/);assert.equal(created.body.customer,undefined);
   const repeated=await order(key,[{id:110,qty:2,price:0}],{total:0,shipping:-100});assert.equal(repeated.status,200);assert.equal(repeated.body.reference,reference);
   assert.equal((await order(key,[{id:110,qty:1}])).status,409);
   const list=await call('/api/admin/orders?q='+reference,{auth:true});assert.equal(list.body.total,1);orderId=list.body.orders[0].id;
   firstOrder=(await call('/api/admin/orders/'+orderId,{auth:true})).body;assert.equal(firstOrder.items[0].quantity,2);assert.equal(firstOrder.items[0].unitPrice,250);assert.equal(firstOrder.phone,'+212612345678');assert.equal(firstOrder.history[0].status,'new');
   assert.equal((await call('/api/admin/orders/'+orderId)).status,401);
  });
  await t.test('Prix historique et concurrence sur le dernier article',async()=>{
   let p=await allProduct(110);assert.equal((await edit(p,{price:275,priceSource:'fixed',stock:1})).status,200);
   const results=await Promise.all([order(crypto.randomUUID(),[{id:110,qty:1}]),order(crypto.randomUUID(),[{id:110,qty:1}])]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);assert.equal((await allProduct(110)).stock,0);
   const original=(await call('/api/admin/orders/'+orderId,{auth:true})).body;assert.equal(original.items[0].unitPrice,250);assert.equal(original.total,500);
   const accepted=results.find(r=>r.status===201);assert.equal(accepted.body.total,275);const list=(await call('/api/admin/orders?q='+accepted.body.reference,{auth:true})).body;const id=list.orders[0].id;let detail=(await call('/api/admin/orders/'+id,{auth:true})).body;
   assert.equal((await call('/api/admin/orders/'+id,{auth:true,method:'PATCH',data:{status:'delivered',revision:detail.revision}})).status,400);
   const confirmed=await call('/api/admin/orders/'+id,{auth:true,method:'PATCH',data:{status:'confirmed',revision:detail.revision}});assert.equal(confirmed.status,200);
   assert.equal((await call('/api/admin/orders/'+id,{auth:true,method:'PATCH',data:{status:'cancelled',revision:detail.revision}})).status,409);
   detail=confirmed.body;const cancelled=await call('/api/admin/orders/'+id,{auth:true,method:'PATCH',data:{status:'cancelled',revision:detail.revision}});assert.equal(cancelled.status,200);assert.equal((await allProduct(110)).stock,1);
   assert.equal((await call('/api/admin/orders/'+id,{auth:true,method:'PATCH',data:{status:'cancelled',revision:cancelled.body.revision}})).status,400);assert.equal((await allProduct(110)).stock,1);
   const cancelFirst=await call('/api/admin/orders/'+orderId,{auth:true,method:'PATCH',data:{status:'cancelled',revision:firstOrder.revision}});assert.equal(cancelFirst.status,200);assert.equal((await allProduct(110)).stock,1,'Une commande sans réservation ne doit pas augmenter le stock suivi plus tard.');
  });
  await t.test('Produits masqués, paramètres et export',async()=>{
   let p=await allProduct(110);await edit(p,{active:false});const catalog=(await call('/api/catalog')).body;assert.equal(catalog.products.some(p=>p.id===110),false);assert.equal((await order(crypto.randomUUID(),[{id:110,qty:1}])).status,409);
   const config=(await call('/api/admin/settings',{auth:true})).body;assert.equal(config.freeShipping,true);assert.equal(config.shippingFee,0);
   const exported=await call('/api/admin/export/orders',{auth:true});assert.equal(exported.status,200);assert.match(exported.response.headers.get('Content-Disposition'),/attachment/);assert.match(exported.body,/MDM-/);
   assert.ok((await call('/api/admin/customers',{auth:true})).body.customers.some(c=>c.phone==='+212612345678'));
  });
 }finally{const current=await allProduct(110);await edit(current,{...initial,revision:current.revision});}
 await t.test('Déconnexion révoque l’accès du navigateur',async()=>{assert.equal((await call('/api/admin/logout',{auth:true,method:'POST',data:{}})).status,200);assert.equal((await call('/api/admin/orders',{auth:true})).status,401);const invalid=await call('/api/admin/orders',{headers:{Cookie:'mdm_session=invalid'}});assert.equal(invalid.status,401);});
});

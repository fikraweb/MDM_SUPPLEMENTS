import { initializeDatabase, databaseReady, missingSchema } from './database.js';
import { products as initialProducts } from '../src/products.js';
const encoder = new TextEncoder();
const defaults = { storeName:'MDM Supplements', phone:'0618194707', instagram:'https://www.instagram.com/mdm_supplements/', freeShipping:true, shippingFee:0, orderNotice:'Paiement à la livraison. Livraison offerte partout au Maroc.' };
const transitions = {new:['confirmed','cancelled'],confirmed:['preparing','cancelled'],preparing:['shipped','cancelled'],shipped:['delivered','cancelled'],delivered:[],cancelled:[]};
class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
const fail=(status,message)=>{throw new HttpError(status,message);};
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const unb64=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
const hash=async value=>b64(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const configured=env=>!!env.DB;
const authConfigured=env=>typeof env.ADMIN_PASSWORD==='string'&&env.ADMIN_PASSWORD.length>=12&&typeof env.SESSION_SECRET==='string'&&env.SESSION_SECRET.length>=32;
async function signingKey(env){return crypto.subtle.importKey('raw',encoder.encode(`${env.SESSION_SECRET}:${env.ADMIN_PASSWORD}`),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function session(env){const expires=Date.now()+8*3600_000;const payload=b64(encoder.encode(JSON.stringify({exp:expires,nonce:crypto.randomUUID()})));const token=`${payload}.${b64(await crypto.subtle.sign('HMAC',await signingKey(env),encoder.encode(payload)))}`;await env.DB.batch([env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at<?').bind(Date.now()),env.DB.prepare('INSERT INTO admin_sessions(token_hash,expires_at) VALUES(?,?)').bind(await hash(token),expires)]);return token;}
async function authenticated(request,env){
 if(!authConfigured(env))return false;
 try{const token=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('mdm_session='))?.slice(12);if(!token)return false;const[payload,signature]=token.split('.');if(!payload||!signature||!await crypto.subtle.verify('HMAC',await signingKey(env),unb64(signature),encoder.encode(payload)))return false;const data=JSON.parse(new TextDecoder().decode(unb64(payload)));if(!Number.isFinite(data.exp)||data.exp<=Date.now()||data.exp>=Date.now()+9*3600_000)return false;return !!await env.DB.prepare('SELECT token_hash FROM admin_sessions WHERE token_hash=? AND expires_at>?').bind(await hash(token),Date.now()).first();}catch{return false;}
}
function cookie(request,value,maxAge){const host=new URL(request.url).hostname;return `mdm_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${['localhost','127.0.0.1','[::1]'].includes(host)?'':'; Secure'}`;}
function sameOrigin(request){if(request.headers.get('Origin')!==new URL(request.url).origin)fail(403,'Origine de la requête refusée.');}
async function body(request){
 if(!request.headers.get('Content-Type')?.includes('application/json'))fail(415,'Format JSON requis.');
 if(Number(request.headers.get('Content-Length'))>20000)fail(413,'Requête trop volumineuse.');
 const reader=request.body?.getReader();if(!reader)fail(400,'Données requises.');let size=0;const chunks=[];
 while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>20000){await reader.cancel();fail(413,'Requête trop volumineuse.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 let data;try{data=JSON.parse(new TextDecoder().decode(bytes));}catch{fail(400,'Données invalides.');}
 if(!data||typeof data!=='object'||Array.isArray(data))fail(400,'Données invalides.');return data;
}
function str(value,name,max,min=1){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)fail(400,`${name} invalide.`);return value.trim();}
function cents(value){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100000||Math.abs(Math.round(value*100)-value*100)>0.00001)fail(400,'Prix invalide.');return Math.round(value*100);}
function phone(value){const n=str(value,'Téléphone',25).replace(/[\s().-]/g,'');if(/^0[5-7]\d{8}$/.test(n))return '+212'+n.slice(1);if(/^\+?212[5-7]\d{8}$/.test(n))return '+'+n.replace(/^\+/,'');fail(400,'Numéro marocain invalide (ex. 0612345678).');}
function imageUrl(value){const url=str(value,'Image',500);if(/^\/images\/[a-zA-Z0-9_./-]+$/.test(url)&&!url.includes('..'))return url;try{const u=new URL(url);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href;}catch{}fail(400,'Utilisez une image locale /images/ ou un lien HTTPS.');}
function product(row){return {...JSON.parse(row.data_json),id:row.id,name:row.name,brand:row.brand,category:row.category,detail:row.detail,price:row.price_cents/100,priceSource:row.price_source,stock:row.stock,active:!!row.active,revision:row.revision};}
async function settings(env){const row=await env.DB.prepare('SELECT data_json FROM settings WHERE id=1').first();return {...defaults,...(row?JSON.parse(row.data_json):{})};}
async function rateLimit(request,env,scope,max){
 if(scope==='login')await env.DB.prepare('CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires_at INTEGER NOT NULL)').run();
 const bucket=Math.floor(Date.now()/900_000);const ip=request.headers.get('CF-Connecting-IP')||'local';const key=await hash(`${env.SESSION_SECRET||'mdm-local'}:${scope}:${ip}:${bucket}`);
 const row=await env.DB.prepare('INSERT INTO rate_limits(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits').bind(key,(bucket+1)*900_000).first();if(row.hits>max)fail(429,'Trop de tentatives. Réessayez dans quelques minutes.');
 if(Math.random()<.02)await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(Date.now()).run();
}
function orderRow(row){return {...row,subtotal:row.subtotal_cents/100,shipping:row.shipping_cents/100,total:row.total_cents/100,request_hash:undefined,idempotency_key:undefined};}
async function orderDetail(env,id){const order=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first();if(!order)fail(404,'Commande introuvable.');const items=await env.DB.prepare('SELECT product_id,name,detail,quantity,unit_price_cents,price_source FROM order_items WHERE order_id=? ORDER BY id').bind(id).all();const history=await env.DB.prepare('SELECT status,created_at FROM order_history WHERE order_id=? ORDER BY id').bind(id).all();return {...orderRow(order),items:items.results.map(i=>({...i,unitPrice:i.unit_price_cents/100})),history:history.results,allowedStatuses:transitions[order.status]};}
function receipt(row){return {reference:row.reference,total:row.total_cents/100,shipping:row.shipping_cents/100,paymentMethod:'cod',status:'received'};}
async function createOrder(request,env){
 sameOrigin(request);await rateLimit(request,env,'orders',30);
 const data=await body(request);const key=request.headers.get('Idempotency-Key');if(!key||!/^[a-f0-9-]{36}$/i.test(key))fail(400,'Clé de commande invalide.');
 const customer={name:str(data.customer?.name,'Nom',100,2),phone:phone(data.customer?.phone),city:str(data.customer?.city,'Ville',80,2),address:str(data.customer?.address,'Adresse',300,5),notes:str(data.customer?.notes??'','Note',500,0)};
 if(!Array.isArray(data.items)||!data.items.length||data.items.length>50)fail(400,'Panier invalide.');const seen=new Set();const items=data.items.map(item=>{if(!Number.isInteger(item.id)||seen.has(item.id)||!Number.isInteger(item.qty)||item.qty<1||item.qty>99)fail(400,'Quantités ou produits invalides.');seen.add(item.id);return {id:item.id,qty:item.qty};}).sort((a,b)=>a.id-b.id);
 const requestHash=await hash(JSON.stringify({customer,items}));const prior=await env.DB.prepare('SELECT * FROM orders WHERE idempotency_key=?').bind(key).first();if(prior){if(prior.request_hash!==requestHash)fail(409,'Cette tentative correspond à un autre panier.');return json(receipt(prior));}
 const placeholders=items.map(()=>'?').join(',');const rows=(await env.DB.prepare(`SELECT * FROM products WHERE id IN (${placeholders})`).bind(...items.map(i=>i.id)).all()).results;
 if(rows.length!==items.length)fail(409,'Un produit n’est plus disponible. Actualisez le catalogue.');let subtotal=0;
 for(const item of items){const p=rows.find(p=>p.id===item.id);if(!p.active)fail(409,`${p.name} n’est plus disponible.`);if(p.stock!==null&&p.stock<item.qty)fail(409,`Stock insuffisant : ${p.name}.`);subtotal+=p.price_cents*item.qty;}
 const config=await settings(env);const shipping=config.freeShipping?0:cents(config.shippingFee);const total=subtotal+shipping;
 if(data.expectedTotalCents!==undefined&&(!Number.isSafeInteger(data.expectedTotalCents)||data.expectedTotalCents!==total))fail(409,'Les prix ou la livraison ont changé. Vérifiez le panier actualisé avant de confirmer.');
 const id=crypto.randomUUID();const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Casablanca',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('-','');const reference=`MDM-${day}-${crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase()}`;const now=new Date().toISOString();
 const commands=[env.DB.prepare('INSERT INTO orders(id,reference,idempotency_key,request_hash,customer_name,phone,city,address,notes,subtotal_cents,shipping_cents,total_cents,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,reference,key,requestHash,customer.name,customer.phone,customer.city,customer.address,customer.notes,subtotal,shipping,total,now,now)];
 for(const item of items){const p=rows.find(p=>p.id===item.id);commands.push(env.DB.prepare('INSERT INTO order_items(order_id,product_id,name,detail,quantity,unit_price_cents,price_source,stock_reserved) SELECT ?,?,?,?,?,?,?,CASE WHEN stock IS NULL THEN 0 ELSE 1 END FROM products WHERE id=?').bind(id,p.id,p.name,p.detail,item.qty,p.price_cents,p.price_source,p.id));}
 try{await env.DB.batch(commands);}catch(error){const duplicate=await env.DB.prepare('SELECT * FROM orders WHERE idempotency_key=?').bind(key).first();if(duplicate&&duplicate.request_hash===requestHash)return json(receipt(duplicate));if(/OUT_OF_STOCK|PRICE_CHANGED|PRODUCT_UNAVAILABLE/.test(error.message))fail(409,'Le stock ou le prix a changé. Actualisez le catalogue avant de réessayer.');throw error;}
 return json({reference,total:total/100,shipping:shipping/100,paymentMethod:'cod',status:'received'},201);
}
async function saveProduct(request,env,id){
 const data=await body(request);const name=str(data.name,'Nom',160,2),brand=str(data.brand,'Marque',100),category=str(data.category,'Catégorie',60),detail=str(data.detail,'Description',500);const price=cents(data.price);const priceSource=data.priceSource;if(!['photo','estimate','fixed'].includes(priceSource))fail(400,'Origine du prix invalide.');const stock=data.stock===null?null:data.stock;if(stock!==null&&(!Number.isInteger(stock)||stock<0||stock>100000))fail(400,'Stock invalide.');if(typeof data.active!=='boolean')fail(400,'Visibilité invalide.');const cutout=imageUrl(data.cutout);
 if(id){const old=await env.DB.prepare('SELECT * FROM products WHERE id=?').bind(id).first();if(!old)fail(404,'Produit introuvable.');if(data.revision!==old.revision)fail(409,'Produit modifié entre-temps. Actualisez puis réessayez.');const saved={...JSON.parse(old.data_json),cutout};const result=await env.DB.prepare('UPDATE products SET name=?,brand=?,category=?,detail=?,price_cents=?,price_source=?,stock=?,active=?,data_json=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(name,brand,category,detail,price,priceSource,stock,data.active?1:0,JSON.stringify(saved),new Date().toISOString(),id,data.revision).run();if(!result.meta.changes)fail(409,'Produit modifié entre-temps.');return json({ok:true});}
 const base={cutout,freeDelivery:false,offerNote:''};const result=await env.DB.prepare('INSERT INTO products(name,brand,category,detail,price_cents,price_source,stock,active,data_json) VALUES(?,?,?,?,?,?,?,?,?) RETURNING id').bind(name,brand,category,detail,price,priceSource,stock,data.active?1:0,JSON.stringify(base)).first();return json({id:result.id},201);
}
function csvCell(value){let text=String(value??'');if(/^[\s]*[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
async function handle(request,env){
 const url=new URL(request.url);const path=url.pathname;const method=request.method;
 if(!path.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(path==='/api/catalog'&&method==='GET'){
  if(!configured(env))return json({products:initialProducts,settings:defaults,checkoutEnabled:false});
  try{if(!await databaseReady(env.DB))return json({products:initialProducts,settings:defaults,checkoutEnabled:false});const rows=await env.DB.prepare('SELECT * FROM products WHERE active=1 ORDER BY id').all();return json({products:rows.results.map(product),settings:await settings(env),checkoutEnabled:true});}catch(error){if(missingSchema(error))return json({products:initialProducts,settings:defaults,checkoutEnabled:false});throw error;}
 }
 if(!configured(env))fail(503,'Le service de commandes est en cours de configuration. Réessayez plus tard.');
 if(path==='/api/orders'&&method==='POST'){if(!await databaseReady(env.DB))fail(503,'La prise de commandes est en cours de préparation. Réessayez plus tard.');return createOrder(request,env);}
 if(!path.startsWith('/api/admin/'))fail(404,'Route introuvable.');
 if(path==='/api/admin/session'&&method==='GET')return json({authenticated:await authenticated(request,env)&&await databaseReady(env.DB),configured:authConfigured(env)});
 if(path==='/api/admin/login'&&method==='POST'){
  sameOrigin(request);if(!authConfigured(env))fail(503,'L’accès administrateur doit être configuré dans Cloudflare.');await rateLimit(request,env,'login',10);const data=await body(request);const supplied=str(data.password,'Mot de passe',500);const actual=await hash(env.ADMIN_PASSWORD);const given=await hash(supplied);let different=actual.length^given.length;for(let i=0;i<actual.length;i++)different|=actual.charCodeAt(i)^given.charCodeAt(i);if(different)fail(401,'Mot de passe incorrect.');await initializeDatabase(env.DB);return json({ok:true},200,{'Set-Cookie':cookie(request,await session(env),8*3600)});
 }
 if(!await authenticated(request,env))fail(401,'Connexion administrateur requise.');
 if(!['GET','HEAD'].includes(method))sameOrigin(request);
 if(path==='/api/admin/logout'&&method==='POST'){const token=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('mdm_session='))?.slice(12);if(token)await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await hash(token)).run();return json({ok:true},200,{'Set-Cookie':cookie(request,'',0)});}
 if(path==='/api/admin/settings'){
  if(method==='GET')return json(await settings(env));
  if(method==='PUT'){const data=await body(request);const config={storeName:str(data.storeName,'Nom du magasin',100),phone:phone(data.phone),instagram:str(data.instagram,'Instagram',300),freeShipping:data.freeShipping,shippingFee:cents(data.shippingFee)/100,orderNotice:str(data.orderNotice,'Message',500,0)};if(typeof config.freeShipping!=='boolean')fail(400,'Livraison invalide.');try{const u=new URL(config.instagram);if(u.protocol!=='https:'||!['www.instagram.com','instagram.com'].includes(u.hostname))fail(400,'Lien Instagram invalide.');}catch{fail(400,'Lien Instagram invalide.');}if(config.freeShipping)config.shippingFee=0;await env.DB.prepare('UPDATE settings SET data_json=? WHERE id=1').bind(JSON.stringify(config)).run();return json({ok:true});}
 }
 if(path==='/api/admin/products'){
  if(method==='GET')return json({products:(await env.DB.prepare('SELECT * FROM products ORDER BY id').all()).results.map(product)});
  if(method==='POST')return saveProduct(request,env,null);
 }
 const productMatch=path.match(/^\/api\/admin\/products\/(\d+)$/);if(productMatch&&method==='PUT')return saveProduct(request,env,Number(productMatch[1]));
 if(path==='/api/admin/stats'&&method==='GET'){
  const stats=await env.DB.prepare("SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN status='new' THEN 1 ELSE 0 END),0) AS newOrders, COALESCE(SUM(CASE WHEN status='delivered' THEN total_cents ELSE 0 END),0) AS revenueCents, COALESCE(SUM(CASE WHEN status NOT IN ('cancelled','delivered') THEN total_cents ELSE 0 END),0) AS pendingCents FROM orders").first();
  const daily=(await env.DB.prepare("SELECT substr(created_at,1,10) AS day,COUNT(*) AS count FROM orders WHERE created_at>=? GROUP BY day ORDER BY day").bind(new Date(Date.now()-7*86400_000).toISOString()).all()).results;
  const lowStock=(await env.DB.prepare('SELECT id,name,stock FROM products WHERE active=1 AND stock IS NOT NULL AND stock<=5 ORDER BY stock LIMIT 10').all()).results;
  return json({...stats,daily,lowStock,products:(await env.DB.prepare('SELECT COUNT(*) AS count FROM products WHERE active=1').first()).count});
 }
 if(path==='/api/admin/customers'&&method==='GET')return json({customers:(await env.DB.prepare("SELECT phone,MAX(customer_name) AS name,COUNT(*) AS orders,SUM(CASE WHEN status!='cancelled' THEN total_cents ELSE 0 END) AS total_cents,MAX(created_at) AS last_order FROM orders GROUP BY phone ORDER BY last_order DESC LIMIT 1000").all()).results});
 if(path==='/api/admin/export/orders'&&method==='GET'){
  const rows=(await env.DB.prepare('SELECT reference,created_at,customer_name,phone,city,address,status,total_cents FROM orders ORDER BY created_at DESC LIMIT 5000').all()).results;
  const text='\uFEFF'+[['Référence','Date','Client','Téléphone','Ville','Adresse','Statut','Total DH'],...rows.map(r=>[r.reference,r.created_at,r.customer_name,r.phone,r.city,r.address,r.status,r.total_cents/100])].map(row=>row.map(csvCell).join(';')).join('\r\n');return new Response(text,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="mdm-commandes.csv"','Cache-Control':'no-store'}});
 }
 if(path==='/api/admin/orders'&&method==='GET'){
  const where=[],args=[];const status=url.searchParams.get('status');if(status){if(!Object.hasOwn(transitions,status))fail(400,'Statut invalide.');where.push('status=?');args.push(status);}
  const query=(url.searchParams.get('q')||'').slice(0,100);if(query){where.push('(reference LIKE ? OR customer_name LIKE ? OR phone LIKE ?)');args.push(...Array(3).fill('%'+query+'%'));}
  for(const [param,op]of[['from','>='],['to','<=']]){const value=url.searchParams.get(param);if(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))fail(400,'Date invalide.');where.push(`created_at${op}?`);args.push(value+(param==='to'?'T23:59:59.999Z':'T00:00:00.000Z'));}}
  const clause=where.length?' WHERE '+where.join(' AND '):'';const page=Math.max(1,Math.min(100000,Number(url.searchParams.get('page'))||1));const count=await env.DB.prepare('SELECT COUNT(*) AS count FROM orders'+clause).bind(...args).first();const rows=await env.DB.prepare('SELECT * FROM orders'+clause+' ORDER BY created_at DESC LIMIT 30 OFFSET ?').bind(...args,(page-1)*30).all();return json({orders:rows.results.map(orderRow),total:count.count,page,pages:Math.max(1,Math.ceil(count.count/30))});
 }
 const orderMatch=path.match(/^\/api\/admin\/orders\/([a-f0-9-]{36})$/);
 if(orderMatch){
  if(method==='GET')return json(await orderDetail(env,orderMatch[1]));
  if(method==='PATCH'){const data=await body(request);const old=await env.DB.prepare('SELECT status,revision FROM orders WHERE id=?').bind(orderMatch[1]).first();if(!old)fail(404,'Commande introuvable.');if(data.revision!==old.revision)fail(409,'Commande modifiée entre-temps. Actualisez.');if(!transitions[old.status].includes(data.status))fail(400,'Changement de statut non autorisé.');const result=await env.DB.prepare('UPDATE orders SET status=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(data.status,new Date().toISOString(),orderMatch[1],data.revision).run();if(!result.meta.changes)fail(409,'Commande modifiée entre-temps.');return json(await orderDetail(env,orderMatch[1]));}
 }
 fail(404,'Route introuvable.');
}
export default {async fetch(request,env){try{return await handle(request,env);}catch(error){if(error instanceof HttpError)return json({error:error.message},error.status);const schemaMissing=missingSchema(error);console.error('Store API error',{kind:schemaMissing?'schema_missing':'database_unavailable',route:new URL(request.url).pathname});return json({error:schemaMissing?'La base du magasin doit être préparée. Connectez-vous à l’administration avec le mot de passe du magasin.':'Connexion à la base du magasin impossible. Vérifiez le binding D1 DB du Worker et les journaux Cloudflare.',code:schemaMissing?'DATABASE_SCHEMA_MISSING':'DATABASE_UNAVAILABLE'},503);}}};

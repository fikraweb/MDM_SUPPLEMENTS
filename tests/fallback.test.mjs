import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
test('Une base absente ne simule jamais une commande enregistrée',async()=>{
 const response=await worker.fetch(new Request('https://store.example/api/catalog'),{});const data=await response.json();assert.equal(data.checkoutEnabled,false);assert.equal(data.products.length,15);assert.equal(data.settings.freeShipping,true);
 const order=await worker.fetch(new Request('https://store.example/api/orders',{method:'POST',headers:{Origin:'https://store.example','Content-Type':'application/json'},body:'{}'}),{});assert.equal(order.status,503);assert.equal((await order.json()).reference,undefined);
 const admin=await worker.fetch(new Request('https://store.example/api/admin/orders'),{});assert.equal(admin.status,503);assert.equal(admin.headers.get('Cache-Control'),'no-store');
});

import { products as initialProducts } from './products.js';
let products = initialProducts;
let storeSettings = { freeShipping: true, shippingFee: 0, orderNotice: 'Paiement à la livraison. Livraison offerte partout au Maroc.' };
let checkoutEnabled = false;
let orderSubmitting = false;
let pendingSubmission = null;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const displayProduct = product => Object.fromEntries(Object.entries(product).map(([key,value]) => [key, typeof value === 'string' ? escapeHtml(value) : value]));
let selected='Tous', query='', cart=[];
try { const saved=JSON.parse(localStorage.getItem('mdm-cart')||'[]'); if(Array.isArray(saved)) cart=saved.filter(x=>products.some(p=>p.id===x.id)&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=99); } catch {}
const WHATSAPP_NUMBER = '212618194707';
const INSTAGRAM_URL = 'https://www.instagram.com/mdm_supplements/';
const whatsappIcon = '<svg class="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.7A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8 7.5c-.5 0-1 1-1 1.7 0 2.7 3.4 6.1 6.2 6.1.8 0 1.8-.6 1.8-1.1l-2.2-1.3-.9.8c-1.3-.6-2.4-1.7-3-3l.7-.9L8.4 7.5H8Z"/></svg>';
const instagramIcon = '<svg class="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>';
const contactWhatsAppUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Bonjour MDM Supplements, je souhaite avoir des renseignements sur vos produits.')}`;
const money=n=>`${n.toLocaleString('fr-MA')} DH`;
const productPhoto = product => `<div class="product-photo"><img src="${product.cutout}" alt="${product.name} — visuel détouré reconstitué" width="1024" height="1024" loading="lazy" decoding="async"></div>`;
const expandIcon = '<svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
document.querySelector('#app').innerHTML=`
<header class="site-header"><a class="logo header-logo" href="#" aria-label="MDM Supplements accueil"><img src="/images/mdm-logo-light.svg" alt="MDM Supplements" width="166" height="72"><span class="brand-caption">NUTRITION<br>PERFORMANCE</span></a><nav aria-label="Navigation principale"><a class="nav-shop" href="#collection"><span class="nav-index" aria-hidden="true">01</span> La boutique</a><a href="#engagements"><span class="nav-index" aria-hidden="true">02</span> Notre approche</a></nav><div class="header-actions"><a class="header-instagram" href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer" aria-label="Instagram MDM Supplements">${instagramIcon}</a><button class="cart-trigger" aria-label="Ouvrir le panier"><svg class="bag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg><span class="cart-label">Panier</span><span id="count">0</span><svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></button></div></header>
<main><section class="campaign-hero" aria-labelledby="hero-title">
<div class="campaign-inner"><figure class="campaign-art"><span class="campaign-art-label">LA SÉLECTION MDM / 01</span><img class="campaign-products" src="/images/hero-products.png" width="1536" height="1024" fetchpriority="high" alt="Présentation reconstituée de MuscleLabs ISO PRO 100, BioTechUSA ISO WHEY ZERO et Applied Nutrition Créatine Monohydrate"><img class="campaign-seal" src="/images/mdm-logo-light.svg" width="224" height="98" alt="MDM Supplements"><figcaption>PROTÉINES · ISOLATE · CRÉATINE</figcaption></figure>
<div class="campaign-copy"><div class="campaign-eyebrow"><span></span> NUTRITION SPORTIVE</div><h1 id="hero-title">La qualité et<br> la confiance,<br><em>nos fondations.</em></h1><div class="store-bio"><p>Qualité certifiée, confiance garantie.</p><span>Livraison partout au Maroc</span></div><a class="shop-link" href="#collection">Découvrir la boutique <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></a><a class="hero-instagram" href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer">${instagramIcon} @mdm_supplements</a></div></div>
</section>
<div class="values-strip"><span>UNE SÉLECTION ESSENTIELLE</span><i>✳</i><span>POUR CHAQUE OBJECTIF</span><i>✳</i><span>LE GOÛT DE PROGRESSER</span><i>✳</i><span>À VOTRE RYTHME</span></div>
<section class="collection" id="collection"><div class="section-top"><div><div class="eyebrow">LE BON COMPLÉMENT, AU BON MOMENT</div><h2>Les essentiels.</h2></div><p>Construisez la routine<br>qui vous ressemble.</p></div><div class="catalog-tools"><div class="filters" role="group" aria-label="Filtrer par catégorie">${['Tous','Packs','Protéines','Gainers','Créatine','Pré-workout','Glucides','Acides aminés','Bien-être'].map((c,i)=>`<button data-category="${c}" class="filter ${i===0?'active':''}" aria-pressed="${i===0}">${c}</button>`).join('')}</div><label class="search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Rechercher un produit" aria-label="Rechercher un produit"></label></div><div id="products" class="products"></div><p class="demo-note">Les prix des offres sont repris des photos Instagram. Les autres prix sont estimatifs et signalés. Validation des éventuels tarifs estimatifs et de la disponibilité par le magasin après réception du bon de commande. Visuels illustratifs reconstitués d’après les photos du magasin.</p></section>
<section class="approach" id="engagements"><div><div class="eyebrow">L’APPROCHE MDM</div><h2>La progression,<br>c’est une <em>habitude.</em></h2></div><div><p>Pas de raccourci. Une bonne alimentation, du mouvement, de la régularité — et les compléments adaptés à votre routine.</p><div class="principles"><span>01 <b>Qualité certifiée</b></span><span>02 <b>Confiance garantie</b></span><span>03 <b>Livraison partout au Maroc</b></span></div><small>Les compléments ne remplacent pas une alimentation variée. Demandez conseil à un professionnel de santé selon vos besoins.</small></div></section></main>
<footer><a class="logo" href="#"><img src="/images/mdm-logo-light.svg" alt="MDM Supplements" width="166" height="72"></a><div class="footer-contact"><span>Contact : <a href="tel:+212618194707">06 18 19 47 07</a></span><div><a href="${contactWhatsAppUrl}" target="_blank" rel="noopener noreferrer">${whatsappIcon} WhatsApp</a><a href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer">${instagramIcon} Instagram</a></div></div><small>© ${new Date().getFullYear()} MDM Supplements</small></footer>
<dialog id="product-dialog" class="product-dialog" aria-labelledby="product-modal-title"><button type="button" class="product-close" aria-label="Fermer les détails du produit">✕</button><div id="product-modal-content"></div></dialog>
<dialog id="cart"><div class="drawer-head"><h2>Votre panier<span>.</span></h2><button class="close" aria-label="Fermer le panier">✕</button></div><div id="cart-items"></div><div class="cart-footer"><div class="cart-subtotal">Sous-total <span id="cart-subtotal"></span></div><div class="cart-subtotal">Livraison <span id="cart-shipping">Offerte</span></div><div class="total">Total <strong id="total"></strong></div><p class="order-help" id="order-notice">Paiement à la livraison. Livraison offerte partout au Maroc.</p><p class="order-demo-note">Les éventuels prix estimatifs restent à valider par le magasin avant traitement.</p><p id="checkout-service" class="checkout-service" role="status">Connexion au service de commandes…</p><form id="order-form" class="checkout-form"><h3>Vos coordonnées</h3><label>Nom complet<input name="name" autocomplete="name" minlength="2" maxlength="100" required></label><div class="checkout-grid"><label>Téléphone<input name="phone" type="tel" autocomplete="tel" placeholder="0612345678" maxlength="25" required></label><label>Ville<input name="city" autocomplete="address-level2" minlength="2" maxlength="80" required></label></div><label>Adresse de livraison<textarea name="address" autocomplete="street-address" minlength="5" maxlength="300" required></textarea></label><label>Note pour le magasin (facultatif)<textarea name="notes" maxlength="500"></textarea></label><p class="checkout-privacy">Vos coordonnées servent au traitement et à la livraison de votre commande. Elles sont accessibles à l’administration du magasin.</p><p id="order-error" class="checkout-error" role="alert"></p><button class="checkout-submit" id="confirm-order" type="submit" disabled>Confirmer ma commande</button><small class="checkout-note">Le magasin reçoit votre commande dans son espace de gestion.</small></form><div id="order-receipt" hidden role="status"></div><button class="primary continue">Continuer mes achats <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></button></div></dialog><a class="whatsapp-float" href="${contactWhatsAppUrl}" target="_blank" rel="noopener noreferrer" aria-label="Contacter MDM Supplements sur WhatsApp">${whatsappIcon}<span>WhatsApp</span></a><div id="toast" role="status" aria-live="polite"></div>`;
function renderProducts() {
  const list = products.filter(product =>
    (selected === 'Tous' || product.category === selected) &&
    `${product.name} ${product.brand} ${product.detail} ${product.category}`.toLocaleLowerCase('fr').includes(query)
  );
  document.querySelector('#products').innerHTML = list.length ? list.map(rawProduct => { const product = displayProduct(rawProduct); return `
    <article class="product" data-product="${product.id}">
      <button type="button" class="product-art product-art-photo" data-open-product="${product.id}" aria-label="Voir les détails de ${product.name}"><span class="product-frame-tag">${product.category}</span><span class="product-frame-word" aria-hidden="true">MDM</span>${productPhoto(product)}<span class="product-expand">${expandIcon}</span></button>
      <div class="product-info"><div><span class="category">${product.brand}</span><h3><button type="button" class="product-title" data-open-product="${product.id}">${product.name}</button></h3><p>${product.detail}</p></div><button class="add" data-id="${product.id}" aria-label="Ajouter ${product.name} au panier" ${product.stock === 0 ? 'disabled' : ''}><svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></button></div>
      <div class="product-price-line"><strong class="price">${money(product.price)}</strong><span class="price-origin ${product.priceSource === 'estimate' ? 'estimated' : ''}">${product.priceSource === 'estimate' ? 'Prix estimatif' : product.priceSource === 'fixed' ? 'Prix du magasin' : 'Prix de la publication'}</span></div>
      ${storeSettings.freeShipping ? '<p class="offer-note">Livraison offerte partout au Maroc</p>' : ''}
    </article>`; }).join('') : '<p class="empty">Aucun produit trouvé. Essayez une autre recherche.</p>';
}
function renderCart(){document.querySelector('#confirm-order').disabled=cart.length===0||!checkoutEnabled||orderSubmitting;document.querySelector('#order-form').hidden=cart.length===0;document.querySelector('#count').textContent=cart.reduce((s,x)=>s+x.qty,0);const subtotal=cart.reduce((s,x)=>s+products.find(p=>p.id===x.id).price*x.qty,0);const shipping=storeSettings.freeShipping?0:storeSettings.shippingFee;document.querySelector('#cart-subtotal').textContent=money(subtotal);document.querySelector('#cart-shipping').textContent=shipping===0?'Offerte':money(shipping);document.querySelector('#total').textContent=money(subtotal+(cart.length?shipping:0));document.querySelector('#cart-items').innerHTML=cart.length?cart.map(x=>{const p=displayProduct(products.find(p=>p.id===x.id));return `<div class="cart-row"><div class="cart-mini">${productPhoto(p)}</div><div class="cart-detail"><h3>${p.name}</h3><small>${p.detail}</small>${p.priceSource === 'estimate' ? '<small class="cart-price-estimate">Prix estimatif · à confirmer</small>' : ''}<div class="quantity"><button data-change="-1" data-id="${p.id}" aria-label="Diminuer la quantité de ${p.name}">−</button><span>${x.qty}</span><button data-change="1" data-id="${p.id}" aria-label="Augmenter la quantité de ${p.name}">+</button></div></div><div><strong>${money(p.price*x.qty)}</strong><button class="remove" data-remove="${p.id}">Retirer</button></div></div>`}).join(''):'<div class="empty"><span>✳</span><h3>Votre routine commence ici.</h3><p>Ajoutez vos premiers essentiels au panier.</p></div>';try{localStorage.setItem('mdm-cart',JSON.stringify(cart))}catch{}}
let toastTimer;
let activeProduct = null;
let detailQuantity = 1;
const productDialog = document.querySelector('#product-dialog');
function addToCart(id, quantity = 1) {
  const product = products.find(p => p.id === id);
  if (!product || product.stock === 0) return;
  document.querySelector('#order-receipt').hidden = true;
  const available = product.stock == null ? 99 : Math.min(99, product.stock);
  const entry = cart.find(item => item.id === id);
  if (entry) entry.qty = Math.min(available, entry.qty + quantity);
  else cart.push({ id, qty: Math.min(available, quantity) });
  renderCart();
  const toast = document.querySelector('#toast');
  toast.textContent = 'Ajouté au panier ✓';
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2200);
}
function updateDetailQuantity() {
  document.querySelector('#detail-quantity').textContent = detailQuantity;
  document.querySelector('[data-detail-change="-1"]').disabled = detailQuantity === 1;
  document.querySelector('[data-detail-change="1"]').disabled = detailQuantity >= Math.min(99, activeProduct.stock ?? 99);
  document.querySelector('.detail-add').disabled = activeProduct.stock === 0;
  document.querySelector('#detail-line-total').textContent = money(activeProduct.price * detailQuantity);
}
function openProduct(id) {
  activeProduct = products.find(product => product.id === id);
  if (!activeProduct) return;
  detailQuantity = 1;
  const product = displayProduct(activeProduct);
  document.querySelector('#product-modal-content').innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-visual"><span class="detail-edition">MDM / LA SÉLECTION</span>${productPhoto(product)}<span class="detail-visual-caption">${product.category}<small>Visuel illustratif</small></span></div>
      <div class="product-detail-copy"><div class="detail-brand">${product.brand}</div><h2 id="product-modal-title">${product.name}</h2><p class="detail-description">${product.detail}</p>
      <div class="detail-price"><strong>${money(product.price)}</strong><span class="price-origin ${product.priceSource === 'estimate' ? 'estimated' : ''}">${product.priceSource === 'estimate' ? 'Prix estimatif' : product.priceSource === 'fixed' ? 'Prix du magasin' : 'Prix de la publication'}</span></div>
      <dl class="detail-facts"><div><dt>Catégorie</dt><dd>${product.category}</dd></div><div><dt>Livraison</dt><dd>${storeSettings.freeShipping ? 'Offerte partout au Maroc' : `Partout au Maroc · ${money(storeSettings.shippingFee)}`}</dd></div><div><dt>Disponibilité</dt><dd>À confirmer avec le magasin</dd></div></dl>
      <p class="detail-price-note">${product.priceSource === 'estimate' ? 'Ce prix est une estimation provisoire. Le magasin validera le tarif définitif avant traitement.' : product.priceSource === 'fixed' ? 'Prix fixé par le magasin.' : 'Offre reprise de la publication Instagram. Le magasin validera sa validité avant traitement.'}</p>
      <div class="detail-quantity-row"><span>Quantité</span><div class="detail-quantity"><button type="button" data-detail-change="-1" aria-label="Diminuer la quantité du produit">−</button><span id="detail-quantity">1</span><button type="button" data-detail-change="1" aria-label="Augmenter la quantité du produit">+</button></div><strong id="detail-line-total">${money(product.price)}</strong></div>
      <button type="button" class="detail-add">Ajouter au panier <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></button><button type="button" class="detail-view-cart">Voir mon panier</button><p class="detail-confirm-note">Commande sur le site · Paiement à la livraison · ${storeSettings.freeShipping ? 'Livraison offerte' : 'Livraison au Maroc'}.</p></div>
    </div>`;
  updateDetailQuantity();
  productDialog.showModal();
  productDialog.scrollTop = 0;
}
function closeOnBackdrop(event) {
  if (event.target !== event.currentTarget) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
}
productDialog.addEventListener('click', closeOnBackdrop);
document.querySelector('.product-close').addEventListener('click', () => productDialog.close());
document.addEventListener('click', event => {
  const filter = event.target.closest('[data-category]');
  if (filter) {
    selected = filter.dataset.category;
    document.querySelectorAll('.filter').forEach(button => {
      button.classList.toggle('active', button === filter);
      button.setAttribute('aria-pressed', String(button === filter));
    });
    renderProducts();
  }
  const add = event.target.closest('.add');
  if (add) { addToCart(Number(add.dataset.id)); return; }
  const open = event.target.closest('[data-open-product]');
  if (open) { openProduct(Number(open.dataset.openProduct)); return; }
  const card = event.target.closest('.product[data-product]');
  if (card && !event.target.closest('button,a')) { openProduct(Number(card.dataset.product)); return; }
  const detailChange = event.target.closest('[data-detail-change]');
  if (detailChange) { detailQuantity = Math.max(1, Math.min(99, detailQuantity + Number(detailChange.dataset.detailChange), activeProduct.stock ?? 99)); updateDetailQuantity(); }
  if (event.target.closest('.detail-add') && activeProduct) addToCart(activeProduct.id, detailQuantity);
  if (event.target.closest('.detail-view-cart')) { productDialog.close(); dialog.showModal(); }
  const change = event.target.closest('[data-change]');
  if (change) {
    const entry = cart.find(item => item.id === Number(change.dataset.id));
    entry.qty = Math.min(99, entry.qty + Number(change.dataset.change));
    cart = cart.filter(item => item.qty > 0);
    renderCart();
  }
  const remove = event.target.closest('[data-remove]');
  if (remove) { cart = cart.filter(item => item.id !== Number(remove.dataset.remove)); renderCart(); }
});
document.querySelector('input[type=search]').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('fr');renderProducts()});const dialog=document.querySelector('#cart');document.querySelector('.cart-trigger').onclick=()=>dialog.showModal();document.querySelectorAll('.close,.continue').forEach(b=>b.onclick=()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});renderProducts();renderCart();

async function loadCatalog() {
  try {
    const response = await fetch('/api/catalog', { cache: 'no-store' });
    if (!response.ok) throw Error('Service indisponible.');
    const data = await response.json();
    const ids = new Set(data.products.map(product => product.id));
    const removed = cart.some(item => !ids.has(item.id));
    products = data.products;
    cart = cart.filter(item => ids.has(item.id));
    storeSettings = data.settings;
    checkoutEnabled = data.checkoutEnabled;
    const categories = ['Tous', ...new Set(products.map(product => product.category))];
    if (!categories.includes(selected)) selected = 'Tous';
    document.querySelector('.filters').innerHTML = categories.map(category => `<button data-category="${escapeHtml(category)}" class="filter ${category === selected ? 'active' : ''}" aria-pressed="${category === selected}">${escapeHtml(category)}</button>`).join('');
    document.querySelector('#order-notice').textContent = storeSettings.orderNotice;
    document.querySelector('#checkout-service').textContent = checkoutEnabled ? '' : 'La prise de commandes est en cours de configuration. Réessayez plus tard.';
    if (removed) document.querySelector('#order-error').textContent = 'Un produit de votre panier n’est plus disponible et a été retiré.';
    const number = storeSettings.phone.replace(/[^+0-9]/g, '');
    const contact = `https://wa.me/${number.replace(/^0/,'212').replace(/^\+/,'')}?text=${encodeURIComponent('Bonjour, je souhaite des renseignements sur vos produits.')}`;
    document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => link.href = contact);
    document.querySelectorAll('a[href^="tel:"]').forEach(link => { link.href = 'tel:' + number; link.textContent = storeSettings.phone; });
    document.querySelectorAll('a[href^="https://www.instagram.com/"],a[href^="https://instagram.com/"]').forEach(link => link.href = storeSettings.instagram);
    document.querySelector('.store-bio>span').textContent = storeSettings.freeShipping ? 'Livraison offerte partout au Maroc' : 'Livraison partout au Maroc';
    renderProducts();renderCart();
  } catch {
    checkoutEnabled = false;
    document.querySelector('#checkout-service').textContent = 'Le service de commandes est temporairement indisponible. Réessayez plus tard.';
    renderCart();
  }
}
document.querySelector('#order-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!checkoutEnabled || !cart.length || orderSubmitting) return;
  const form = event.currentTarget;
  const customer = Object.fromEntries([...new FormData(form)].map(([key,value]) => [key,value.trim()]));
  const payload = {customer,items:cart.map(item => ({id:item.id,qty:item.qty})),expectedTotalCents:Math.round((cart.reduce((sum,item)=>sum+products.find(p=>p.id===item.id).price*item.qty,0)+(storeSettings.freeShipping?0:storeSettings.shippingFee))*100)};
  const signature = JSON.stringify(payload);
  if (!pendingSubmission || pendingSubmission.signature !== signature) pendingSubmission = {signature,key:crypto.randomUUID()};
  orderSubmitting = true;
  const button = document.querySelector('#confirm-order');button.disabled = true;button.textContent = 'Enregistrement…';
  document.querySelector('#order-error').textContent = '';
  try {
    const response = await fetch('/api/orders', {method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':pendingSubmission.key},body:JSON.stringify(payload)});
    const data = await response.json();
    if (!response.ok) { if (response.status === 409) await loadCatalog(); throw Error(data.error || 'Impossible d’enregistrer la commande. Réessayez.'); }
    cart = []; pendingSubmission = null; form.reset();renderCart();
    const receipt = document.querySelector('#order-receipt');
    receipt.innerHTML = `<div class="receipt-check" aria-hidden="true">✓</div><h3>Votre commande a bien été reçue.</h3><p>Référence à conserver</p><strong>${escapeHtml(data.reference)}</strong><div class="receipt-total">${money(data.total)} · ${data.shipping === 0 ? 'Livraison offerte' : 'Livraison incluse'}</div><p>Paiement à la livraison. Le magasin traitera votre commande et vous contactera si nécessaire.</p>`;
    receipt.hidden = false;receipt.scrollIntoView({block:'nearest'});
  } catch (error) {
    document.querySelector('#order-error').textContent = error.message || 'Connexion interrompue. Réessayez avec les mêmes informations.';
  } finally {orderSubmitting = false;button.textContent = 'Confirmer ma commande';renderCart();}
});
loadCatalog();

import { products } from './products.js';
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
<section class="collection" id="collection"><div class="section-top"><div><div class="eyebrow">LE BON COMPLÉMENT, AU BON MOMENT</div><h2>Les essentiels.</h2></div><p>Construisez la routine<br>qui vous ressemble.</p></div><div class="catalog-tools"><div class="filters" role="group" aria-label="Filtrer par catégorie">${['Tous','Packs','Protéines','Gainers','Créatine','Pré-workout','Glucides','Acides aminés','Bien-être'].map((c,i)=>`<button data-category="${c}" class="filter ${i===0?'active':''}" aria-pressed="${i===0}">${c}</button>`).join('')}</div><label class="search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Rechercher un produit" aria-label="Rechercher un produit"></label></div><div id="products" class="products"></div><p class="demo-note">Les prix des offres sont repris des photos Instagram. Les autres prix sont estimatifs et signalés. Disponibilité, offres et total avec livraison à confirmer sur WhatsApp. Visuels illustratifs reconstitués d’après les photos du magasin.</p></section>
<section class="approach" id="engagements"><div><div class="eyebrow">L’APPROCHE MDM</div><h2>La progression,<br>c’est une <em>habitude.</em></h2></div><div><p>Pas de raccourci. Une bonne alimentation, du mouvement, de la régularité — et les compléments adaptés à votre routine.</p><div class="principles"><span>01 <b>Qualité certifiée</b></span><span>02 <b>Confiance garantie</b></span><span>03 <b>Livraison partout au Maroc</b></span></div><small>Les compléments ne remplacent pas une alimentation variée. Demandez conseil à un professionnel de santé selon vos besoins.</small></div></section></main>
<footer><a class="logo" href="#"><img src="/images/mdm-logo-light.svg" alt="MDM Supplements" width="166" height="72"></a><div class="footer-contact"><span>Pour commander : <a href="tel:+212618194707">06 18 19 47 07</a></span><div><a href="${contactWhatsAppUrl}" target="_blank" rel="noopener noreferrer">${whatsappIcon} WhatsApp</a><a href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer">${instagramIcon} Instagram</a></div></div><small>© ${new Date().getFullYear()} MDM Supplements</small></footer>
<dialog id="product-dialog" class="product-dialog" aria-labelledby="product-modal-title"><button type="button" class="product-close" aria-label="Fermer les détails du produit">✕</button><div id="product-modal-content"></div></dialog>
<dialog id="cart"><div class="drawer-head"><h2>Votre panier<span>.</span></h2><button class="close" aria-label="Fermer le panier">✕</button></div><div id="cart-items"></div><div class="cart-footer"><div class="total">Sous-total <strong id="total"></strong></div><p class="order-help">Votre panier sera préparé dans un message WhatsApp. Envoyez-le pour demander la confirmation du stock, des prix et de la livraison.</p><p class="order-demo-note">Les prix estimatifs et les promotions des publications restent à confirmer avec le magasin.</p><button class="whatsapp-checkout" id="confirm-order" type="button" disabled>${whatsappIcon} Confirmer via WhatsApp</button><small class="checkout-note">La commande sera confirmée par le magasin après votre échange.</small><button class="primary continue">Continuer mes achats <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></button></div></dialog><a class="whatsapp-float" href="${contactWhatsAppUrl}" target="_blank" rel="noopener noreferrer" aria-label="Contacter MDM Supplements sur WhatsApp">${whatsappIcon}<span>WhatsApp</span></a><div id="toast" role="status" aria-live="polite"></div>`;
function renderProducts() {
  const list = products.filter(product =>
    (selected === 'Tous' || product.category === selected) &&
    `${product.name} ${product.brand} ${product.detail} ${product.category}`.toLocaleLowerCase('fr').includes(query)
  );
  document.querySelector('#products').innerHTML = list.length ? list.map(product => `
    <article class="product" data-product="${product.id}">
      <button type="button" class="product-art product-art-photo" data-open-product="${product.id}" aria-label="Voir les détails de ${product.name}"><span class="product-frame-tag">${product.category}</span><span class="product-frame-word" aria-hidden="true">MDM</span>${productPhoto(product)}<span class="product-expand">${expandIcon}</span></button>
      <div class="product-info"><div><span class="category">${product.brand}</span><h3><button type="button" class="product-title" data-open-product="${product.id}">${product.name}</button></h3><p>${product.detail}</p></div><button class="add" data-id="${product.id}" aria-label="Ajouter ${product.name} au panier"><svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></button></div>
      <div class="product-price-line"><strong class="price">${money(product.price)}</strong><span class="price-origin ${product.priceSource === 'estimate' ? 'estimated' : ''}">${product.priceSource === 'estimate' ? 'Prix estimatif' : 'Prix de la publication'}</span></div>
      ${product.freeDelivery ? '<p class="offer-note">Livraison offerte sur la publication · à confirmer</p>' : ''}
    </article>`).join('') : '<p class="empty">Aucun produit trouvé. Essayez une autre recherche.</p>';
}
function renderCart(){document.querySelector('#confirm-order').disabled=cart.length===0;document.querySelector('#count').textContent=cart.reduce((s,x)=>s+x.qty,0);document.querySelector('#total').textContent=money(cart.reduce((s,x)=>s+products.find(p=>p.id===x.id).price*x.qty,0));document.querySelector('#cart-items').innerHTML=cart.length?cart.map(x=>{const p=products.find(p=>p.id===x.id);return `<div class="cart-row"><div class="cart-mini">${productPhoto(p)}</div><div class="cart-detail"><h3>${p.name}</h3><small>${p.detail}</small>${p.priceSource === 'estimate' ? '<small class="cart-price-estimate">Prix estimatif · à confirmer</small>' : ''}<div class="quantity"><button data-change="-1" data-id="${p.id}" aria-label="Diminuer la quantité de ${p.name}">−</button><span>${x.qty}</span><button data-change="1" data-id="${p.id}" aria-label="Augmenter la quantité de ${p.name}">+</button></div></div><div><strong>${money(p.price*x.qty)}</strong><button class="remove" data-remove="${p.id}">Retirer</button></div></div>`}).join(''):'<div class="empty"><span>✳</span><h3>Votre routine commence ici.</h3><p>Ajoutez vos premiers essentiels au panier.</p></div>';try{localStorage.setItem('mdm-cart',JSON.stringify(cart))}catch{}}
let toastTimer;
let activeProduct = null;
let detailQuantity = 1;
const productDialog = document.querySelector('#product-dialog');
function addToCart(id, quantity = 1) {
  const entry = cart.find(item => item.id === id);
  if (entry) entry.qty = Math.min(99, entry.qty + quantity);
  else cart.push({ id, qty: Math.min(99, quantity) });
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
  document.querySelector('[data-detail-change="1"]').disabled = detailQuantity === 99;
  document.querySelector('#detail-line-total').textContent = money(activeProduct.price * detailQuantity);
}
function openProduct(id) {
  activeProduct = products.find(product => product.id === id);
  if (!activeProduct) return;
  detailQuantity = 1;
  const product = activeProduct;
  document.querySelector('#product-modal-content').innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-visual"><span class="detail-edition">MDM / LA SÉLECTION</span>${productPhoto(product)}<span class="detail-visual-caption">${product.category}<small>Visuel illustratif</small></span></div>
      <div class="product-detail-copy"><div class="detail-brand">${product.brand}</div><h2 id="product-modal-title">${product.name}</h2><p class="detail-description">${product.detail}</p>
      <div class="detail-price"><strong>${money(product.price)}</strong><span class="price-origin ${product.priceSource === 'estimate' ? 'estimated' : ''}">${product.priceSource === 'estimate' ? 'Prix estimatif' : 'Prix de la publication'}</span></div>
      <dl class="detail-facts"><div><dt>Catégorie</dt><dd>${product.category}</dd></div><div><dt>Livraison</dt><dd>${product.freeDelivery ? 'Offerte sur la publication · à confirmer' : 'Partout au Maroc · frais à confirmer'}</dd></div><div><dt>Disponibilité</dt><dd>À confirmer avec le magasin</dd></div></dl>
      <p class="detail-price-note">${product.priceSource === 'estimate' ? 'Ce prix est une estimation provisoire. Le magasin confirmera le tarif définitif sur WhatsApp.' : 'Offre reprise de la publication Instagram. Le magasin confirmera sa validité sur WhatsApp.'}</p>
      <div class="detail-quantity-row"><span>Quantité</span><div class="detail-quantity"><button type="button" data-detail-change="-1" aria-label="Diminuer la quantité du produit">−</button><span id="detail-quantity">1</span><button type="button" data-detail-change="1" aria-label="Augmenter la quantité du produit">+</button></div><strong id="detail-line-total">${money(product.price)}</strong></div>
      <button type="button" class="detail-add">Ajouter au panier <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg></button><button type="button" class="detail-view-cart">Voir mon panier</button><p class="detail-confirm-note">Confirmation de votre commande via WhatsApp.</p></div>
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
  if (detailChange) { detailQuantity = Math.max(1, Math.min(99, detailQuantity + Number(detailChange.dataset.detailChange))); updateDetailQuantity(); }
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

function buildOrderWhatsAppUrl() {
  const lines = cart.map(item => {
    const product = products.find(product => product.id === item.id);
    return `• ${product.name} — ${product.brand}\n  ${product.detail}\n  ${item.qty} × ${money(product.price)} = ${money(product.price * item.qty)} (${product.priceSource === 'estimate' ? 'prix estimatif' : 'prix de la publication'})${product.offerNote ? `\n  ${product.offerNote}` : ''}`;
  });
  const subtotal = cart.reduce((sum, item) => sum + products.find(product => product.id === item.id).price * item.qty, 0);
  const message = [
    'Bonjour MDM Supplements,',
    'Je souhaite confirmer ma commande :',
    '',
    ...lines,
    '',
    `Sous-total indicatif : ${money(subtotal)}`,
    'Frais de livraison : à confirmer selon la ville.',
    '',
    'Nom :',
    'Ville :',
    'Adresse de livraison :',
    '',
    'Merci de confirmer la disponibilité, les prix définitifs et le total avec livraison.',
    'Les prix estimatifs et les offres des publications restent à confirmer avec le magasin.'
  ].join('\n');
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
document.querySelector('#confirm-order').addEventListener('click', () => {
  if (cart.length === 0) return;
  window.open(buildOrderWhatsAppUrl(), '_blank', 'noopener,noreferrer');
});

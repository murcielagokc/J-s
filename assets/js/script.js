/**
 * =================================================================
 * ARCHIVO: script.js (Versión Final Completa y Optimizada)
 * =================================================================
 * ÍNDICE:
 * 1. CONFIGURACIÓN Y ESTADO GLOBAL
 * 2. GESTIÓN DE DATOS (API & Procesamiento)
 * 3. GESTIÓN DEL CARRITO (localStorage)
 * 4. RENDERIZADO (Creación de HTML)
 * 5. LÓGICA DE LA APLICACIÓN Y MANEJADORES DE EVENTOS
 * 6. INICIALIZACIÓN (Punto de entrada principal)
 * =================================================================
 */

// =================================================================
// 1. CONFIGURACIÓN Y ESTADO GLOBAL
// =================================================================
const GOOGLE_SHEET_URLS = {
    products: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5t3Zo_hycBKJ-YknvVAvKK01MAYYqW1IQFvbHa90yIy4J5FzilidJYrEk35DSQsNBQ5IEYR185Uwu/pub?gid=0&single=true&output=tsv',
    types: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5t3Zo_hycBKJ-YknvVAvKK01MAYYqW1IQFvbHa90yIy4J5FzilidJYrEk35DSQsNBQ5IEYR185Uwu/pub?gid=868992117&single=true&output=tsv',
    specs: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5t3Zo_hycBKJ-YknvVAvKK01MAYYqW1IQFvbHa90yIy4J5FzilidJYrEk35DSQsNBQ5IEYR185Uwu/pub?gid=63815658&single=true&output=tsv',
    brands: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5t3Zo_hycBKJ-YknvVAvKK01MAYYqW1IQFvbHa90yIy4J5FzilidJYrEk35DSQsNBQ5IEYR185Uwu/pub?gid=55436752&single=true&output=tsv',      // <-- AÑADE LA URL DE MARCAS
    images: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5t3Zo_hycBKJ-YknvVAvKK01MAYYqW1IQFvbHa90yIy4J5FzilidJYrEk35DSQsNBQ5IEYR185Uwu/pub?gid=1933239311&single=true&output=tsv' 
};

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('J&SCart')) || [];
let currentFilteredProducts = [];
let productsVisibleCount = 9;
const PRODUCTS_PER_PAGE = 9;
const CURRENCY_SYMBOL = 'S/';
const WHATSAPP_NUMBER = '937122927'; 

// =================================================================
// 2. PUNTO DE ENTRADA PRINCIPAL
// =================================================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        showLoadingState();
        const [productsData, typesData, specsData, brandsData, imagesData] = await Promise.all([
            fetchData(GOOGLE_SHEET_URLS.products),
            fetchData(GOOGLE_SHEET_URLS.types),
            fetchData(GOOGLE_SHEET_URLS.specs),
            fetchData(GOOGLE_SHEET_URLS.brands),
            fetchData(GOOGLE_SHEET_URLS.images)
        ]);
        allProducts = processData(productsData, typesData, specsData, brandsData, imagesData);
        initializeApp();
    } catch (error) {
        console.error("FALLO CRÍTICO al cargar los datos:", error);
        showErrorState(error.message);
    }
});

// =================================================================
// 3. LÓGICA DE INICIALIZACIÓN
// =================================================================
function initializeApp() {
    if (document.getElementById('featured-products-grid')) showFeaturedProducts();
    if (document.getElementById('results-grid')) initializeSearchResultsPage();
    if (document.getElementById('product-detail-container')) displayProductDetails();
    if (document.getElementById('cart-items-container')) renderCartPage();
    updateCartCount();
    initializeSearchBars();
    initializeMobileMenu();
    initializeCartPanel();
}

// =================================================================
// 4. GESTIÓN DE DATOS (API & Procesamiento)
// =================================================================
async function fetchData(url) {
    if (!url || !url.startsWith('http')) {
        throw new Error(`URL no válida o no configurada: ${url}`);
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error de red al cargar: ${url}`);
    const tsvText = await response.text();
    return tsvText.trim().split('\n').slice(1).filter(row => row.trim() !== '').map(row => row.split('\t'));
}

function processData(productsData, typesData, specsData, brandsData, imagesData) {
    const typesMap = new Map();
    typesData.forEach(row => {
        // Nos aseguramos de que la fila tenga un ID y un nombre antes de añadirla
        if (row && row[0] && row[1]) {
            typesMap.set(row[0].trim(), row[1].trim());
        }
    });
    const brandsMap = new Map();
    brandsData.forEach(row => {
        if (row && row[0] && row[1]) {
            brandsMap.set(row[0].trim(), row[1].trim());
        }
    });
    const specsMap = new Map();
    const imagesMap = new Map();

    specsData.forEach(row => { if (row && row[0]) { const spec = { name: row[1], value: row[2] }; if (!specsMap.has(row[0])) specsMap.set(row[0], []); specsMap.get(row[0]).push(spec); }});
    imagesData.sort((a, b) => a[2] - b[2]).forEach(row => { if (row && row[0]) { if (!imagesMap.has(row[0])) imagesMap.set(row[0], []); imagesMap.get(row[0]).push(row[1]); }});

    return productsData.filter(p => p && p.length >= 7 && p[0]).map(pData => {
        const productImages = imagesMap.get(pData[0]) || [];
        return {
            id: pData[0], name: pData[1], description: pData[2], price: parseFloat(pData[3]) || 0.0,
            imageUrl: productImages.length > 0 ? productImages[0] : (pData[4] || ''), images: productImages,
            category: typesMap.get(pData[5]) || 'General', brand: brandsMap.get(pData[6]) || 'Sin Marca',
            stock: parseInt(pData[7], 10) || 0, salePrice: parseFloat(pData[8]) || null, groupId: pData[9] || null,
            specifications: specsMap.get(pData[0]) || []
        };
    });
}

// =================================================================
// 5. LÓGICA DE LA APLICACIÓN (Páginas, Filtros, Búsqueda)
// =================================================================

function initializeSearchBars() {
    document.querySelectorAll('#main-search-input, #desktop-search-input, #mobile-search-input').forEach(input => {
        const resultsId = input.id.replace('-input', '-results');
        input.addEventListener('input', (e) => handleSearchSuggestions(e, resultsId));
    });
}

function handleSearchSuggestions(event, resultsContainerId) {
    const searchTerm = event.target.value.toLowerCase();
    const resultsContainer = document.getElementById(resultsContainerId);
    if (!resultsContainer || searchTerm.length < 2) {
        if(resultsContainer) resultsContainer.style.display = 'none';
        return;
    }
    const matchedProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm)).slice(0, 5);
    resultsContainer.innerHTML = matchedProducts.length > 0 ? matchedProducts.map(p => `<a href="product-details.html?id=${p.id}" class="search-result-item"><img src="${p.imageUrl}" alt="${p.name}"><h4>${p.name}</h4></a>`).join('') : '<p style="padding: 1rem;">No hay coincidencias.</p>';
    resultsContainer.style.display = 'block';
}

// En tu archivo assets/js/script.js

function initializeSearchResultsPage() {
    const categoryFilter = document.getElementById('filter-category');
    const priceFilter = document.getElementById('filter-price');
    const priceValue = document.getElementById('price-value');
    const sortSelect = document.getElementById('sort-by');
    const brandsContainer = document.getElementById('filter-brands-container');
    const showMoreBtn = document.getElementById('show-more-btn');

    if (!categoryFilter || !priceFilter || !sortSelect) { console.error("Faltan elementos de filtro. Revisa los IDs en tu HTML."); return; }

    const uniqueCategories = [...new Set(allProducts.map(p => p.category))].sort();
    categoryFilter.innerHTML = '<option value="all">Todas</option>' + uniqueCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    if (brandsContainer) {
        const uniqueBrands = [...new Set(allProducts.map(p => p.brand))].sort();
        brandsContainer.innerHTML = uniqueBrands.map(brand => `<label><input type="checkbox" name="brand" value="${brand}"> ${brand}</label>`).join('');
    }

    function applyFiltersAndRender() {
        let filtered = [...allProducts]; // <--- Esta línea ahora es segura
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) { const q = query.toLowerCase(); document.getElementById('results-page-title').innerHTML = `Resultados para <span style="color: var(--primary-color);">'${q}'</span>`; filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)); }
        else { document.getElementById('results-page-title').textContent = 'Todos los Productos'; }
        if (categoryFilter.value !== 'all') filtered = filtered.filter(p => p.category === categoryFilter.value);
        const selectedBrands = [...document.querySelectorAll('input[name="brand"]:checked')].map(el => el.value);
        if (selectedBrands.length > 0) filtered = filtered.filter(p => selectedBrands.includes(p.brand));
        const maxPrice = parseInt(priceFilter.value, 10);
        if (priceValue) priceValue.textContent = `${CURRENCY_SYMBOL}${maxPrice}`;
        filtered = filtered.filter(p => (p.salePrice || p.price) <= maxPrice);
        const sortBy = sortSelect.value;
        if (sortBy === 'price-asc') filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
        else if (sortBy === 'price-desc') filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
        currentFilteredProducts = filtered;
        productsVisibleCount = PRODUCTS_PER_PAGE;
        renderProductGrid();
    }

    // --- EL LLAMADO SEGURO ---
    // Estos 'listeners' solo se crean DESPUÉS de que los datos están listos.
    categoryFilter.addEventListener('change', applyFiltersAndRender);
    priceFilter.addEventListener('input', applyFiltersAndRender);
    sortSelect.addEventListener('change', applyFiltersAndRender);
    if(brandsContainer) brandsContainer.addEventListener('change', applyFiltersAndRender);
    if(showMoreBtn) showMoreBtn.addEventListener('click', () => {
        productsVisibleCount += PRODUCTS_PER_PAGE;
        renderProductGrid();
    });
    applyFiltersAndRender();
}

function renderProductGrid() {
    const grid = document.getElementById('results-grid');
    const showMoreContainer = document.getElementById('show-more-container');
    const productsToRender = currentFilteredProducts.slice(0, productsVisibleCount);
    if (!grid || !showMoreContainer) return;
    grid.innerHTML = productsToRender.length > 0 ? productsToRender.map(renderProductCard).join('') : '<p>No se encontraron productos.</p>';
    showMoreContainer.style.display = productsVisibleCount >= currentFilteredProducts.length ? 'none' : 'block';
    updateResultsCount();
}

function updateResultsCount(){
     const countEl = document.getElementById('results-count');
     if(countEl) countEl.textContent = `Mostrando ${Math.min(productsVisibleCount, currentFilteredProducts.length)} de ${currentFilteredProducts.length} resultados`;
}

function showFeaturedProducts() {
    const container = document.getElementById('featured-products-grid');
    if (container) {
        const featured = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 4);
        container.innerHTML = featured.map(renderProductCard).join('');
    }
}

function displayProductDetails() {
    const container = document.getElementById('product-detail-container');
    if(container){
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const product = allProducts.find(p => p.id === productId);
        container.innerHTML = product ? renderProductDetailView(product) : '<p>Producto no encontrado.</p>';
    }
}

function changeMainImage(imgUrl, clickedThumbnail) {
    document.getElementById('main-product-image').src = imgUrl;
    document.querySelectorAll('.thumbnail-img').forEach(img => img.classList.remove('active'));
    clickedThumbnail.classList.add('active');
}

function handlePurchase(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        addToCart(productId);
        alert(`${product.name} ha sido añadido al carrito.`);
    }
}

// =================================================================
// 6. GESTIÓN DEL CARRITO
// =================================================================
function saveCart() { localStorage.setItem('J&SCart', JSON.stringify(cart)); }
function addToCart(productId) { const item = cart.find(p => p.id === productId); if (item) { item.quantity++; } else { const product = allProducts.find(p => p.id === productId); if(product) cart.push({ ...product, quantity: 1 }); } saveCart(); updateCartCount(); if (window.innerWidth <= 768) openCartPanel(); }
function removeFromCart(productId) { cart = cart.filter(item => item.id !== productId); saveCart(); renderCartPage(); }
function updateCartQuantity(productId, newQuantity) { const item = cart.find(p => p.id === productId); if (item) item.quantity = Math.max(1, newQuantity); saveCart(); renderCartPage(); }
function updateCartCount() { const total = cart.reduce((sum, item) => sum + item.quantity, 0); document.querySelectorAll('.cart-count').forEach(el => { el.textContent = total; el.style.display = total > 0 ? 'flex' : 'none'; }); }
function updateCartSummary() {
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    if (subtotalEl && totalEl) {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = 10.00; // Puedes ajustar el costo de envío si lo deseas
        const total = subtotal + shipping;
        subtotalEl.textContent = `${CURRENCY_SYMBOL}${subtotal.toFixed(2)}`;
        totalEl.textContent = `${CURRENCY_SYMBOL}${total.toFixed(2)}`;
    }
}
function renderCartPage() {
    renderCartItems();
    updateCartSummary();
    const whatsappBtn = document.getElementById('checkout-whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', generateWhatsAppMessageAndRedirect);
    }
}
function generateWhatsAppMessageAndRedirect() {
    if (cart.length === 0) {
        alert("Tu carrito está vacío. Añade productos antes de continuar.");
        return;
    }

    // 1. Encabezado del mensaje
    let message = "¡Hola J&S! 👋 Quiero realizar el siguiente pedido:\n\n";

    // 2. Lista de productos
    cart.forEach(item => {
        const itemTotal = item.salePrice || item.price;
        message += `*Producto:* ${item.name}\n`;
        message += `*Cantidad:* ${item.quantity}\n`;
        message += `*Precio Unit:* ${CURRENCY_SYMBOL}${itemTotal.toFixed(2)}\n\n`;
    });

    // 3. Cálculo del total y pie del mensaje
    const subtotal = cart.reduce((sum, item) => sum + ((item.salePrice || item.price) * item.quantity), 0);
    const shipping = 10.00;
    const total = subtotal + shipping;

    message += "-------------------------\n";
    message += `*Subtotal:* ${CURRENCY_SYMBOL}${subtotal.toFixed(2)}\n`;
    message += `*Envío:* ${CURRENCY_SYMBOL}${shipping.toFixed(2)}\n`;
    message += `*TOTAL A PAGAR:* *${CURRENCY_SYMBOL}${total.toFixed(2)}*\n\n`;
    message += "Quedo a la espera de las instrucciones para el pago. ¡Gracias!";

    // 4. Codificar y crear el enlace de WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    // 5. Abrir WhatsApp en una nueva pestaña
    window.open(whatsappURL, '_blank');
}
// =================================================================
// 7. PANELES MÓVILES (Menú y Carrito)
// =================================================================
function initializeMobileMenu() { const openBtn = document.getElementById('mobile-menu-btn'); const closeBtn = document.getElementById('mobile-menu-close-btn'); const panel = document.getElementById('mobile-menu-panel'); const overlay = document.getElementById('mobile-menu-overlay'); if (openBtn && panel && overlay) { const open = () => { panel.classList.add('is-open'); overlay.classList.add('is-visible'); }; const close = () => { panel.classList.remove('is-open'); overlay.classList.remove('is-visible'); }; openBtn.addEventListener('click', open); closeBtn.addEventListener('click', close); overlay.addEventListener('click', close); }}
function initializeCartPanel() { const cartIcons = document.querySelectorAll('a[href="cart.html"].icon-button'); const closeBtn = document.getElementById('cart-panel-close-btn'); const overlay = document.getElementById('cart-panel-overlay'); if (closeBtn && overlay) { const open = () => { renderCartPanel(); document.getElementById('cart-panel').classList.add('is-open'); document.getElementById('cart-panel-overlay').classList.add('is-visible'); }; const close = () => { document.getElementById('cart-panel').classList.remove('is-open'); document.getElementById('cart-panel-overlay').classList.remove('is-visible'); }; cartIcons.forEach(icon => { icon.addEventListener('click', (e) => { if (window.innerWidth <= 768) { e.preventDefault(); open(); } }); }); closeBtn.addEventListener('click', close); overlay.addEventListener('click', close); }}
function openCartPanel() { renderCartPanel(); document.getElementById('cart-panel').classList.add('is-open'); document.getElementById('cart-panel-overlay').classList.add('is-visible'); }

// =================================================================
// 8. RENDERIZADO (Creación de HTML)
// =================================================================
function renderPrice(product) {
    if (product.salePrice && product.salePrice < product.price) {
        return `
            <span class="price-sale">${CURRENCY_SYMBOL}${product.salePrice.toFixed(2)}</span>
            <span class="price-original">${CURRENCY_SYMBOL}${product.price.toFixed(2)}</span>
        `;
    }
    return `<span class="price">${CURRENCY_SYMBOL}${product.price.toFixed(2)}</span>`;
}function renderProductCard(product) { return `<div class="product-card"><a href="product-details.html?id=${product.id}" class="product-card-link"><div class="product-image" style="background-image: url('${product.imageUrl}');"></div><div class="product-card-info"><p class="product-card-brand">${product.brand}</p><h3>${product.name}</h3></div></a><div class="product-card-bottom"><div class="product-card-price">${renderPrice(product)}</div><button class="btn-primary add-to-cart-small-btn" onclick="handlePurchase('${product.id}')">Añadir</button></div></div>`; }
function renderProductDetailView(product) { const gallery = product.images.map((img, i) => `<img src="${img}" alt="Thumbnail ${i + 1}" class="thumbnail-img ${i === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">`).join(''); const variants = product.groupId ? allProducts.filter(p => p.groupId === product.groupId) : []; const variantsHTML = variants.map(v => `<a href="product-details.html?id=${v.id}" class="variant-link ${v.id === product.id ? 'active' : ''}">${v.name.replace(product.name.split(' - ')[0], '')}</a>`).join(''); const specsHTML = product.specifications.map(spec => `<div class="spec-row"><dt class="spec-name">${spec.name}</dt><dd class="spec-value">${spec.value}</dd></div>`).join(''); return `<div class="product-detail-layout"><div class="product-detail-gallery"><div class="main-image-container"><img id="main-product-image" src="${product.imageUrl}" alt="${product.name}"></div><div class="thumbnail-container">${gallery}</div></div><div class="product-detail-info"><p class="brand-name">${product.brand}</p><h1>${product.name}</h1><div class="price-container">${renderPrice(product)}</div><p class="stock-status">Disponible</p><p class="description">${product.description}</p>${variants.length > 1 ? `<div class="variants-container"><h4>Otras Versiones:</h4><div class="variant-links-wrapper">${variantsHTML}</div></div>` : ''}<button class="btn-primary add-to-cart-btn" onclick="handlePurchase('${product.id}')">Añadir al Carrito</button><div class="specs-table"><h3>Especificaciones Técnicas</h3><dl>${specsHTML}</dl></div></div></div>`; }
function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">Tu carrito está vacío.</p>';
        return;
    }
    container.innerHTML = cart.map(item => `
        <article class="cart-item-card">
            <div class="cart-item-image"><img src="${item.imageUrl}" alt="${item.name}"></div>
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>${item.category}</p>
                <p class="stock-status">En Stock</p>
            </div>
            <div class="cart-item-actions">
                <p class="price">${CURRENCY_SYMBOL}${(item.price * item.quantity).toFixed(2)}</p>
                <div class="quantity-selector">
                    <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart('${item.id}')"><span class="material-symbols-outlined">delete</span></button>
            </div>
        </article>
    `).join('');
}
function renderCartPanel() {
    const body = document.getElementById('cart-panel-body');
    const subtotalEl = document.getElementById('cart-panel-subtotal');
    if (!body || !subtotalEl) return;
    if (cart.length === 0) {
        body.innerHTML = '<p>Tu carrito está vacío.</p>';
        subtotalEl.textContent = `${CURRENCY_SYMBOL}0.00`;
        return;
    }
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    subtotalEl.textContent = `${CURRENCY_SYMBOL}${subtotal.toFixed(2)}`;
    body.innerHTML = cart.map(item => `
        <div class="cart-panel-item">
            <img src="${item.imageUrl}" alt="${item.name}">
            <div class="cart-panel-item-details">
                <h4>${item.name}</h4>
                <p>${item.quantity} x ${CURRENCY_SYMBOL}${item.price.toFixed(2)}</p>
            </div>
            <p class="price">${CURRENCY_SYMBOL}${(item.price * item.quantity).toFixed(2)}</p>
        </div>
    `).join('');
}
// =================================================================
// 9. ESTADOS DE UI (Carga y Errores)
// =================================================================
function showLoadingState() { const sel = '#results-grid, #product-detail-container, #featured-products-grid'; document.querySelectorAll(sel).forEach(c => { if(c) c.innerHTML = '<p style="text-align:center; padding: 2rem;">Cargando productos...</p>'; }); }
function showErrorState(message) { const sel = '#results-grid, #product-detail-container, #featured-products-grid'; document.querySelectorAll(sel).forEach(c => { if(c) c.innerHTML = `<p style="color: red; text-align:center; padding: 2rem;"><b>Error:</b> ${message}</p>`; }); }
// assets/js/modules/cart.js
import { CURRENCY_SYMBOL, WHATSAPP_NUMBER } from './config.js';
import { cart, allProducts, saveCart, updateCartCount } from '../main.js';
import { openCartPanel, renderCartPage, showToast } from './ui.js';

export function handlePurchase(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        addToCart(productId);
        showToast(`${product.name} ha sido añadido al carrito.`); // <-- REEMPLAZO DE ALERT
    }
}

export function addToCart(productId) {
    const item = cart.find(p => p.id === productId);
    if (item) {
        item.quantity++;
    } else {
        const product = allProducts.find(p => p.id === productId);
        if(product) cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCartCount();
    if (window.innerWidth <= 768) {
        openCartPanel();
    }
}

export function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if (index > -1) {
        cart.splice(index, 1);
    }
    saveCart();
    renderCartPage();
}

export function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(p => p.id === productId);
    if (item) {
        item.quantity = Math.max(1, newQuantity);
    }
    saveCart();
    renderCartPage();
}

export function generateWhatsAppMessageAndRedirect() {
    if (cart.length === 0) {
        showToast("Tu carrito está vacío.", "error");
        return;
    }

    let message = "¡Hola J&S! 👋 Quiero realizar el siguiente pedido:\n\n";
    cart.forEach(item => {
        const itemTotal = item.salePrice || item.price;
        message += `*Producto:* ${item.name}\n`;
        message += `*Cantidad:* ${item.quantity}\n`;
        message += `*Precio Unit:* ${CURRENCY_SYMBOL}${itemTotal.toFixed(2)}\n\n`;
    });

    const subtotal = cart.reduce((sum, item) => sum + ((item.salePrice || item.price) * item.quantity), 0);
    // Aquí el problema - shipping no está definido:
    const shipping = 10.00; // AÑADIR ESTA LÍNEA - Define la variable shipping
    const total = subtotal + shipping;

    message += "-------------------------\n";
    message += `*Subtotal:* ${CURRENCY_SYMBOL}${subtotal.toFixed(2)}\n`;
    message += `*Envío:* ${CURRENCY_SYMBOL}${shipping.toFixed(2)}\n`;
    message += `*TOTAL A PAGAR:* *${CURRENCY_SYMBOL}${total.toFixed(2)}*\n\n`;
    message += "Quedo a la espera de las instrucciones para el pago. ¡Gracias!";

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    window.open(whatsappURL, '_blank');
}
async function renderCart() {
  const target = document.getElementById("cart-content");
  const cart = API.getCart();
  if (!cart.length) { target.innerHTML = '<div class="empty-state"><h2>Your cart is waiting for something lovely.</h2><p class="muted">You have not added any products yet.</p><a class="btn btn-dark" href="/#products">Continue shopping →</a></div>'; return; }
  let products;
  try { products = await API.request("/api/products"); } catch (e) { target.textContent = e.message; return; }
  const validCart = cart.filter(item => products.some(p => p.id === item.productId));
  API.saveCart(validCart);
  if (!validCart.length) return renderCart();
  const total = validCart.reduce((sum, item) => sum + Number(products.find(p => p.id === item.productId).price) * item.quantity, 0);
  target.innerHTML = `<div class="cart-layout"><div>${validCart.map(item => { const p = products.find(p => p.id === item.productId); return `<div class="cart-row"><img src="${escapeHtml(p.image)}" alt=""><div><h3>${escapeHtml(p.name)}</h3><p>${API.money(p.price)} each</p></div><div class="qty-control"><button data-action="minus" data-id="${p.id}">−</button><span>${item.quantity}</span><button data-action="plus" data-id="${p.id}">+</button></div><button class="remove-btn" data-action="remove" data-id="${p.id}">Remove</button></div>`; }).join("")}</div>
  <aside class="summary-card"><h2>Order summary</h2><div class="summary-line"><span>Subtotal</span><b>${API.money(total)}</b></div><div class="summary-line"><span>Delivery</span><b>Free</b></div><div class="summary-line summary-total"><span>Total</span><b>${API.money(total)}</b></div><form id="checkout-form" class="checkout-form"><label>Full name<input name="shippingName" required></label><label>Shipping address<textarea name="shippingAddress" required></textarea></label><button class="btn btn-dark full" type="submit">Place order →</button><p id="checkout-message" class="form-message"></p></form></aside></div>`;
  target.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
    const id = Number(button.dataset.id), action = button.dataset.action, current = API.getCart();
    const item = current.find(i => i.productId === id);
    if (action === "remove") API.saveCart(current.filter(i => i.productId !== id));
    if (action === "plus" && item) item.quantity++;
    if (action === "minus" && item) { item.quantity--; if (item.quantity < 1) return API.saveCart(current.filter(i => i.productId !== id)), renderCart(); }
    API.saveCart(current); renderCart();
  }));
  document.getElementById("checkout-form").addEventListener("submit", async e => {
    e.preventDefault(); const form = new FormData(e.target), message = document.getElementById("checkout-message");
    try {
      const result = await API.request("/api/orders", { method: "POST", body: JSON.stringify({
        items: API.getCart().map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingName: form.get("shippingName"), shippingAddress: form.get("shippingAddress")
      })});
      API.saveCart([]);
      target.innerHTML = `<div class="success-note"><h2>Order placed successfully! 🎉</h2><p>Your order number is <b>#${result.orderId}</b>. Total paid at checkout: <b>${API.money(result.total)}</b>.</p><a class="btn btn-dark" href="/orders.html">View my orders →</a></div>`;
    } catch (err) {
      message.textContent = err.message;
      if (err.message.includes("log in")) setTimeout(() => location.href = "/login.html", 1200);
    }
  });
}
document.addEventListener("DOMContentLoaded", renderCart);

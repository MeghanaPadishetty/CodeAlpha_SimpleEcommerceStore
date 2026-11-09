document.addEventListener("DOMContentLoaded", async () => {
  const target = document.getElementById("orders-list");
  try {
    const { user } = await API.request("/api/me");
    if (!user) { target.innerHTML = '<div class="empty-state"><h2>Please log in to view your orders.</h2><a class="btn btn-dark" href="/login.html">Login →</a></div>'; return; }
    const orders = await API.request("/api/orders");
    if (!orders.length) { target.innerHTML = '<div class="empty-state"><h2>No orders yet</h2><p class="muted">Your placed orders will appear here.</p><a class="btn btn-dark" href="/#products">Start shopping →</a></div>'; return; }
    target.innerHTML = orders.map(order => `<article class="order-card"><div class="order-top"><div><h3>Order #${order.id}</h3><p class="muted">${new Date(order.created_at + " UTC").toLocaleString()}</p></div><span class="status">${escapeHtml(order.status)}</span></div><p class="order-items">${order.items.map(i => `${escapeHtml(i.product_name)} × ${i.quantity} — ${API.money(i.price * i.quantity)}`).join("<br>")}</p><div class="summary-line summary-total"><span>Order total</span><b>${API.money(order.total)}</b></div><p class="muted">Shipping to: ${escapeHtml(order.shipping_name)} — ${escapeHtml(order.shipping_address)}</p></article>`).join("");
  } catch (err) { target.textContent = err.message; }
});

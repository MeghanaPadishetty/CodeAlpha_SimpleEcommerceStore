const API = {
  async request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  },
  money(value) { return "₹" + Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 }); },
  getCart() { try { return JSON.parse(localStorage.getItem("megashop-cart") || "[]"); } catch { return []; } },
  saveCart(cart) { localStorage.setItem("megashop-cart", JSON.stringify(cart)); updateCartCount(); },
  addToCart(product, quantity = 1) {
    const cart = this.getCart();
    const existing = cart.find(item => item.productId === product.id);
    if (existing) existing.quantity += quantity;
    else cart.push({ productId: product.id, name: product.name, price: product.price, image: product.image, quantity });
    this.saveCart(cart);
  }
};
function updateCartCount() {
  const count = API.getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("#cart-count").forEach(el => el.textContent = count);
}
async function updateAccountArea() {
  const target = document.getElementById("account-area");
  if (!target) return;
  try {
    const { user } = await API.request("/api/me");
    target.innerHTML = user ? `<span class="muted">Hi, ${escapeHtml(user.name.split(" ")[0])}</span> <button id="logout-btn" class="text-link" style="border:0;background:none;cursor:pointer">Logout</button>` : '<a class="text-link" href="/login.html">Login</a>';
    document.getElementById("logout-btn")?.addEventListener("click", async () => {
      await API.request("/api/logout", { method: "POST" });
      location.href = "/";
    });
  } catch {}
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount(); updateAccountArea();
  document.querySelectorAll("#year").forEach(el => el.textContent = new Date().getFullYear());
});

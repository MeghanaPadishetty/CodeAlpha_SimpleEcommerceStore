document.addEventListener("DOMContentLoaded", async () => {
  const target = document.getElementById("product-detail");
  const id = new URLSearchParams(location.search).get("id");
  if (!id) { target.textContent = "Product not found."; return; }
  try {
    const p = await API.request(`/api/products/${encodeURIComponent(id)}`);
    document.title = `${p.name} | MegaShop`;
    target.innerHTML = `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" onerror="this.src='https://placehold.co/700x700/e8eee8/526b58?text=Product'"><div><span class="product-category">${escapeHtml(p.category)}</span><h1>${escapeHtml(p.name)}</h1><div class="detail-price">${API.money(p.price)}</div><p class="detail-description">${escapeHtml(p.description)}</p><p class="stock">${p.stock > 0 ? `${p.stock} items available` : "Out of stock"}</p><div><input id="quantity" class="quantity" type="number" min="1" max="${p.stock}" value="1"><button id="add-detail" class="btn btn-dark" ${p.stock < 1 ? "disabled" : ""}>Add to cart →</button></div></div>`;
    document.getElementById("add-detail").addEventListener("click", () => {
      const quantity = Number(document.getElementById("quantity").value);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > p.stock) return alert("Please enter a valid quantity.");
      API.addToCart(p, quantity); alert("Added to your cart!"); updateCartCount();
    });
  } catch (err) { target.textContent = err.message; }
});

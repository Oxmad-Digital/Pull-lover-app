// Resolve only the campaign product, never an unrelated catalogue item.
export function selectMantasoa(products = []) {
  const matches = products.filter((product) => /\bmantasoa\b/i.test(product.name || ""));
  const exact = matches.filter((product) => /^(le\s+)?mantasoa$/i.test(product.name.trim()));
  if (exact.length === 1) return exact[0];
  return matches.length === 1 ? matches[0] : null;
}

export function productSizes(product) {
  return [...new Set([
    ...(product.sizes || []),
    ...Object.keys(product.stocks || {}),
    ...(product.size ? [product.size] : []),
  ])];
}

export function remainingStock(product, size, cartItems = []) {
  if (!product || product.isAvailable === false) return 0;
  const items = cartItems.filter((item) => item._id === product._id);
  const totalInCart = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = Math.max(0, Number(product.stock || 0) - totalInCart);
  if (size && Object.keys(product.stocks || {}).length) {
    const sizeInCart = items.filter((item) => item.size === size).reduce((sum, item) => sum + item.quantity, 0);
    return Math.max(0, Math.min(total, Number(product.stocks[size] || 0) - sizeInCart));
  }
  return total;
}

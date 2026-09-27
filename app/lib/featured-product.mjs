// Mode mono-produit : une seule fiche produit existe, quel que soit son nom.
export function selectFeaturedProduct(products = []) {
  return products.length === 1 ? products[0] : null;
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

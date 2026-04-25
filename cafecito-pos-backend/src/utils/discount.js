/**
 * Calcula el porcentaje de descuento según el historial de compras del cliente.
 * Regla definida por el equipo senior en contexto-narrativo.mdx
 *
 * @param {number} purchasesCount - Número de compras anteriores del cliente
 * @returns {number} Porcentaje de descuento (0, 5, 10 o 15)
 */
export function calculateDiscount(purchasesCount) {
  if (purchasesCount >= 8) return 15;
  if (purchasesCount >= 4) return 10;
  if (purchasesCount >= 1) return 5;
  return 0;
}

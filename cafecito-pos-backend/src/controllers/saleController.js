import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import { calculateDiscount } from "../utils/discount.js";

// POST /api/sales
export const createSale = async (req, res) => {
  const { customerId, paymentMethod = "cash", items } = req.body;

  // 1. Validar que items no esté vacío
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(422).json({
      error: "Validation failed",
      details: [{ field: "items", message: "items cannot be empty" }],
    });
  }

  // Validar que cada item tenga los campos necesarios
  const itemErrors = [];
  items.forEach((item, index) => {
    if (!item.productId) {
      itemErrors.push({
        field: `items[${index}].productId`,
        message: "productId is required",
      });
    }
    if (
      !item.quantity ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      itemErrors.push({
        field: `items[${index}].quantity`,
        message: "quantity must be >= 1",
      });
    }
  });

  if (itemErrors.length > 0) {
    return res
      .status(422)
      .json({ error: "Validation failed", details: itemErrors });
  }

  try {
    // 2. Cargar los productos involucrados
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // Verificar que todos los productos existen
    const notFound = productIds.filter(
      (id) => !products.find((p) => p._id.toString() === id),
    );
    if (notFound.length > 0) {
      return res.status(404).json({
        error: "Products not found",
        details: notFound.map((id) => ({
          productId: id,
          message: "Product not found",
        })),
      });
    }

    // 3. Verificar stock suficiente
    const stockErrors = [];
    items.forEach((item) => {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (product.stock < item.quantity) {
        stockErrors.push({
          productId: item.productId,
          message: `Only ${product.stock} available, requested ${item.quantity}`,
        });
      }
    });

    if (stockErrors.length > 0) {
      return res
        .status(400)
        .json({ error: "Insufficient stock", details: stockErrors });
    }

    // 4. Obtener cliente y calcular descuento
    let customer = null;
    let discountPercent = 0;

    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        return res
          .status(404)
          .json({ error: "Customer not found", id: customerId });
      }
      discountPercent = calculateDiscount(customer.purchasesCount);
    }

    // 5. Calcular totales
    const saleItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId);
      return {
        productId: product._id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: product.price,
        quantity: item.quantity,
        lineTotal: +(product.price * item.quantity).toFixed(2),
      };
    });

    const subtotal = +saleItems
      .reduce((sum, i) => sum + i.lineTotal, 0)
      .toFixed(2);
    const discountAmount = +(subtotal * (discountPercent / 100)).toFixed(2);
    const total = +(subtotal - discountAmount).toFixed(2);

    // 6. Reducir stock de cada producto
    await Promise.all(
      items.map((item) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        }),
      ),
    );

    // 7. Incrementar purchasesCount del cliente
    if (customer) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { purchasesCount: 1 },
      });
    }

    // 8. Guardar la venta
    const sale = await Sale.create({
      customerId: customerId || null,
      paymentMethod,
      items: saleItems,
      subtotal,
      discountPercent,
      discountAmount,
      total,
    });

    // 9. Formatear la respuesta con ticket
    res.status(201).json(formatSale(sale));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/sales/:id
export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res
        .status(404)
        .json({ error: "Sale not found", id: req.params.id });
    }
    res.json(formatSale(sale));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

function formatSale(sale) {
  const items = sale.items.map((item) => ({
    productId: item.productId.toString(),
    productName: item.productNameSnapshot,
    quantity: item.quantity,
    unitPrice: item.unitPriceSnapshot,
    lineTotal: item.lineTotal,
  }));

  return {
    saleId: sale._id.toString(),
    customerId: sale.customerId?.toString() || null,
    paymentMethod: sale.paymentMethod,
    items,
    subtotal: sale.subtotal,
    discountPercent: sale.discountPercent,
    discountAmount: sale.discountAmount,
    total: sale.total,
    ticket: {
      saleId: sale._id.toString(),
      timestamp: sale.createdAt,
      storeName: "Cafecito Feliz",
      items: items.map((i) => ({
        name: i.productName,
        qty: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
      })),
      subtotal: sale.subtotal,
      discount:
        sale.discountPercent > 0
          ? `${sale.discountPercent}% (-$${sale.discountAmount})`
          : "Sin descuento",
      total: sale.total,
      paymentMethod: sale.paymentMethod,
    },
    createdAt: sale.createdAt,
  };
}

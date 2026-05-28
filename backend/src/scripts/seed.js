import mongoose from "mongoose";
import connectDB from "../config/db.conf.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";

const PRODUCTS = [
  { name: "Café Americano", price: 5.0, stock: 20 },
  { name: "Café con Leche", price: 6.5, stock: 15 },
  { name: "Capuchino", price: 7.0, stock: 12 },
  { name: "Espresso", price: 4.5, stock: 18 },
  { name: "Croissant", price: 3.5, stock: 10 },
  { name: "Pan de chocolate", price: 4.0, stock: 8 },
  { name: "Galleta de avena", price: 2.5, stock: 25 },
  { name: "Sandwich de jamón", price: 8.5, stock: 6 },
];

const CUSTOMERS = [
  { name: "Juan García", phoneOrEmail: "juan@example.com", purchasesCount: 4 },
  { name: "María López", phoneOrEmail: "maria@example.com", purchasesCount: 8 },
  { name: "Carlos Ruiz", phoneOrEmail: "+525512345678", purchasesCount: 2 },
  { name: "Ana Torres", phoneOrEmail: "ana@example.com", purchasesCount: 0 },
];

async function seed() {
  await connectDB();

  console.log("\n🌱 Iniciando seed...\n");

  // Limpia datos previos (solo products y customers, no toca sales)
  const deletedProducts = await Product.deleteMany({});
  const deletedCustomers = await Customer.deleteMany({});
  console.log(
    `  🗑  Eliminados: ${deletedProducts.deletedCount} productos, ${deletedCustomers.deletedCount} clientes`,
  );

  // Inserta productos
  const products = await Product.insertMany(PRODUCTS);
  console.log(`  ✅ ${products.length} productos creados:`);
  products.forEach((p) =>
    console.log(`     · ${p.name} — $${p.price} (stock: ${p.stock})`),
  );

  // Inserta clientes con purchasesCount ya establecido
  const customers = await Promise.all(
    CUSTOMERS.map((c) => Customer.create(c)),
  );
  console.log(`\n  ✅ ${customers.length} clientes creados:`);
  customers.forEach((c) => {
    const tier =
      c.purchasesCount >= 8
        ? "15%"
        : c.purchasesCount >= 4
          ? "10%"
          : c.purchasesCount >= 1
            ? "5%"
            : "sin descuento";
    console.log(
      `     · ${c.name} — ${c.purchasesCount} compras (${tier})`,
    );
  });

  console.log("\n✨ Seed completado.\n");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});

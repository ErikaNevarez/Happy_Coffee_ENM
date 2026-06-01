import Customer from "../models/Customer.js";

// GET /api/customers?q=Jose&page=2&limit=5
export const getCustomers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { phoneOrEmail: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      Customer.find(filter).skip(skip).limit(Number(limit)),
      Customer.countDocuments(filter),
    ]);

    res.json({
      data: data.map(formatCustomer),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/customers/:id
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ error: "Customer not found", id: req.params.id });
    }
    res.json(formatCustomer(customer));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/customers
export const createCustomer = async (req, res) => {
  try {
    const { name, phoneOrEmail } = req.body;

    // Validación manual para dar mensajes del contrato
    const errors = [];
    if (!name || name.trim().length < 2) {
      errors.push({
        field: "name",
        message: "name must be at least 2 characters",
      });
    }
    if (!phoneOrEmail) {
      errors.push({
        field: "phoneOrEmail",
        message: "phoneOrEmail is required",
      });
    }

    if (errors.length > 0) {
      return res
        .status(422)
        .json({ error: "Validation failed", details: errors });
    }

    const customer = await Customer.create({ name, phoneOrEmail });
    res.status(201).json(formatCustomer(customer));
    } catch (err) {
        console.error(err);
      if (err.name === "ValidationError") {
      const details = Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(422).json({ error: "Validation failed", details });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

function formatCustomer(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    phoneOrEmail: doc.phoneOrEmail,
    purchasesCount: doc.purchasesCount,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

import Product from "../models/Product.js";

const getProduct = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = q ? { name: { $regex: q, $options: "i" } } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      data: data.map(formatProduct),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, price, stock, description, offer, category, imageUrl } = req.body;

    const product = await Product.create({ name, price, stock, description, offer, category, imageUrl }); 
    res.json(formatProduct(product));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found", id: req.params.id });
    }
    res.json(formatProduct(product));
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(422).json({
        error: "Validation failed",
        details: Object.values(error.errors).map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    res.json({ message: "Product deleted successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const formatProduct = (doc) => {
  return {
    id: doc._id.toString(),
    name: doc.name,
    imageUrl: doc.imageUrl, 
    description: doc.description,
    category: doc.category,
    offer: doc.offer, 
    price: doc.price,
    stock: doc.stock,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export { getProduct, createProduct, updateProduct, deleteProduct };

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateTokens = (user) => {
  const payload = { id: user._id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email y contraseña requeridos" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Credenciales inválidas" });

    const { accessToken, refreshToken } = generateTokens(user);
    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Nombre, email y contraseña requeridos" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "El email ya está registrado" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role: role || "cashier" });

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

const refereshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Token requerido" });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Usuario no encontrado" });

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (err) {
    res.status(403).json({ message: "Token inválido o expirado" });
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export { login, register, refereshToken, getMe };

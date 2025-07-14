import jwt from "jsonwebtoken";
import AdminService from "../services/AdminService.js";
import UserService from "../services/UserService.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // First check if user exists in admins table
    const admin = await AdminService.findAdminById(decoded.id);

    if (admin) {
      req.admin = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isAdmin: true,
        source: "admins",
      };
      return next();
    }

    // If not in admins table, check users table for admin status
    const user = await UserService.getUserById(decoded.id);

    if (user && user.is_admin) {
      req.admin = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: "admin",
        isAdmin: true,
        source: "users",
      };
      return next();
    }

    // If user exists but is not admin
    if (user) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // User not found
    return res.status(401).json({
      success: false,
      message: "Invalid token. User not found.",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      });
    }

    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

// Middleware specifically for checking admin privileges
export const requireAdmin = async (req, res, next) => {
  try {
    // This middleware should be used after authMiddleware
    if (!req.admin || !req.admin.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking admin privileges.",
    });
  }
};

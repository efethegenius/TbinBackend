import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import AdminService from "../services/AdminService.js";
import UserService from "../services/UserService.js";
import supabase from "../config/supabase.js";

class AuthController {
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // First check admins table
      const admin = await AdminService.findAdminByEmail(email);
      if (admin) {
        const isValidPassword = await bcrypt.compare(
          password,
          admin.password_hash
        );
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials",
          });
        }

        // Update last login
        await AdminService.updateLastLogin(admin.id);

        // Generate tokens
        const token = jwt.sign(
          {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            isAdmin: true,
            source: "admins",
          },
          process.env.JWT_SECRET || "your-secret-key",
          { expiresIn: "24h" }
        );

        const refreshToken = jwt.sign(
          { id: admin.id, source: "admins" },
          process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
          { expiresIn: "7d" }
        );

        return res.json({
          success: true,
          message: "Login successful",
          data: {
            token,
            refreshToken,
            admin: {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: admin.role,
              isAdmin: true,
              source: "admins",
            },
          },
        });
      }

      // If not found in admins, check users table for admin users
      // const user = await UserService.getUserById(email); // This needs to be updated to search by email

      // We need to create a method to find user by email
      // const userByEmail = await this.findUserByEmail(email);

      // if (userByEmail && userByEmail.is_admin) {
      //   // For users table, we'd need to implement password checking
      //   // For now, we'll assume users authenticate through Supabase Auth
      //   return res.status(401).json({
      //     success: false,
      //     message: "Please use Supabase authentication for user accounts",
      //   });
      // }

      // Try Supabase Auth for regular users
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const { user, session } = data;

      // Optionally, fetch user profile from your `users` table
      const userProfile = await UserService.findUserByEmail(user.email);
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: "User profile not found",
        });
      }

      return res.json({
        success: true,
        message: "Login successful",
        data: {
          token: session.access_token,
          refreshToken: session.refresh_token,
          user: {
            id: userProfile.id,
            email: user.email,
            name: userProfile.name,
            isAdmin: userProfile.is_admin,
            source: "users",
          },
        },
      });

      // return res.status(401).json({
      //   success: false,
      //   message: "Invalid credentials",
      // });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Helper method to find user by email
  static async findUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error finding user by email:", error);
      return null;
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token required",
        });
      }

      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || "your-refresh-secret"
      );

      let user = null;
      let isAdmin = false;
      let source = decoded.source || "admins";

      if (source === "admins") {
        user = await AdminService.findAdminById(decoded.id);
        isAdmin = true;
      } else {
        user = await UserService.getUserById(decoded.id);
        isAdmin = user?.is_admin || false;
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      const newToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role || "admin",
          isAdmin,
          source,
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        data: { token: newToken },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
  }

  static async logout(req, res) {
    // In a real app, you might want to blacklist the token
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
}

export default AuthController;

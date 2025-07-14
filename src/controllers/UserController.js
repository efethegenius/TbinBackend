import { validationResult } from "express-validator";
import UserService from "../services/UserService.js";
import supabase from "../config/supabase.js";

class UserController {
  // static async createUser(req, res) {
  //   try {
  //     const errors = validationResult(req);
  //     if (!errors.isEmpty()) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Validation failed",
  //         errors: errors.array(),
  //       });
  //     }

  //     const userData = req.body;
  //     const newUser = await UserService.createUser(userData);

  //     res.status(201).json({
  //       success: true,
  //       message: "User created successfully",
  //       data: newUser,
  //     });
  //   } catch (error) {
  //     console.error("Create user error:", error);

  //     // Handle unique constraint violations (duplicate email)
  //     if (error.code === "23505" || error.message.includes("duplicate key")) {
  //       return res.status(409).json({
  //         success: false,
  //         message: "A user with this email already exists",
  //       });
  //     }

  //     res.status(500).json({
  //       success: false,
  //       message: "Failed to create user",
  //     });
  //   }
  // }

  // controllers/UserController.js
  static async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      // grab fields
      const {
        name,
        email,
        phone,
        address,
        is_admin = false,
        password,
        sendInvite,
      } = req.body;

      // ---- 1. create or invite in Supabase Auth ----
      let authUser;
      if (sendInvite) {
        // no password – send invite e‑mail
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(
          email,
          {
            data: { name, is_admin },
          }
        );
        if (error) throw error;
        authUser = data.user;
      } else {
        // direct sign‑up (password required)
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // auto‑confirm so user can log in immediately
          user_metadata: { name, is_admin },
        });
        if (error) throw error;
        authUser = data.user;
      }

      // ---- 2. insert profile row ----
      const profile = await UserService.createProfile({
        id: authUser.id, // use the auth user's UUID as PK / FK
        name,
        email,
        phone,
        address,
        status: "active",
        is_admin,
      });

      return res.status(201).json({
        success: true,
        message: sendInvite ? "Invite sent" : "User created",
        data: profile,
      });
    } catch (error) {
      console.error("Create user error:", error);

      // clean‑up auth record if profile insert failed
      if (error.code === "23505") {
        // duplicate e‑mail in your table
        return res.status(409).json({
          success: false,
          message: "A user with this email already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create user",
      });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { page = 1, limit = 10, search } = req.query;
      const result = await UserService.getAllUsers({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  }

  static async getUserById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const user = await UserService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user",
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const updatedUser = await UserService.updateUser(id, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update user",
      });
    }
  }

  static async deleteUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const result = await UserService.deleteUser(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User deactivated successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  }

  // New method to promote user to admin
  static async promoteToAdmin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updatedUser = await UserService.promoteToAdmin(id);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User promoted to admin successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Promote user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to promote user to admin",
      });
    }
  }

  // New method to revoke admin privileges
  static async revokeAdminPrivileges(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updatedUser = await UserService.revokeAdminPrivileges(id);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "Admin privileges revoked successfully",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Revoke admin privileges error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to revoke admin privileges",
      });
    }
  }
}

export default UserController;

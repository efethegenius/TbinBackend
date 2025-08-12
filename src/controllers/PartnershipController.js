import { validationResult } from "express-validator";
import PartnershipService from "../services/PartnershipService.js";

class PartnershipController {
  static async createApplication(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const applicationData = req.body;
      const newApplication =
        await PartnershipService.createApplication(applicationData);

      res.status(201).json({
        success: true,
        message: "Partnership application submitted successfully",
        data: newApplication,
      });
    } catch (error) {
      console.error("Create partnership application error:", error);

      // Handle unique constraint violations
      if (error.code === "23505" || error.message.includes("duplicate key")) {
        return res.status(409).json({
          success: false,
          message: "An application with this email already exists",
        });
      }

      // Handle check constraint violations (missing corporate fields)
      if (
        error.code === "23514" ||
        error.message.includes("check_corporate_fields")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Corporate applications require all organization fields to be filled",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to submit partnership application",
      });
    }
  }

  static async getAllApplications(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { page = 1, limit = 10, status, search } = req.query;
      const result = await PartnershipService.getAllApplications({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get partnership applications error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch partnership applications",
      });
    }
  }

  static async getApplicationById(req, res) {
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
      const application = await PartnershipService.getApplicationById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Partnership application not found",
        });
      }

      res.json({
        success: true,
        data: application,
      });
    } catch (error) {
      console.error("Get partnership application error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch partnership application",
      });
    }
  }

  static async updateApplicationStatus(req, res) {
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
      const { status } = req.body;

      const updatedApplication =
        await PartnershipService.updateApplicationStatus(id, { status });

      if (!updatedApplication) {
        return res.status(404).json({
          success: false,
          message: "Partnership application not found",
        });
      }

      res.json({
        success: true,
        message: `Partnership application ${status} successfully`,
        data: updatedApplication,
      });
    } catch (error) {
      console.error("Update partnership application status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update partnership application status",
      });
    }
  }

  static async deleteApplication(req, res) {
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
      const result = await PartnershipService.deleteApplication(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Partnership application not found",
        });
      }

      res.json({
        success: true,
        message: "Partnership application deleted successfully",
      });
    } catch (error) {
      console.error("Delete partnership application error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete partnership application",
      });
    }
  }

  static async getApplicationStats(req, res) {
    try {
      const stats = await PartnershipService.getApplicationStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get partnership application stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch partnership application statistics",
      });
    }
  }
}

export default PartnershipController;

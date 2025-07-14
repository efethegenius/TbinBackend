import { body, validationResult } from "express-validator";
import DonationService from "../services/DonationService.js";

class DonationController {
  static createDonationValidators = [
    body("amount")
      .isFloat({ gt: 0 })
      .withMessage("Amount must be greater than 0"),
    body("currency").optional().isLength({ min: 3, max: 3 }),
    body("processing_fee").optional().isFloat({ min: 0 }),
    body("user_id").optional(),
    body("project_id").notEmpty().withMessage("project_id is required"),
    body("payment_method").notEmpty().withMessage("payment_method is required"),
    body("transaction_id").notEmpty().withMessage("transaction_id is required"),
    body("status")
      .optional()
      .isIn(["pending", "completed", "refunded", "failed"]),
    body("donated_at").optional().isISO8601().toDate(),
  ];

  static async createDonation(req, res) {
    console.log("🚀 Incoming donation request body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn("❌ Validation failed:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      console.warn("entered");
      const donation = await DonationService.createDonation(req.body);

      return res.status(201).json({
        success: true,
        message: "Donation recorded",
        data: donation,
      });
    } catch (err) {
      console.error("Create donation error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to create donation",
      });
    }
  }

  static async getAllDonations(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { userId, projectId, startDate, endDate } = req.query;

      const result = await DonationService.getAllDonations({
        filters: {
          userId,
          projectId,
          startDate,
          endDate,
        },
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get donations error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch donations",
      });
    }
  }

  static async getDonationSummary(req, res) {
    try {
      const summary = await DonationService.getDonationSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Get donation summary error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch donation summary",
      });
    }
  }

  static async updateDonation(req, res) {
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

      const updatedDonation = await DonationService.updateDonation(
        id,
        updateData
      );

      if (!updatedDonation) {
        return res.status(404).json({
          success: false,
          message: "Donation not found",
        });
      }

      res.json({
        success: true,
        message: "Donation updated successfully",
        data: updatedDonation,
      });
    } catch (error) {
      console.error("Update donation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update donation",
      });
    }
  }

  static async getDonationById(req, res) {
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
      const donation = await DonationService.getDonationById(id);

      if (!donation) {
        return res.status(404).json({
          success: false,
          message: "Donation not found",
        });
      }

      res.json({
        success: true,
        data: donation,
      });
    } catch (error) {
      console.error("Get donation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch donation",
      });
    }
  }
}

export default DonationController;

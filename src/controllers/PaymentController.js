import { validationResult } from "express-validator";
import PaymentsService from "../services/PaymentsService.js";

class PaymentsController {
  static async verifyAndSaveDonation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { reference, userId, projectId, amount, email, name } = req.body;

      const result = await PaymentsService.verifyAndSave({
        reference,
        userId: userId || null,
        projectId,
        amount,
        email,
        name,
      });

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Donation verified and saved successfully",
          data: result.data,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Verify and Save Donation Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error while processing donation",
      });
    }
  }
}

export default PaymentsController;

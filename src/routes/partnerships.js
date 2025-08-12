import express from "express";
import { body } from "express-validator";
import PartnershipController from "../controllers/PartnershipController.js";

const router = express.Router();

// Public route for submitting partnership applications
router.post(
  "/apply",
  [
    body("firstName")
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters"),
    body("lastName")
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Last name must be at least 2 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("country")
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Country is required"),
    body("jobPost")
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Job/Post is required"),
    body("hearAboutUs")
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Please specify how you heard about us"),
    body("processOption")
      .isIn(["Individual", "Corporate"])
      .withMessage("Process option must be Individual or Corporate"),
    body("partnershipSummary")
      .isString()
      .trim()
      .isLength({ min: 10 })
      .withMessage("Partnership summary must be at least 10 characters"),

    // Conditional validation for corporate fields
    body("organizationName")
      .if(body("processOption").equals("Corporate"))
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Organization name is required for corporate applications"),
    body("legalConstitution")
      .if(body("processOption").equals("Corporate"))
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Legal constitution is required for corporate applications"),
    body("orgCountry")
      .if(body("processOption").equals("Corporate"))
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage(
        "Organization country is required for corporate applications"
      ),
    body("address")
      .if(body("processOption").equals("Corporate"))
      .isString()
      .trim()
      .isLength({ min: 5 })
      .withMessage("Address is required for corporate applications"),
    body("website")
      .if(body("processOption").equals("Corporate"))
      .isURL()
      .withMessage("Valid website URL is required for corporate applications"),
    body("phone")
      .if(body("processOption").equals("Corporate"))
      .isString()
      .trim()
      .isLength({ min: 5 })
      .withMessage("Phone number is required for corporate applications"),
    body("orgEmail")
      .if(body("processOption").equals("Corporate"))
      .isEmail()
      .normalizeEmail()
      .withMessage(
        "Valid organization email is required for corporate applications"
      ),
  ],
  PartnershipController.createApplication
);

export default router;

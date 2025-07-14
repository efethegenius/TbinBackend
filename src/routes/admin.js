import express from "express";
import multer from "multer";
import { body, param, query } from "express-validator";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import UserController from "../controllers/UserController.js";
import ProjectController from "../controllers/ProjectController.js";
import DonationController from "../controllers/DonationController.js";
import ReportsController from "../controllers/ReportsController.js";
import DashboardController from "../controllers/DashboardController.js";
import PaymentsController from "../controllers/PaymentController.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Please upload JPEG, PNG, GIF, or WebP images only."
        ),
        false
      );
    }
  },
});

// Apply authentication middleware to all admin routes
// router.use(authMiddleware);
// router.use(requireAdmin); // Ensure admin privileges

// User Management Routes
router.get(
  "/users",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().isString().trim(),
  ],
  UserController.getAllUsers
);

router.post(
  "/users",
  [
    body("name")
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("phone").optional().isString().trim(),
    body("address").optional().isString().trim(),
    body("status")
      .optional()
      .isIn(["active", "inactive", "suspended"])
      .withMessage("Invalid status"),
    body("is_admin")
      .optional()
      .isBoolean()
      .withMessage("is_admin must be a boolean"),
  ],
  UserController.createUser
);

router.get(
  "/users/:id",
  [param("id").isString().notEmpty()],
  UserController.getUserById
);

router.patch(
  "/users/:id",
  [
    param("id").isString().notEmpty(),
    body("name").optional().isString().trim().isLength({ min: 2 }),
    body("email").optional().isEmail().normalizeEmail(),
    body("status").optional().isIn(["active", "inactive", "suspended"]),
    body("is_admin").optional().isBoolean(),
  ],
  UserController.updateUser
);

router.delete(
  "/users/:id",
  [param("id").isString().notEmpty()],
  UserController.deleteUser
);

// Admin privilege management routes
router.patch(
  "/users/:id/promote",
  [param("id").isString().notEmpty()],
  UserController.promoteToAdmin
);

router.patch(
  "/users/:id/revoke",
  [param("id").isString().notEmpty()],
  UserController.revokeAdminPrivileges
);

// Project Management Routes
router.get(
  "/projects",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status")
      .optional()
      .isIn(["pending", "approved", "rejected", "disabled"]),
    query("search").optional().isString().trim(),
  ],
  ProjectController.getAllProjects
);

router.post(
  "/projects",
  upload.single("image"),
  [
    body("title")
      .isString()
      .trim()
      .isLength({ min: 3 })
      .withMessage("Title must be at least 3 characters"),
    body("description")
      .isString()
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters"),
    body("category")
      .isString()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Category is required"),
    body("funding_goal")
      .isNumeric()
      .withMessage("Funding goal must be a number"),
    body("current_funding")
      .optional()
      .isNumeric()
      .withMessage("Current funding must be a number"),
    body("status")
      .optional()
      .isIn(["pending", "approved", "rejected", "disabled"])
      .withMessage("Invalid status"),
    body("user_id").isString().notEmpty().withMessage("User ID is required"),
    body("image_alt").optional().isString().trim(),
  ],
  ProjectController.createProject
);

router.get(
  "/projects/:id",
  [param("id").isString().notEmpty()],
  ProjectController.getProjectById
);

router.get(
  "/projects/:id/image",
  [param("id").isString().notEmpty()],
  ProjectController.getProjectImage
);

router.patch(
  "/projects/:id",
  upload.single("image"),
  [
    param("id").isString().notEmpty(),
    body("title").optional().isString().trim().isLength({ min: 3 }),
    body("description").optional().isString().trim().isLength({ min: 10 }),
    body("category").optional().isString().trim().isLength({ min: 2 }),
    body("funding_goal").optional().isNumeric(),
    body("current_funding").optional().isNumeric(),
    body("image_alt").optional().isString().trim(),
  ],
  ProjectController.updateProject
);

router.patch(
  "/projects/:id/status",
  [
    param("id").isString().notEmpty(),
    body("status").isIn(["pending", "approved", "rejected", "disabled"]),
    body("reason").optional().isString().trim(),
  ],
  ProjectController.updateProjectStatus
);

// Donation Management Routes
router.get(
  "/donations",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("userId").optional().isString(),
    query("projectId").optional().isString(),
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
  ],
  DonationController.getAllDonations
);

router.get("/donations/summary", DonationController.getDonationSummary);

router.post(
  "/donations",
  DonationController.createDonationValidators,
  DonationController.createDonation
);

router.get(
  "/donations/:id",
  [param("id").isString().notEmpty()],
  DonationController.getDonationById
);

router.patch(
  "/donations/:id",
  [
    param("id").isString().notEmpty(),
    body("amount").optional().isNumeric(),
    body("status")
      .optional()
      .isIn(["pending", "completed", "failed", "refunded", "disabled"]),
    body("donor_name").optional().isString().trim().isLength({ min: 2 }),
    body("processing_fee").optional().isNumeric(),
  ],
  DonationController.updateDonation
);

// Financial Reports Routes
router.get(
  "/reports/donations",
  [
    query("format").optional().isIn(["json", "csv"]),
    query("projectId").optional().isString(),
    query("donorEmail").optional().isEmail(),
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
  ],
  ReportsController.exportDonations
);

router.post(
  "/verify",
  [
    body("reference").notEmpty().withMessage("Reference is required"),
    // body("userId").isUUID().withMessage("Invalid userId"),
    body("projectId").isUUID().withMessage("Invalid projectId"),
    body("amount").isNumeric().withMessage("Amount must be a number"),
  ],
  PaymentsController.verifyAndSaveDonation
);

// Dashboard Routes
router.get("/overview", DashboardController.getOverview);

export default router;

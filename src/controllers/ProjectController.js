import { validationResult } from "express-validator";
import ProjectService from "../services/ProjectService.js";

class ProjectController {
  static async getAllProjects(req, res) {
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
      const result = await ProjectService.getAllProjects({
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
      console.error("Get projects error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch projects",
      });
    }
  }

  static async createProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const projectData = req.body;

      // Handle image upload if present
      if (req.file) {
        projectData.image_data = req.file.buffer;
        projectData.image_filename = req.file.originalname;
        projectData.image_mimetype = req.file.mimetype;
        projectData.image_size = req.file.size;
      }

      const newProject = await ProjectService.createProject(projectData);

      res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: newProject,
      });
    } catch (error) {
      console.error("Create project error:", error);

      if (error.message.includes("File too large")) {
        return res.status(413).json({
          success: false,
          message: "Image file is too large. Maximum size is 10MB.",
        });
      }

      if (error.message.includes("Invalid file type")) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid image format. Please upload JPEG, PNG, GIF, or WebP images only.",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create project",
      });
    }
  }

  static async updateProject(req, res) {
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

      // Handle image upload if present
      if (req.file) {
        updateData.image_data = req.file.buffer;
        updateData.image_filename = req.file.originalname;
        updateData.image_mimetype = req.file.mimetype;
        updateData.image_size = req.file.size;
      }

      const updatedProject = await ProjectService.updateProject(id, updateData);

      if (!updatedProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      res.json({
        success: true,
        message: "Project updated successfully",
        data: updatedProject,
      });
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update project",
      });
    }
  }

  static async getProjectById(req, res) {
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
      const project = await ProjectService.getProjectById(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error("Get project error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch project",
      });
    }
  }

  static async getProjectImage(req, res) {
    try {
      const { id } = req.params;
      const imageData = await ProjectService.getProjectImage(id);

      if (!imageData) {
        return res.status(404).json({
          success: false,
          message: "Project image not found",
        });
      }

      // Set appropriate headers
      res.set({
        "Content-Type": imageData.mimetype,
        "Content-Length": imageData.size,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "Content-Disposition": `inline; filename="${imageData.filename}"`,
      });

      res.send(imageData.data);
    } catch (error) {
      console.error("Get project image error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch project image",
      });
    }
  }

  static async updateProjectStatus(req, res) {
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
      console.log(id);

      const { status, reason, email } = req.body;

      console.log("id", id);

      const updatedProject = await ProjectService.updateProjectStatus(
        id,
        {
          status,
          reason,
          reviewedBy: "",
          reviewedAt: new Date(),
        },
        email
      );

      if (!updatedProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      res.json({
        success: true,
        message: `Project ${status} successfully`,
        data: updatedProject,
      });
    } catch (error) {
      console.error("Update project status error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update project status",
      });
    }
  }
}

export default ProjectController;

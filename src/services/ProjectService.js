import supabase from "../config/supabase.js";

class ProjectService {
  static async getAllProjects({ page, limit, status, search }) {
    try {
      let query = supabase.from("projects").select(
        `
          id,
          title,
          description,
          category,
          funding_goal,
          current_funding,
          status,
          user_id,
          submitted_at,
          created_at,
          updated_at,
          image_filename,
          image_mimetype,
          image_size,
          image_alt,
          users(name, email),
          project_reviews(status, reason, reviewed_at, admins(name))
        `,
        { count: "exact" }
      );

      // Apply filters
      if (status) {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`
        );
      }

      // Get total count
      const { count } = await query;

      // Apply pagination and ordering
      const startIndex = (page - 1) * limit;
      query = query
        .range(startIndex, startIndex + limit - 1)
        .order("submitted_at", { ascending: false });

      const { data: projects, error } = await query;

      if (error) throw error;

      // Format the response
      const formattedProjects = projects.map((project) => ({
        ...project,
        userName: project.users?.name,
        userEmail: project.users?.email,
        reviewedAt: project.project_reviews?.[0]?.reviewed_at,
        reviewedBy: project.project_reviews?.[0]?.admins?.name,
        reason: project.project_reviews?.[0]?.reason,
        hasImage: !!project.image_filename,
        imageUrl: project.image_filename
          ? `/api/admin/projects/${project.id}/image`
          : null,
      }));

      return {
        projects: formattedProjects,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalProjects: count,
          hasNext: startIndex + limit < count,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting all projects:", error);
      throw error;
    }
  }

  static async createProject(projectData) {
    try {
      // Validate image if provided
      if (projectData.image_data) {
        this.validateImage(projectData);
      }

      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            title: projectData.title,
            description: projectData.description,
            category: projectData.category,
            funding_goal: projectData.funding_goal,
            current_funding: projectData.current_funding || 0,
            status: projectData.status || "pending",
            user_id: projectData.user_id,
            image_data: projectData.image_data,
            image_filename: projectData.image_filename,
            image_mimetype: projectData.image_mimetype,
            image_size: projectData.image_size,
            image_alt: projectData.image_alt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            submitted_at: new Date().toISOString(),
          },
        ])
        .select(
          `
          id,
          title,
          description,
          category,
          funding_goal,
          current_funding,
          status,
          user_id,
          submitted_at,
          created_at,
          updated_at,
          image_filename,
          image_mimetype,
          image_size,
          image_alt
        `
        )
        .single();

      if (error) throw error;

      return {
        ...data,
        hasImage: !!data.image_filename,
        imageUrl: data.image_filename
          ? `/api/admin/projects/${data.id}/image`
          : null,
      };
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  static async updateProject(id, updateData) {
    try {
      // Validate image if provided
      if (updateData.image_data) {
        this.validateImage(updateData);
      }

      const { data, error } = await supabase
        .from("projects")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(
          `
          id,
          title,
          description,
          category,
          funding_goal,
          current_funding,
          status,
          user_id,
          submitted_at,
          created_at,
          updated_at,
          image_filename,
          image_mimetype,
          image_size,
          image_alt
        `
        )
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return {
        ...data,
        hasImage: !!data.image_filename,
        imageUrl: data.image_filename
          ? `/api/admin/projects/${data.id}/image`
          : null,
      };
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  static async getProjectById(id) {
    try {
      const { data: project, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          users(name, email, phone),
          project_reviews(status, reason, reviewed_at, admins(name))
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      // Get donation stats for this project
      const { data: donations } = await supabase
        .from("donations")
        .select("amount, donated_at, users(name)")
        .eq("project_id", id)
        .eq("status", "completed")
        .order("donated_at", { ascending: false });

      return {
        ...project,
        userName: project.users?.name,
        userEmail: project.users?.email,
        userPhone: project.users?.phone,
        reviewedAt: project.project_reviews?.[0]?.reviewed_at,
        reviewedBy: project.project_reviews?.[0]?.admins?.name,
        reason: project.project_reviews?.[0]?.reason,
        donations: donations || [],
        hasImage: !!project.image_filename,
        imageUrl: project.image_filename
          ? `/api/admin/projects/${project.id}/image`
          : null,
        // Don't include binary data in regular responses
        image_data: undefined,
      };
    } catch (error) {
      console.error("Error getting project by ID:", error);
      throw error;
    }
  }

  static async getProjectImage(id) {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("image_data, image_filename, image_mimetype, image_size")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      if (!data.image_data) {
        return null;
      }

      return {
        data: data.image_data,
        filename: data.image_filename,
        mimetype: data.image_mimetype,
        size: data.image_size,
      };
    } catch (error) {
      console.error("Error getting project image:", error);
      throw error;
    }
  }

  static async updateProjectStatus(id, statusData) {
    try {
      // Start a transaction
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .update({
          status: statusData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (projectError) {
        if (projectError.code === "PGRST116") {
          return null;
        }
        throw projectError;
      }

      // Add review record
      const { error: reviewError } = await supabase
        .from("project_reviews")
        .insert([
          {
            project_id: id,
            admin_id: statusData.reviewedBy,
            status: statusData.status,
            reason: statusData.reason,
            reviewed_at: statusData.reviewedAt || new Date().toISOString(),
          },
        ]);

      if (reviewError) {
        console.error("Error creating review record:", reviewError);
        // Don't throw here as the project update succeeded
      }

      return project;
    } catch (error) {
      console.error("Error updating project status:", error);
      throw error;
    }
  }

  static validateImage(imageData) {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(imageData.image_mimetype)) {
      throw new Error(
        "Invalid file type. Please upload JPEG, PNG, GIF, or WebP images only."
      );
    }

    if (imageData.image_size > maxSize) {
      throw new Error("File too large. Maximum size is 10MB.");
    }
  }
}

export default ProjectService;

import supabase from "../config/supabase.js";

class PartnershipService {
  static async createApplication(applicationData) {
    try {
      const { data, error } = await supabase
        .from("partnership_applications")
        .insert([
          {
            first_name: applicationData.firstName,
            last_name: applicationData.lastName,
            email: applicationData.email,
            country: applicationData.country,
            job_post: applicationData.jobPost,
            hear_about_us: applicationData.hearAboutUs,
            process_option: applicationData.processOption.toLowerCase(),
            organization_name: applicationData.organizationName || null,
            legal_constitution: applicationData.legalConstitution || null,
            org_country: applicationData.orgCountry || null,
            address: applicationData.address || null,
            website: applicationData.website || null,
            phone: applicationData.phone || null,
            org_email: applicationData.orgEmail || null,
            partnership_summary: applicationData.partnershipSummary,
            status: "pending",
            submitted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating partnership application:", error);
      throw error;
    }
  }

  static async getAllApplications({ page, limit, status, search }) {
    try {
      let query = supabase
        .from("partnership_applications")
        .select("*", { count: "exact" });

      // Apply filters
      if (status) {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,organization_name.ilike.%${search}%`
        );
      }

      // Get total count
      const { count } = await query;

      // Apply pagination and ordering
      const startIndex = (page - 1) * limit;
      query = query
        .range(startIndex, startIndex + limit - 1)
        .order("submitted_at", { ascending: false });

      const { data: applications, error } = await query;

      if (error) throw error;

      // Format the response
      const formattedApplications = applications.map((app) => ({
        ...app,
        fullName: `${app.first_name} ${app.last_name}`,
        isIndividual: app.process_option === "individual",
        isCorporate: app.process_option === "corporate",
      }));

      return {
        applications: formattedApplications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalApplications: count,
          hasNext: startIndex + limit < count,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting all partnership applications:", error);
      throw error;
    }
  }

  static async getApplicationById(id) {
    try {
      const { data: application, error } = await supabase
        .from("partnership_applications")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return {
        ...application,
        fullName: `${application.first_name} ${application.last_name}`,
        isIndividual: application.process_option === "individual",
        isCorporate: application.process_option === "corporate",
      };
    } catch (error) {
      console.error("Error getting partnership application by ID:", error);
      throw error;
    }
  }

  static async updateApplicationStatus(id, statusData) {
    try {
      const { data, error } = await supabase
        .from("partnership_applications")
        .update({
          status: statusData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error updating partnership application status:", error);
      throw error;
    }
  }

  static async deleteApplication(id) {
    try {
      const { error } = await supabase
        .from("partnership_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting partnership application:", error);
      throw error;
    }
  }

  static async getApplicationStats() {
    try {
      const { data: applications, error } = await supabase
        .from("partnership_applications")
        .select("status, process_option, submitted_at");

      if (error) throw error;

      const stats = {
        total: applications.length,
        byStatus: {
          pending: applications.filter((app) => app.status === "pending")
            .length,
          under_review: applications.filter(
            (app) => app.status === "under_review"
          ).length,
          approved: applications.filter((app) => app.status === "approved")
            .length,
          rejected: applications.filter((app) => app.status === "rejected")
            .length,
        },
        byType: {
          individual: applications.filter(
            (app) => app.process_option === "individual"
          ).length,
          corporate: applications.filter(
            (app) => app.process_option === "corporate"
          ).length,
        },
        recentApplications: applications.filter((app) => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return new Date(app.submitted_at) >= thirtyDaysAgo;
        }).length,
      };

      return stats;
    } catch (error) {
      console.error("Error getting partnership application stats:", error);
      throw error;
    }
  }
}

export default PartnershipService;

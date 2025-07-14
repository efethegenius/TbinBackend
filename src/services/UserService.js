import supabase from "../config/supabase.js";

class UserService {
  // static async createUser(userData) {
  //   try {
  //     const { data, error } = await supabase
  //       .from("users")
  //       .insert([
  //         {
  //           name: userData.name,
  //           email: userData.email,
  //           phone: userData.phone || null,
  //           address: userData.address || null,
  //           status: userData.status || "active",
  //           is_admin: userData.is_admin || false,
  //           created_at: new Date().toISOString(),
  //           updated_at: new Date().toISOString(),
  //         },
  //       ])
  //       .select()
  //       .single();

  //     if (error) throw error;
  //     return data;
  //   } catch (error) {
  //     console.error("Error creating user:", error);
  //     throw error;
  //   }
  // }

  // services/UserService.js
  static async createProfile({
    id,
    name,
    email,
    phone,
    address,
    status,
    is_admin,
  }) {
    // NOTE: no password here!
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id, // FK to auth.users
          name,
          email,
          phone: phone || null,
          address: address || null,
          status,
          is_admin,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAllUsers({ page, limit, search }) {
    try {
      let query = supabase
        .from("users")
        .select("*, projects:projects(count)", { count: "exact" });

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Get total count for pagination
      const { count } = await query;

      // Apply pagination
      const startIndex = (page - 1) * limit;
      query = query
        .range(startIndex, startIndex + limit - 1)
        .order("created_at", { ascending: false });

      const { data: users, error } = await query;

      if (error) throw error;

      // Get donation stats for each user
      const userIds = users.map((user) => user.id);
      const { data: donationStats } = await supabase
        .from("donations")
        .select("user_id, amount")
        .in("user_id", userIds)
        .eq("status", "completed");

      // Calculate donation totals and project counts
      const usersWithStats = users.map((user) => {
        const userDonations =
          donationStats?.filter((d) => d.user_id === user.id) || [];
        const totalDonations = userDonations.reduce(
          (sum, d) => sum + parseFloat(d.amount),
          0
        );

        return {
          ...user,
          totalDonations,
          projectsSupported: userDonations.length,
        };
      });

      return {
        users: usersWithStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalUsers: count,
          hasNext: startIndex + limit < count,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  static async getUserById(id) {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      // Get user's donation stats
      const { data: donations } = await supabase
        .from("donations")
        .select("amount, project_id, projects(title)")
        .eq("user_id", id)
        .eq("status", "completed");

      const totalDonations =
        donations?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
      const uniqueProjects = new Set(donations?.map((d) => d.project_id) || []);

      return {
        ...user,
        totalDonations,
        projectsSupported: uniqueProjects.size,
        donations: donations || [],
      };
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw error;
    }
  }

  static async updateUser(id, updateData) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...updateData,
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
      console.error("Error updating user:", error);
      throw error;
    }
  }

  static async deleteUser(id) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          status: "inactive",
          deactivated_at: new Date().toISOString(),
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

      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  // New method to check if user is admin
  static async isUserAdmin(userId) {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }

      return user?.is_admin || false;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }

  // Method to promote user to admin
  static async promoteToAdmin(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          is_admin: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      throw error;
    }
  }

  // Method to revoke admin privileges
  static async revokeAdminPrivileges(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          is_admin: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error revoking admin privileges:", error);
      throw error;
    }
  }

  static async findUserByEmail(email) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") throw error; // ignore "row not found"
    return data;
  }
}

export default UserService;

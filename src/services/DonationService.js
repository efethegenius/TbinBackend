import supabase from "../config/supabase.js";

class DonationService {
  static async createDonation({
    amount,
    currency = "NGN",
    processing_fee = 0,
    donor_name,
    user_id = null,
    project_id,
    payment_method,
    transaction_id,
    status = "pending",
    donated_at = new Date().toISOString(),
  }) {
    const { data: donation, error } = await supabase
      .from("donations")
      .insert([
        {
          amount,
          currency,
          processing_fee,
          donor_name: donor_name,
          user_id: user_id || null,
          project_id,
          payment_method,
          transaction_id,
          status,
          donated_at,
        },
      ])
      .select(); // returns inserted row(s)

    console.log("asdfasdfasdfdsaf");

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    const { data: fundingData, error: updateError } = await supabase.rpc(
      "increment_funding",
      {
        project_id_input: project_id,
        amount_input: amount,
      }
    );

    if (updateError) {
      console.error("Failed to update funding:", updateError.message); // ✅ now logs
      throw new Error(`Funding update failed: ${updateError.message}`);
    } else {
      console.log("Funding update successful", fundingData);
    }

    return donation[0];
  }
  static async getAllDonations({ filters }) {
    try {
      let query = supabase
        .from("donations")
        .select(
          `
          *,
          users(name, email),
          projects(title)
        `
        )
        .order("donated_at", { ascending: false });

      // Apply filters
      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }

      if (filters.projectId) {
        query = query.eq("project_id", filters.projectId);
      }

      if (filters.startDate) {
        query = query.gte("donated_at", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("donated_at", filters.endDate);
      }

      const { data: donations, error } = await query;

      if (error) throw error;

      const formattedDonations = donations.map((donation) => ({
        ...donation,
        donorName: donation.donor_name || donation.users?.name || "Anonymous",
        userName: donation.users?.name,
        userEmail: donation.users?.email,
        projectTitle: donation.projects?.title,
        isAnonymous: !donation.user_id,
      }));

      return {
        donations: formattedDonations,
      };
    } catch (error) {
      console.error("Error getting all donations:", error);
      throw error;
    }
  }

  static async getDonationSummary() {
    try {
      // Get overall donation stats
      const { data: overallStats, error: statsError } = await supabase
        .from("donations")
        .select("amount, processing_fee")
        .eq("status", "completed");

      if (statsError) throw statsError;

      const totalDonations = overallStats.reduce(
        (sum, d) => sum + parseFloat(d.amount),
        0
      );
      const totalProcessingFees = overallStats.reduce(
        (sum, d) => sum + parseFloat(d.processing_fee),
        0
      );
      const netAmount = totalDonations - totalProcessingFees;
      const donationCount = overallStats.length;
      const averageDonation =
        donationCount > 0 ? totalDonations / donationCount : 0;

      // Get project summary
      const { data: projectStats, error: projectError } = await supabase
        .from("donations")
        .select(
          `
          project_id,
          amount,
          projects(title)
        `
        )
        .eq("status", "completed");

      if (projectError) throw projectError;

      const projectSummary = projectStats.reduce((acc, donation) => {
        const projectId = donation.project_id;
        if (!acc[projectId]) {
          acc[projectId] = {
            projectId,
            projectTitle: donation.projects?.title,
            totalAmount: 0,
            donationCount: 0,
          };
        }
        acc[projectId].totalAmount += parseFloat(donation.amount);
        acc[projectId].donationCount += 1;
        return acc;
      }, {});

      // Get monthly donations for the last 12 months
      const { data: monthlyData, error: monthlyError } = await supabase
        .from("donations")
        .select("amount, donated_at")
        .eq("status", "completed")
        .gte(
          "donated_at",
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        );

      if (monthlyError) throw monthlyError;

      // Group by month
      const monthlyDonations = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthTotal = monthlyData
          .filter((d) => {
            const donationDate = new Date(d.donated_at);
            return donationDate >= monthStart && donationDate <= monthEnd;
          })
          .reduce((sum, d) => sum + parseFloat(d.amount), 0);

        monthlyDonations.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`,
          monthName: date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          amount: monthTotal,
        });
      }

      return {
        overview: {
          totalDonations,
          totalProcessingFees,
          netAmount,
          donationCount,
          averageDonation,
        },
        projectSummary: Object.values(projectSummary),
        monthlyDonations,
      };
    } catch (error) {
      console.error("Error getting donation summary:", error);
      throw error;
    }
  }

  static async updateDonation(id, updateData) {
    try {
      const { data, error } = await supabase
        .from("donations")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(
          `
          *,
          users(name, email),
          projects(title)
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
        donorName: data.donor_name || data.users?.name || "Anonymous",
        userEmail: data.users?.email || null,
        projectTitle: data.projects?.title,
        isAnonymous: !data.user_id,
      };
    } catch (error) {
      console.error("Error updating donation:", error);
      throw error;
    }
  }

  static async getDonationById(id) {
    try {
      const { data: donation, error } = await supabase
        .from("donations")
        .select(
          `
          *,
          users(name, email, phone),
          projects(title, description)
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

      return {
        ...donation,
        donorName: donation.donor_name || donation.users?.name || "Anonymous",
        userEmail: donation.users?.email || null,
        userPhone: donation.users?.phone || null,
        projectTitle: donation.projects?.title,
        projectDescription: donation.projects?.description,
        isAnonymous: !donation.user_id,
      };
    } catch (error) {
      console.error("Error getting donation by ID:", error);
      throw error;
    }
  }
}

export default DonationService;

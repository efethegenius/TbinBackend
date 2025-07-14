import supabase from "../config/supabase.js";

class ReportsService {
  static async exportDonationsJSON(filters) {
    try {
      let query = supabase.from("donations").select(`
          *,
          users(name, email),
          projects(title)
        `);

      // Apply filters
      if (filters.projectId) {
        query = query.eq("project_id", filters.projectId);
      }

      if (filters.donorEmail) {
        query = query.eq("users.email", filters.donorEmail);
      }

      if (filters.startDate) {
        query = query.gte("donated_at", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("donated_at", filters.endDate);
      }

      const { data: donations, error } = await query.order("donated_at", {
        ascending: false,
      });

      if (error) throw error;

      // Format the data
      const formattedDonations = donations.map((donation) => ({
        ...donation,
        donorName: donation.donor_name || donation.users?.name || "Anonymous",
        userEmail: donation.users?.email || null,
        projectTitle: donation.projects?.title,
        isAnonymous: !donation.user_id,
      }));

      const exportData = {
        exportedAt: new Date().toISOString(),
        filters,
        summary: {
          totalRecords: formattedDonations.length,
          totalAmount: formattedDonations.reduce(
            (sum, d) => sum + parseFloat(d.amount),
            0
          ),
          totalFees: formattedDonations.reduce(
            (sum, d) => sum + parseFloat(d.processing_fee),
            0
          ),
          anonymousDonations: formattedDonations.filter((d) => d.isAnonymous)
            .length,
          registeredDonations: formattedDonations.filter((d) => !d.isAnonymous)
            .length,
        },
        donations: formattedDonations,
      };

      return exportData;
    } catch (error) {
      console.error("Error exporting donations JSON:", error);
      throw error;
    }
  }

  static async exportDonationsCSV(filters) {
    try {
      const jsonData = await this.exportDonationsJSON(filters);

      const csvData = [
        [
          "Donation ID",
          "Amount",
          "Currency",
          "Donor Name",
          "Donor Email",
          "Project Title",
          "Payment Method",
          "Transaction ID",
          "Status",
          "Donated At",
          "Processing Fee",
          "Is Anonymous",
        ],
      ];

      jsonData.donations.forEach((donation) => {
        csvData.push([
          donation.id,
          donation.amount,
          donation.currency,
          donation.donorName,
          donation.userEmail || "",
          donation.projectTitle || "",
          donation.payment_method,
          donation.transaction_id || "",
          donation.status,
          donation.donated_at,
          donation.processing_fee,
          donation.isAnonymous ? "Yes" : "No",
        ]);
      });

      // Convert to CSV string
      const csvString = csvData
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      return csvString;
    } catch (error) {
      console.error("Error exporting donations CSV:", error);
      throw error;
    }
  }
}

export default ReportsService;

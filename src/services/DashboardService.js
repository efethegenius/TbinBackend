import supabase from '../config/supabase.js';

class DashboardService {
  static async getOverview() {
    try {
      // Get user stats
      const { data: userStats, error: userError } = await supabase
        .from('users')
        .select('status, created_at');

      if (userError) throw userError;

      const totalUsers = userStats.length;
      const activeUsers = userStats.filter(user => user.status === 'active').length;

      // Get project stats
      const { data: projectStats, error: projectError } = await supabase
        .from('projects')
        .select('status, submitted_at');

      if (projectError) throw projectError;

      const totalProjects = projectStats.length;
      const projectsByStatus = {
        pending: projectStats.filter(p => p.status === 'pending').length,
        approved: projectStats.filter(p => p.status === 'approved').length,
        rejected: projectStats.filter(p => p.status === 'rejected').length
      };

      // Get donation stats
      const { data: donationStats, error: donationError } = await supabase
        .from('donations')
        .select('amount, donated_at, project_id, projects(title)')
        .eq('status', 'completed');

      if (donationError) throw donationError;

      const totalDonationAmount = donationStats.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const totalDonationCount = donationStats.length;
      const averageDonation = totalDonationCount > 0 ? totalDonationAmount / totalDonationCount : 0;

      // Recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUsers = userStats.filter(
        user => new Date(user.created_at) >= thirtyDaysAgo
      ).length;

      const recentProjects = projectStats.filter(
        project => new Date(project.submitted_at) >= thirtyDaysAgo
      ).length;

      const recentDonations = donationStats.filter(
        donation => new Date(donation.donated_at) >= thirtyDaysAgo
      ).length;

      // Monthly donation trend (last 12 months)
      const monthlyTrend = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthTotal = donationStats
          .filter(d => {
            const donationDate = new Date(d.donated_at);
            return donationDate >= monthStart && donationDate <= monthEnd;
          })
          .reduce((sum, d) => sum + parseFloat(d.amount), 0);

        monthlyTrend.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          monthName: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          amount: monthTotal
        });
      }

      // Top projects by donation amount
      const projectDonations = donationStats.reduce((acc, donation) => {
        const projectId = donation.project_id;
        if (!acc[projectId]) {
          acc[projectId] = {
            projectId,
            projectTitle: donation.projects?.title,
            totalAmount: 0,
            donationCount: 0
          };
        }
        acc[projectId].totalAmount += parseFloat(donation.amount);
        acc[projectId].donationCount += 1;
        return acc;
      }, {});

      const topProjects = Object.values(projectDonations)
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      return {
        summary: {
          totalUsers,
          activeUsers,
          totalProjects,
          totalDonations: totalDonationAmount,
          netDonations: totalDonationAmount // Simplified for now
        },
        projects: {
          total: totalProjects,
          byStatus: projectsByStatus
        },
        donations: {
          total: totalDonationCount,
          totalAmount: totalDonationAmount,
          averageAmount: averageDonation,
          monthlyTrend
        },
        recentActivity: {
          newUsers: recentUsers,
          newProjects: recentProjects,
          newDonations: recentDonations
        },
        topProjects
      };
    } catch (error) {
      console.error('Error getting dashboard overview:', error);
      throw error;
    }
  }
}

export default DashboardService;
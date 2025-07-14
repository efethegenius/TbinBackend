import DashboardService from '../services/DashboardService.js';

class DashboardController {
  static async getOverview(req, res) {
    try {
      const overview = await DashboardService.getOverview();

      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      console.error('Get overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overview data'
      });
    }
  }
}

export default DashboardController;
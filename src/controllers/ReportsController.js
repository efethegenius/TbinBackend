import { validationResult } from 'express-validator';
import ReportsService from '../services/ReportsService.js';

class ReportsController {
  static async exportDonations(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { format = 'json', projectId, donorEmail, startDate, endDate } = req.query;
      
      const filters = {
        projectId,
        donorEmail,
        startDate,
        endDate
      };

      if (format === 'csv') {
        const csvData = await ReportsService.exportDonationsCSV(filters);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="donations-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvData);
      } else {
        const jsonData = await ReportsService.exportDonationsJSON(filters);
        res.json({
          success: true,
          data: jsonData
        });
      }
    } catch (error) {
      console.error('Export donations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export donations'
      });
    }
  }
}

export default ReportsController;
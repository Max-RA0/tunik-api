const dashboardService = require('../services/dashboard.service');
const response = require('../utils/response.util');

class DashboardController {
  async getStats(req, res, next) {
    try {
      const stats = await dashboardService.getStats();
      return response.success(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();

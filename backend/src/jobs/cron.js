const cron = require('node-cron');
const analysisService = require('../services/analysis.service');

function initCron() {
  // Read expression from env. Defaults to run every minute for quick testing,
  // in production this would typically be hourly ('0 * * * *') or every 15 mins ('*/15 * * * *')
  const pattern = process.env.ANALYSIS_CRON_INTERVAL || '* * * * *';
  
  console.log(`Scheduling Aquifer Analysis Cron Job: [${pattern}]`);

  cron.schedule(pattern, async () => {
    try {
      await analysisService.runAnalysis();
    } catch (e) {
      console.error('Error triggered during scheduled analysis cron execution:', e);
    }
  });
}

module.exports = {
  initCron
};

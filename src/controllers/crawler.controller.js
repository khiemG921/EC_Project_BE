const path = require('path');
const fs = require('fs');
const crawler = require('../services/crawler.service');

exports.getStatus = async (req, res) => {
  try {
    return res.json({ success: true, data: crawler.getStatus() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Failed to get status' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { enabled, cron, pythonPath, mode, notebookPath, scriptPath, outputDir } = req.body || {};
    const status = crawler.updateConfig({ enabled, cron, pythonPath, mode, notebookPath, scriptPath, outputDir });
    return res.json({ success: true, data: status });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ success: false, message: e.message || 'Failed to update config' });
  }
};

exports.runNow = async (req, res) => {
  try {
    const result = await crawler.runNow();
    return res.json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ success: false, message: e.message || 'Failed to run crawler' });
  }
};

exports.downloadCsv = async (req, res) => {
  try {
    const { file } = req.params;
    const { outputDir } = crawler.getStatus();
    const full = path.join(outputDir, file);
    if (!fs.existsSync(full)) return res.status(404).send('Not found');
    return res.download(full);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Failed to download file' });
  }
};

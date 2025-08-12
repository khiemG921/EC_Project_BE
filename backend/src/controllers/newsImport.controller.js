const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const sequelize = require('../config/db');
const News = require('../models/news');
const crawler = require('../services/crawler.service');

async function readCsvRows(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

exports.importLatestCsv = async (req, res) => {
  const { maxTotal } = req.body || {}; // optional cap after insert
  try {
    const { outputDir, files } = crawler.getStatus();
    if (!files || !files.length) {
      return res.status(400).json({ success: false, message: 'No CSV available to import' });
    }
    const latest = files[0].name;
    const full = path.join(outputDir, latest);
    if (!fs.existsSync(full)) {
      return res.status(404).json({ success: false, message: 'CSV file not found' });
    }

    const items = await readCsvRows(full);
    // Expect columns: news_id, title, content, image_url
    let inserted = 0, skipped = 0;

    await sequelize.transaction(async (t) => {
      for (const it of items) {
        const title = (it.title || '').toString().trim();
        const content = (it.content || '').toString().trim();
        const image_url = it.image_url ? it.image_url.toString().trim() : null;
        if (!title || !content) { skipped++; continue; }

        // dedupe by title+content
        const exist = await News.findOne({ where: { title, content }, transaction: t });
        if (exist) { skipped++; continue; }

        await News.create({ title, content, image_url, source: 'Nguồn: JupViec' }, { transaction: t });
        inserted++;
      }

      if (maxTotal && Number(maxTotal) > 0) {
        // prune oldest rows beyond cap (keep newest by news_id)
        const [results] = await sequelize.query('SELECT news_id FROM news ORDER BY news_id DESC', { transaction: t });
        const ids = results.map(r => r.news_id);
        if (ids.length > maxTotal) {
          const toDelete = ids.slice(maxTotal);
          if (toDelete.length) {
            await News.destroy({ where: { news_id: toDelete } , transaction: t });
          }
        }
      }
    });

    return res.json({ success: true, data: { inserted, skipped, totalRows: items.length } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Import failed', error: e.message });
  }
};

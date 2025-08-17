const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');

const DATA_DIR = path.resolve(__dirname, '../../data');
const OUTPUT_DIR_DEFAULT = path.resolve(__dirname, '../../data_crawling/output');
const CONFIG_PATH = path.join(DATA_DIR, 'crawler_config.json');

let state = {
  enabled: false,
  cron: '0 0 * * 0', // weekly at Sunday 00:00
  lastRun: null,
  lastStatus: 'idle', // idle|running|success|error
  lastMessage: null,
  pythonPath: process.env.CRAWLER_PYTHON || '/opt/venv/bin/python',
  mode: process.env.CRAWLER_MODE === 'notebook' ? 'notebook' : 'script', // notebook|script
  notebookPath: path.resolve(__dirname, '../../data_crawling/data_collection.ipynb'),
  scriptPath: path.resolve(__dirname, '../../data_crawling/crawl_news.py'),
  outputDir: OUTPUT_DIR_DEFAULT,
  lastOutputFile: null,
};

let scheduledTask = null;

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(state.outputDir)) fs.mkdirSync(state.outputDir, { recursive: true });
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const file = fs.readFileSync(CONFIG_PATH, 'utf8');
      const cfg = JSON.parse(file);
      state = { ...state, ...cfg };
    }
  } catch (e) {
    console.error('Failed to load crawler config:', e);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({
      enabled: state.enabled,
      cron: state.cron,
      pythonPath: state.pythonPath,
      mode: state.mode,
      notebookPath: state.notebookPath,
      scriptPath: state.scriptPath,
      outputDir: state.outputDir,
    }, null, 2));
  } catch (e) {
    console.error('Failed to save crawler config:', e);
  }
}

function schedule() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
  if (state.enabled) {
    scheduledTask = cron.schedule(state.cron, () => {
      runNow().catch(err => console.error('Scheduled crawl failed:', err));
    });
    scheduledTask.start();
  }
}

function listCsvFiles() {
  ensureDirs();
  if (!fs.existsSync(state.outputDir)) return [];
  const files = fs.readdirSync(state.outputDir)
    .filter(f => f.toLowerCase().endsWith('.csv'))
    .map(name => {
      const full = path.join(state.outputDir, name);
      const stat = fs.statSync(full);
      return { name, size: stat.size, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return files;
}

async function runNow() {
  ensureDirs();
  if (state.lastStatus === 'running') {
    throw new Error('Crawler is already running');
  }
  state.lastStatus = 'running';
  state.lastMessage = null;
  state.lastRun = new Date().toISOString();

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outCsv = path.join(state.outputDir, `news_${ts}.csv`);

  const args = [];
  let cmd = state.pythonPath;

  if (state.mode === 'notebook') {
    // Execute notebook via python -m jupyter nbconvert for better Windows compatibility
    // Requires jupyter installed in the selected python environment.
    cmd = state.pythonPath;
    args.push(
      '-m', 'jupyter', 'nbconvert',
      '--to', 'notebook',
      '--execute',
      '--ClearOutputPreprocessor.enabled=False',
      '--ExecutePreprocessor.timeout=600',
      '--output', `run_${ts}.ipynb`,
      state.notebookPath
    );
  } else {
    // Script mode: pass output path and limit to 10 items in headless mode by default
    const maxItems = Number(process.env.CRAWLER_MAX_ITEMS || 10);
    const maxPages = Number(process.env.CRAWLER_MAX_PAGES || 10);
    console.log("Script path:", state.scriptPath);
    const headlessFlag = (process.env.CRAWLER_HEADLESS || 'true').toLowerCase() !== 'false';
    args.push(state.scriptPath, '--out', outCsv, '--max-items', String(maxItems), '--max-pages', String(maxPages));
    if (headlessFlag) args.push('--headless');
  }

  console.log('Spawning crawler with command:', cmd, args.join(' '));

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: path.resolve(__dirname, '../../../'),
      shell: process.platform === 'win32',
      env: process.env,
    });

    let logs = '';
    child.stdout.on('data', d => { logs += d.toString(); });
    child.stderr.on('data', d => { logs += d.toString(); });

    child.on('close', (code) => {
      state.lastStatus = code === 0 ? 'success' : 'error';
      state.lastMessage = logs.slice(-4000);

      // Try to find the newest CSV if notebook generated it with fixed name
      // Fallback to our constructed outCsv if script mode
      let files = listCsvFiles();
      if (!files.length && state.mode === 'notebook') {
        // As a fallback, scan data_crawling for any CSV and copy latest to outputDir
        try {
          const dcDir = path.resolve(__dirname, '../../data_crawling');
          const dcCsvs = fs.readdirSync(dcDir)
            .filter(f => f.toLowerCase().endsWith('.csv'))
            .map(name => {
              const full = path.join(dcDir, name);
              const stat = fs.statSync(full);
              return { name, full, mtime: stat.mtimeMs };
            })
            .sort((a, b) => b.mtime - a.mtime);
          if (dcCsvs.length) {
            const latest = dcCsvs[0];
            const dest = path.join(state.outputDir, `news_${ts}.csv`);
            fs.copyFileSync(latest.full, dest);
          }
        } catch (e) {
          // ignore
        }
        files = listCsvFiles();
      }
      if (files.length) {
        state.lastOutputFile = files[0].name;
      } else if (state.mode === 'script') {
        state.lastOutputFile = path.basename(outCsv);
      }

      if (code === 0) resolve({ status: state.lastStatus, file: state.lastOutputFile });
      else reject(new Error(`Crawler exited with code ${code}`));
    });
  });
}

function getStatus() {
  return {
    enabled: state.enabled,
    cron: state.cron,
    lastRun: state.lastRun,
    lastStatus: state.lastStatus,
    lastMessage: state.lastMessage,
    lastOutputFile: state.lastOutputFile,
    pythonPath: state.pythonPath,
    mode: state.mode,
    notebookPath: state.notebookPath,
    scriptPath: state.scriptPath,
    outputDir: state.outputDir,
    files: listCsvFiles(),
  };
}

function updateConfig(partial) {
  state = { ...state, ...partial };
  ensureDirs();
  saveConfig();
  schedule();
  return getStatus();
}

function init() {
  ensureDirs();
  loadConfig();
  schedule();
}

module.exports = {
  init,
  runNow,
  getStatus,
  updateConfig,
  listCsvFiles,
};

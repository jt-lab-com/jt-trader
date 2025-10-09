import * as fs from 'fs';
import * as path from 'path';

const ROOT_PATH = process.cwd();
const ENV_PATH = path.join(ROOT_PATH, '.env');
const DB_PATH = path.join(ROOT_PATH, 'storage.db');

const ENV_DEFAULTS: Record<string, string> = {
  PORT: '8080',
  STRATEGY_FILES_PATH: path.join(ROOT_PATH, 'strategy-source', 'src'),
  EXCHANGE_LIST_FILE_PATH: path.join(ROOT_PATH, 'exchanges.txt'),
  ARTIFACTS_DIR_PATH: path.join(ROOT_PATH, 'artifacts'),
  LOGS_DIR_PATH: path.join(ROOT_PATH, 'artifacts'),
  HISTORY_BARS_PATH: path.join(ROOT_PATH, 'downloaded-history-bars'),
  DATABASE_URL: `file:${path.join(ROOT_PATH, 'storage.db')}`,
  SITE_API_HOST: 'https://jt-lab.com',
  ROLLUP_TS_CONFIG: path.join(ROOT_PATH, 'tsconfig.bundler.json'),
  ENGINE_MODE: 'both',
  STANDALONE_APP: '1',
};

function ensureEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    fs.writeFileSync(ENV_PATH, '');
  }
}

function ensureDatabaseFile() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, '');
  }
}

function readEnvFile() {
  return fs.readFileSync(ENV_PATH, 'utf8').split('\n');
}

function writeEnvFile(lines: string[]) {
  fs.writeFileSync(ENV_PATH, lines.join('\n'), 'utf-8');
}

function setupEnvironment() {
  ensureEnvFile();
  ensureDatabaseFile();

  const lines = readEnvFile();
  const existingKeys = new Set(
    lines
      .map((line) => line.trim())
      .filter((line) => !!line && !line.startsWith('#'))
      .map((line) => line.split('=')[0]),
  );

  let updated = false;

  for (const [key, value] of Object.entries(ENV_DEFAULTS)) {
    if (!existingKeys.has(key)) {
      lines.push(`${key}=${value}`);
      updated = true;
    }
  }

  if (updated) {
    writeEnvFile(lines);
  }
}

setupEnvironment();

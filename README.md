# JT Trader

[![License](https://img.shields.io/badge/license-AGPLv3-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![CCXT](https://img.shields.io/badge/CCXT-4.0+-orange.svg)](https://github.com/ccxt/ccxt)
[![JT-Lib](https://img.shields.io/badge/JT--Lib-0.0+-purple.svg)](https://github.com/jt-lab-com/jt-lib)


JT Trader is a powerful algorithmic trading platform built on modern technology stack. The platform provides a complete set of tools for creating, testing, and deploying trading strategies.

## 📋 Table of Contents

- [🚀 Key Features](#-key-features)
- [📋 Requirements](#-requirements)
- [🛠 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🚀 Running](#-running)
- [📚 Documentation](#-documentation)
- [📄 License](#-license)
- [🤝 Support](#-support)
- [🔗 Related Projects](#-related-projects)

## 🚀 Key Features

- **Strategy Development** - Create trading strategies using TypeScript and modern API
- **Strategy Testing** - Built-in tester for validating strategies on historical data
- **Real-time Trading** - Run strategies in real-time mode
- **Web Interface** - User-friendly web interface for strategy management
- **Reporting** - Detailed analytics and reports on trading operations
- **API** - RESTful API for integration with external systems

## 📋 Requirements

- Node.js v18.x
- Redis
- SQLite (built-in database)

## 🛠 Installation

1. Clone the repository with submodules:
```bash
git clone --recurse-submodules git@github.com:jt-lab-com/jt-trader.git
```

2. Navigate to the project directory and install dependencies:
```bash
cd jt-trader && yarn
```

3. Configure environment variables by copying `.env.example` to `.env` and setting the required values.

## ⚙️ Configuration

Create a `.env` file in the project root directory by copying `.env.example` and set the following environment variables:

```env
# Main settings
PORT=8080
SITE_API_HOST=https://jt-lab.com
STANDALONE_APP=1

# Trading engine mode: both, realtime, tester
ENGINE_MODE="both"

# File and directory paths
DATABASE_URL="file:/path/to/your/project/storage.db"
ROLLUP_TS_CONFIG=tsconfig.bundler.json
STRATEGY_FILES_PATH=/path/to/your/project/strategy-source/src
MARKETS_FILE_PATH=markets.json
ARTIFACTS_DIR_PATH=/path/to/your/project/artifacts
HISTORY_BARS_PATH=downloaded-history-bars
LOGS_DIR_PATH=artifacts

# Redis (optional - system can work with file cache)
# REDIS_URL=redis://localhost:6379
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port for running the application | `8080` |
| `SITE_API_HOST` | Base URL for site API | `https://jt-lab.com` |
| `STANDALONE_APP` | Local mode operation (1 = enabled) | `1` |
| `ENGINE_MODE` | Trading engine mode | `"both"`, `"realtime"`, `"tester"` |
| `DATABASE_URL` | **Absolute path** to SQLite database file | `"file:/path/to/your/project/storage.db"` |
| `STRATEGY_FILES_PATH` | **Absolute path** to strategy source code | `/path/to/your/project/strategy-source/src` |
| `ROLLUP_TS_CONFIG` | Path to TypeScript configuration | `tsconfig.bundler.json` |
| `MARKETS_FILE_PATH` | Path to markets configuration file | `markets.json` |
| `ARTIFACTS_DIR_PATH` | Path to strategy reports directory | `/path/to/your/project/artifacts` |
| `HISTORY_BARS_PATH` | Path to historical data directory | `downloaded-history-bars` |
| `LOGS_DIR_PATH` | Path to logs directory | `artifacts` |
| `REDIS_URL` | Redis connection URL (optional) | `redis://localhost:6379` |


```

## 🚀 Running

Build the project:
```bash
yarn build:prod
```

Run in production mode:
```bash
yarn start:prod
```

## 📚 Documentation

Detailed documentation is available at [docs.jt-lab.com](https://docs.jt-lab.com/jt-trader/getting-started/).

## 📄 License

JT Trader is dual-licensed:

- 🟢 **Free** for personal, educational, and open-source use (AGPLv3)
- 🔒 **Commercial use** requires a paid license

## 🤝 Support

- [Official Website](https://jt-lab.com)
- [Documentation](https://docs.jt-lab.com/jt-trader/getting-started/)
- [GitHub Issues](https://github.com/jt-lab-com/jt-trader/issues)

## 🔗 Related Projects

- [jt-lib](https://github.com/jt-lab-com/jt-lib) - Library for creating trading strategies
- [Documentation](https://docs.jt-lab.com) - Complete project documentation

---

**JT Lab** - Professional tools for algorithmic trading

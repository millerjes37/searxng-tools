# SearXNG Tools

<p align="center">
  <img src="logo.png" alt="Clawdbot Logo" width="400">
</p>

> Universal SearXNG search tools for AI agents and OpenClaw

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw Plugin](https://img.shields.io/badge/OpenClaw-Plugin-blue)](https://openclaw.ai)
[![SearXNG](https://img.shields.io/badge/SearXNG-Search-green)](https://github.com/searxng/searxng)

## Overview

SearXNG Tools is a comprehensive search plugin that provides AI agents with free, private web search capabilities. It integrates seamlessly with [OpenClaw](https://openclaw.ai) and connects to your local [SearXNG](https://github.com/searxng/searxng) instance to deliver search results from 89+ search engines without API keys or usage limits.

### Features

- **7 Search Tools**: General web, images, news, videos, technical content, suggestions, and URL fetching
- **Privacy-First**: All searches stay local - no data sent to third-party APIs
- **No API Keys**: Free to use with your own SearXNG instance
- **Universal**: Works with any AI agent platform that supports OpenClaw plugins
- **Caching**: Built-in result caching for improved performance
- **Content Extraction**: Automatic readability processing for clean article extraction

## Quick Start (5 minutes)

This plugin requires **two components** to work:

1. **SearXNG Server** - The search engine (runs via Docker)
2. **OpenClaw Plugin** - The interface to OpenClaw

### 1. Start SearXNG Server (Required)

The SearXNG server must be running before the plugin can work. This is a **separate** service from the plugin.

```bash
# Clone the repository
git clone https://github.com/millerjes37/searxng-tools.git
cd searxng-tools

# Start SearXNG server (Docker container)
./install.sh
```

Or manually with Docker Compose:

```bash
docker-compose up -d
```

**Verify it's running:**
```bash
curl http://localhost:8888/healthz
# Should return: OK
```

### 2. Install the OpenClaw Plugin

This is a **separate** step from starting the SearXNG server:

```bash
# Copy plugin to OpenClaw extensions
mkdir -p ~/.openclaw/extensions/searxng-tools
cp -r * ~/.openclaw/extensions/searxng-tools/
cd ~/.openclaw/extensions/searxng-tools && npm install
```

### 3. Configure OpenClaw

Add to your `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "load": {
      "paths": ["~/.openclaw/extensions/searxng-tools"]
    },
    "entries": {
      "searxng-tools": {
        "enabled": true,
        "config": {
          "searxngUrl": "http://localhost:8888",
          "defaultMaxResults": 10
        }
      }
    }
  }
}
```

### 4. Restart OpenClaw

```bash
openclaw gateway restart
```

**Done!** Try searching: `web_search({ query: "hello world", count: 5 })`

---

## Bonus: Use SearXNG for Personal Browsing Too! 🌐

Since you have SearXNG running, why not use it as your default search engine in your web browser? Get the same privacy benefits for your personal searches!

### Quick Browser Setup

**Chrome/Chromium/Edge:**
1. Go to `chrome://settings/searchEngines`
2. Click "Add" next to "Site search"
3. Enter:
   - **Search engine:** `SearXNG Local`
   - **Shortcut:** `sx`
   - **URL:** `http://localhost:8888/search?q=%s`
4. Click "Add"
5. Click three dots → "Make default" (optional)

**Firefox:**
1. Visit `http://localhost:8888`
2. Click the magnifying glass icon in search bar
3. Click "Add SearXNG"
4. Check "Make this the current search engine"

**Then use it:**
- Type `sx` + Tab in address bar, then search
- Or just search directly if set as default

📖 **[Complete browser setup guide →](BROWSER.md)**

---

## Ensuring SearXNG Stays Running

To make sure SearXNG is always available when OpenClaw needs it, use one of these methods:

### Option 1: Systemd Service (Recommended)

Set up SearXNG as a systemd service that starts automatically:

```bash
# Install the systemd service
sudo cp searxng.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable searxng.service
sudo systemctl start searxng.service

# Optionally make OpenClaw depend on SearXNG
# See SYSTEMD.md for detailed instructions
```

### Option 2: Docker Auto-Restart

The Docker Compose configuration already includes auto-restart:

```bash
# SearXNG will restart automatically unless manually stopped
docker-compose up -d
```

### Option 3: Health Check Script

Use the included health check script:

```bash
# Check if SearXNG is running
./check-searxng.sh check

# Start SearXNG if not running
./check-searxng.sh ensure

# Add to crontab to check every 5 minutes
crontab -e
# Add: */5 * * * * /path/to/searxng-tools/check-searxng.sh ensure
```

**📖 For detailed instructions, see [SYSTEMD.md](SYSTEMD.md)**

---

## Detailed Installation

### Prerequisites

1. **SearXNG Server** - See [DOCKER.md](DOCKER.md) for detailed Docker setup instructions
2. **OpenClaw** installed and configured

The easiest way to set up SearXNG is using the included Docker Compose configuration:

```bash
docker-compose up -d
```

### Quick Install (Plugin Only)

⚠️ **Important:** This installs only the OpenClaw plugin. You must set up the SearXNG server separately (see Step 1 in Quick Start above).

```bash
# Clone the repository
git clone https://github.com/millerjes37/searxng-tools.git

# Install the OpenClaw plugin
cd searxng-tools
openclaw plugins install .
```

**Note:** `openclaw plugins install` only installs the plugin files. It does NOT set up the SearXNG Docker container or systemd service. You must complete Step 1 (SearXNG server setup) separately.

### Manual Installation

1. Copy the plugin files to your OpenClaw extensions directory:
   ```bash
   mkdir -p ~/.openclaw/extensions/searxng-tools
   cp -r * ~/.openclaw/extensions/searxng-tools/
   ```

2. Navigate to the plugin directory and install dependencies:
   ```bash
   cd ~/.openclaw/extensions/searxng-tools
   npm install
   ```

## OpenClaw Configuration

Add the following to your `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "load": {
      "paths": [
        "/home/YOUR_USERNAME/.openclaw/extensions/searxng-tools"
      ]
    },
    "entries": {
      "searxng-tools": {
        "enabled": true,
        "config": {
          "searxngUrl": "http://localhost:8888",
          "defaultMaxResults": 10,
          "timeoutSeconds": 30,
          "cacheResults": true,
          "cacheTtlMinutes": 15
        }
      }
    }
  },
  "tools": {
    "web": {
      "search": {
        "enabled": false
      },
      "fetch": {
        "enabled": false
      }
    }
  }
}
```

**Note**: Disabling the built-in `tools.web.search` and `tools.web.fetch` prevents conflicts with this plugin.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `searxngUrl` | string | `http://localhost:8888` | SearXNG instance URL |
| `defaultMaxResults` | number | 10 | Default number of results per search (1-50) |
| `timeoutSeconds` | number | 30 | Request timeout in seconds |
| `cacheResults` | boolean | true | Enable result caching |
| `cacheTtlMinutes` | number | 15 | Cache time-to-live in minutes |

### Restart Required

After updating the configuration, restart the OpenClaw gateway:

```bash
openclaw gateway restart
```

## Available Tools

### 1. web_search
Search the web using SearXNG.

**Parameters:**
- `query` (string, required): Search query
- `count` (number): Results to return (1-50, default: 10)
- `country` (string): 2-letter ISO country code (e.g., "US", "DE")
- `language` (string): ISO 639-1 language code (e.g., "en", "de")
- `freshness` (string): Time filter - "day", "week", "month", or "year"
- `safe_search` (string): Safe search level - "none", "moderate", or "strict"
- `page` (number): Page number for pagination

**Example:**
```javascript
web_search({
  query: "OpenClaw AI platform",
  count: 5,
  language: "en",
  freshness: "week"
});
```

### 2. image_search
Search for images.

**Parameters:**
- `query` (string, required): Image search query
- `count` (number): Results to return (1-50, default: 10)
- `safe_search` (string): Safe search level - "none", "moderate", or "strict"

### 3. news_search
Search for news articles.

**Parameters:**
- `query` (string, required): News search query
- `count` (number): Results to return (1-50, default: 10)
- `freshness` (string): Time filter - "day", "week", "month", or "year"
- `language` (string): ISO 639-1 language code

### 4. video_search
Search for videos.

**Parameters:**
- `query` (string, required): Video search query
- `count` (number): Results to return (1-50, default: 10)
- `safe_search` (string): Safe search level - "none", "moderate", or "strict"

### 5. technical_search
Search for code, documentation, and technical content.

**Parameters:**
- `query` (string, required): Technical search query
- `count` (number): Results to return (1-50, default: 10)
- `language` (string): ISO 639-1 language code
- `freshness` (string): Time filter - "day", "week", "month", or "year"

### 6. search_suggestions
Get search query suggestions and autocomplete.

**Parameters:**
- `query` (string, required): Partial query to get suggestions for

### 7. fetch_url
Fetch and extract content from a URL with readability.

**Parameters:**
- `url` (string, required): URL to fetch (http/https only)
- `extract_content` (boolean): Extract main content using Readability (default: true)
- `max_length` (number): Maximum characters to return (default: 50000)

## Verification

Check that the plugin is loaded:

```bash
openclaw plugins list
```

You should see:
```
SearXNG Tools │ searxng-tools │ loaded │ ~/.openclaw/extensions/searxng-tools │ 1.0.0
```

## Troubleshooting

### "Connection Refused" or "Cannot connect to SearXNG"

**Problem:** Plugin is installed but searches fail with connection errors.

**Cause:** You haven't started the SearXNG server yet. The plugin and server are two separate components.

**Solution:**
```bash
# Start the SearXNG server (Step 1 in Quick Start)
cd ~/dev/searxng-tools  # or wherever you cloned the repo
docker-compose up -d

# Verify it's running
curl http://localhost:8888/healthz
```

**Remember:** `openclaw plugins install` only installs the plugin files, it does NOT start the SearXNG Docker container. You must start SearXNG separately.

### Plugin Not Loading

1. Verify SearXNG is running:
   ```bash
   curl http://localhost:8888/healthz
   # Should return: OK
   ```

2. Check the plugin configuration:
   ```bash
   openclaw config validate
   ```

3. Review gateway logs:
   ```bash
   openclaw logs | grep -i "searxng\|error"
   ```

### Schema Errors

If you see "schema must be object or boolean" errors:
- Ensure the plugin files are correctly copied
- Check that `npm install` was run in the plugin directory
- Restart the OpenClaw gateway

### Search Returns No Results

1. Test SearXNG directly:
   ```bash
   curl "http://localhost:8888/search?q=test&format=json"
   ```

2. Check SearXNG configuration in your SearXNG container

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Agent / OpenClaw                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ Plugin API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 SearXNG Tools Plugin                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │ 7 Search Tools  │  │     Result Formatters           │   │
│  │ (web, image,    │  │  ┌─────────┐  ┌──────────────┐  │   │
│  │  news, video,   │  │  │ Markdown│  │  Readability │  │   │
│  │  tech, suggest, │  │  │ Formatter│  │   Extractor  │  │   │
│  │  fetch_url)     │  │  └─────────┘  └──────────────┘  │   │
│  └────────┬────────┘  └─────────────────────────────────┘   │
└───────────┼──────────────────────────────────────────────────┘
            │ HTTP/JSON
            ▼
┌─────────────────────────────────────────────────────────────┐
│                SearXNG Docker Container                      │
│                   (localhost:8888)                           │
│         Aggregates 89+ search engines                       │
└─────────────────────────────────────────────────────────────┘
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [SearXNG](https://github.com/searxng/searxng) - The privacy-respecting metasearch engine
- [OpenClaw](https://openclaw.ai) - The AI agent platform
- Logo generated with AI assistance

## Support

- GitHub Issues: [https://github.com/millerjes37/searxng-tools/issues](https://github.com/millerjes37/searxng-tools/issues)
- OpenClaw Documentation: [https://docs.openclaw.ai](https://docs.openclaw.ai)
- SearXNG Documentation: [https://docs.searxng.org](https://docs.searxng.org)

---

<p align="center">
  Made with ❤️ for the AI agent community
</p>

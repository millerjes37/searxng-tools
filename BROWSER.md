# Browser Integration Guide

Since you're running SearXNG as a systemd service, you can also use it as your default search engine in web browsers for your personal searches! This gives you privacy-respecting search for both AI agents and personal browsing.

## Quick Setup

### Chrome / Chromium / Edge

1. **Open SearXNG in your browser:**
   Navigate to `http://localhost:8888`

2. **Add SearXNG as a search engine:**
   - Click the **three dots** (⋮) → **Settings**
   - Go to **Search engine** → **Manage search engines**
   - Click **Add** next to "Site search"
   - Fill in:
     - **Search engine:** `SearXNG Local`
     - **Shortcut:** `sx` (or whatever you prefer)
     - **URL:** `http://localhost:8888/search?q=%s`
   - Click **Add**

3. **Set as default (optional):**
   - Find "SearXNG Local" in the list
   - Click the **three dots** next to it
   - Select **Make default**

### Firefox

1. **Open SearXNG:**
   Navigate to `http://localhost:8888`

2. **Add search engine:**
   - Click the **magnifying glass** icon in the search bar
   - Click **Add "SearXNG"**
   - Check "Make this the current search engine" (optional)
   - Click **Add"

3. **Alternative method:**
   - Go to `about:preferences#search`
   - Scroll to "One-Click Search Engines"
   - Click **Find more search engines**
   - Search for "SearXNG" or add manually:
     - Name: `SearXNG Local`
     - Keyword: `sx`
     - URL: `http://localhost:8888/search?q=%s`

### Safari (macOS)

Safari doesn't support custom search engines natively, but you can:

1. **Use a Safari Extension:**
   - Install "AnySearch" or "SearchKey" from App Store
   - Configure with URL: `http://localhost:8888/search?q=%s`

2. **Or use a bookmarklet:**
   Create a bookmark with this JavaScript:
   ```javascript
   javascript:location.href='http://localhost:8888/search?q='+encodeURIComponent(window.getSelection()||prompt('Search:'));
   ```

## Advanced Configuration

### Using a Custom Domain (Recommended for Daily Use)

If you want to access SearXNG from multiple devices or share it with family:

1. **Set up a local domain:**
   Edit `/etc/hosts`:
   ```
   127.0.0.1  search.local
   ```

2. **Update SearXNG base URL:**
   ```bash
   # Edit docker-compose.yml
   environment:
     - SEARXNG_BASE_URL=http://search.local:8888/
   ```

3. **Restart SearXNG:**
   ```bash
   sudo systemctl restart searxng.service
   ```

4. **Use in browser:**
   - Add search engine with URL: `http://search.local:8888/search?q=%s`

### Browser Extensions for Enhanced Privacy

#### Chrome/Chromium
- **Privacy Badger** - Blocks trackers
- **uBlock Origin** - Ad and tracker blocker
- **HTTPS Everywhere** - Forces HTTPS connections

#### Firefox
- **Firefox Multi-Account Containers** - Isolate searches
- **Privacy Badger**
- **uBlock Origin**

### Keyboard Shortcuts

After setting up the keyword (e.g., `sx`):

**Chrome/Chromium/Edge:**
- Type `sx` followed by **Tab** in the address bar
- Type your search query
- Press **Enter**

**Firefox:**
- Type `sx` followed by **Space** in the address bar
- Type your search query
- Press **Enter**

Example:
```
sx<Tab>best privacy tools 2026
```

## Mobile Browsers

### Firefox Mobile (Android/iOS)

1. Go to `http://localhost:8888` (requires VPN if not on local network)
2. Tap menu → **Add Search Engine**
3. Enter name and keyword
4. Use keyword in address bar

### Chrome Mobile (Android)

Unfortunately, Chrome mobile doesn't support custom search engines. Alternatives:

1. **Use Firefox Mobile** instead
2. **Create a homescreen shortcut:**
   - Visit `http://localhost:8888`
   - Tap menu → **Add to Home screen**
   - Use the web app for searches

## Privacy Tips

### Enable Do Not Track

SearXNG respects Do Not Track headers:

1. **Chrome:** Settings → Privacy and security → Third-party cookies → Send a "Do not track" request
2. **Firefox:** Settings → Privacy & Security → Send websites a "Do Not Track" signal
3. **Edge:** Settings → Privacy, search, and services → Tracking prevention → Strict

### Disable Search Suggestions

To prevent your browser from sending keystrokes to search engines:

**Chrome:**
- Settings → Privacy and security → Sync and Google services → **OFF**: "Autocomplete searches and URLs"

**Firefox:**
- Settings → Privacy & Security → **OFF**: "Show search suggestions in address bar results"

### Use Private/Incognito Mode

For sensitive searches, use private browsing mode which doesn't save history:
- **Chrome/Edge:** Ctrl+Shift+N
- **Firefox:** Ctrl+Shift+P
- **Safari:** Cmd+Shift+N

## Troubleshooting

### "This site can't be reached" Error

1. **Verify SearXNG is running:**
   ```bash
   sudo systemctl status searxng.service
   curl http://localhost:8888/healthz
   ```

2. **Check firewall:**
   ```bash
   # Allow local connections (usually not needed)
   sudo ufw allow 8888/tcp
   ```

3. **Browser cache:**
   - Clear browser cache and try again

### Search Results Not Loading

1. **Check SearXNG logs:**
   ```bash
   sudo journalctl -u searxng.service -f
   ```

2. **Test directly:**
   ```bash
   curl "http://localhost:8888/search?q=test&format=json"
   ```

3. **Restart SearXNG:**
   ```bash
   sudo systemctl restart searxng.service
   ```

### Search Engine Not Appearing

Some browsers require visiting the site first before allowing it as a search engine:

1. Visit `http://localhost:8888`
2. Perform a search
3. Check settings again

## Verification

### Test Your Setup

1. **Open a new tab**
2. **Type your keyword** (e.g., `sx`) and press Tab/Space
3. **Search for** "test"
4. **Verify:**
   - Results come from `localhost:8888`
   - No external search engines are used
   - Results include multiple engine sources (shown at top)

### Confirm Privacy

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Perform a search**
4. **Verify:**
   - No requests to google.com, bing.com, etc.
   - Only requests to localhost:8888
   - No tracking cookies from search engines

## Benefits of Using SearXNG for Personal Searches

✅ **Privacy** - No search history stored by Google/Bing/etc.
✅ **No Filter Bubble** - Results aren't personalized/manipulated
✅ **Multiple Sources** - Aggregates 89+ search engines
✅ **Open Source** - Transparent, auditable code
✅ **Self-Hosted** - You control your data
✅ **AI + Human** - Same search engine for both you and your AI agents

## Next Steps

Now that SearXNG is your default search engine:

1. **Remove other search engines** from browser settings
2. **Set up on all your devices** using the same localhost:8888
3. **Configure SearXNG preferences** at `http://localhost:8888/preferences`
4. **Add to all your browsers** (desktop + mobile)

Enjoy private, decentralized searching! 🔍🔒

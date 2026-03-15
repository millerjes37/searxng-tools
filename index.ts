/**
 * SearXNG Search Plugin for OpenClaw
 * 
 * A drop-in replacement for OpenClaw's built-in web search tools using SearXNG.
 * Provides free, private search across 89+ search engines.
 */

// Type definitions for OpenClaw plugin API
interface PluginApi {
  registerTool: (tool: ToolDefinition) => void;
  registerHook: (hookType: string, handler: Function, options?: any) => void;
  on: (event: string, handler: Function, options?: any) => void;
  logger: Logger;
  config: any;
}

interface Logger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: object;
  execute: (id: string, params: any) => Promise<any>;
}

// Cache implementation
class SimpleCache {
  private cache = new Map<string, { value: any; expires: number }>();
  
  get(key: string): any | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }
  
  set(key: string, value: any, ttlMs: number): void {
    this.cache.set(key, { value, expires: Date.now() + ttlMs });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// SearXNG API Client
class SearXNGClient {
  private baseUrl: string;
  private timeoutMs: number;
  private cache: SimpleCache;
  private cacheEnabled: boolean;
  private cacheTtlMs: number;
  private logger: Logger;
  
  constructor(config: any, logger: Logger) {
    this.baseUrl = config.searxngUrl || 'http://localhost:8888';
    this.timeoutMs = (config.timeoutSeconds || 30) * 1000;
    this.cacheEnabled = config.cacheResults !== false;
    this.cacheTtlMs = (config.cacheTtlMinutes || 15) * 60 * 1000;
    this.cache = new SimpleCache();
    this.logger = logger;
  }
  
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  private getCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`;
  }
  
  private async makeRequest(endpoint: string, params: Record<string, any>): Promise<any> {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug('Cache hit for', endpoint, params.q);
        return cached;
      }
    }
    
    // Build URL
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
    
    this.logger.debug('SearXNG request:', url.toString());
    
    try {
      const response = await this.fetchWithTimeout(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'openclaw-searxng-plugin/1.0'
        }
      });
      
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`SearXNG returned ${response.status}: ${body}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      if (this.cacheEnabled) {
        this.cache.set(cacheKey, data, this.cacheTtlMs);
      }
      
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeoutMs}ms`);
      }
      throw error;
    }
  }
  
  async search(params: SearchParams): Promise<SearchResponse> {
    const searchParams: Record<string, any> = {
      q: params.query,
      format: 'json'
    };
    
    if (params.category) searchParams.category = params.category;
    if (params.language) searchParams.language = params.language;
    if (params.time_range) searchParams.time_range = params.time_range;
    if (params.safesearch !== undefined) searchParams.safesearch = params.safesearch;
    if (params.pageno) searchParams.pageno = params.pageno;
    if (params.engines?.length) searchParams.engines = params.engines.join(',');
    
    return this.makeRequest('/search', searchParams);
  }
  
  async autocomplete(query: string): Promise<string[]> {
    try {
      const data = await this.makeRequest('/autocompleter', { q: query });
      // SearXNG returns [query, [suggestions...]]
      if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
        return data[1];
      }
      return [];
    } catch (error) {
      this.logger.warn('Autocomplete failed:', error);
      return [];
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/healthz`, {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

interface SearchParams {
  query: string;
  category?: string;
  language?: string;
  time_range?: string;
  safesearch?: number;
  pageno?: number;
  engines?: string[];
  max_results?: number;
}

interface SearchResponse {
  query: string;
  number_of_results?: number;
  results: SearchResult[];
  suggestions?: string[];
  unresponsive_engines?: string[][];
}

interface SearchResult {
  url: string;
  title: string;
  content?: string;
  engine?: string;
  engines?: string[];
  score?: number;
  category?: string;
  publishedDate?: string;
  img_src?: string;
  thumbnail?: string;
}

// Import required for fetch_url
let Readability: any;
let JSDOM: any;
let TurndownService: any;

// Helper functions
function formatSearchResults(query: string, results: SearchResult[], total?: number, maxResults: number = 10): string {
  if (!results || results.length === 0) {
    return `## Search Results for: "${query}"\n\n*No results found.*`;
  }
  
  let output = `## Search Results for: "${query}"\n\n`;
  
  if (total !== undefined) {
    output += `Estimated total results: ${total}\n\n`;
  }
  
  output += `Showing ${Math.min(results.length, maxResults)} results:\n\n`;
  
  const limitedResults = results.slice(0, maxResults);
  
  for (let i = 0; i < limitedResults.length; i++) {
    const result = limitedResults[i];
    output += `### ${i + 1}. ${result.title}\n\n`;
    output += `**URL:** ${result.url}\n\n`;
    
    if (result.content) {
      output += `${result.content}\n\n`;
    }
    
    const metaParts: string[] = [];
    
    if (result.publishedDate) {
      metaParts.push(`📅 ${result.publishedDate}`);
    }
    
    if (result.engines && result.engines.length > 0) {
      metaParts.push(`🔍 Found by: ${result.engines.join(', ')}`);
    }
    
    if (result.score !== undefined) {
      metaParts.push(`⭐ Score: ${result.score.toFixed(1)}`);
    }
    
    if (result.category) {
      metaParts.push(`📂 Category: ${result.category}`);
    }
    
    if (metaParts.length > 0) {
      output += `*${metaParts.join(' | ')}*\n`;
    }
    
    output += '\n---\n\n';
  }
  
  return output;
}

function formatImageResults(query: string, results: SearchResult[], maxResults: number = 10): string {
  if (!results || results.length === 0) {
    return `## Image Search Results for: "${query}"\n\n*No images found.*`;
  }
  
  let output = `## Image Search Results for: "${query}"\n\n`;
  output += `Found ${Math.min(results.length, maxResults)} images:\n\n`;
  
  const limitedResults = results.slice(0, maxResults);
  
  for (let i = 0; i < limitedResults.length; i++) {
    const result = limitedResults[i];
    output += `### ${i + 1}. ${result.title}\n\n`;
    
    if (result.img_src || result.thumbnail) {
      output += `**Image URL:** ${result.img_src || result.thumbnail}\n\n`;
    }
    
    output += `**Source:** ${result.url}\n\n`;
    
    if (result.engines && result.engines.length > 0) {
      output += `*🔍 Found by: ${result.engines.join(', ')}*\n`;
    }
    
    output += '\n---\n\n';
  }
  
  return output;
}

function formatVideoResults(query: string, results: SearchResult[], maxResults: number = 10): string {
  if (!results || results.length === 0) {
    return `## Video Search Results for: "${query}"\n\n*No videos found.*`;
  }
  
  let output = `## Video Search Results for: "${query}"\n\n`;
  output += `Found ${Math.min(results.length, maxResults)} videos:\n\n`;
  
  const limitedResults = results.slice(0, maxResults);
  
  for (let i = 0; i < limitedResults.length; i++) {
    const result = limitedResults[i];
    output += `### ${i + 1}. ${result.title}\n\n`;
    output += `**URL:** ${result.url}\n\n`;
    
    if (result.thumbnail) {
      output += `**Thumbnail:** ${result.thumbnail}\n\n`;
    }
    
    if (result.content) {
      output += `${result.content}\n\n`;
    }
    
    if (result.engines && result.engines.length > 0) {
      output += `*🔍 Found by: ${result.engines.join(', ')}*\n`;
    }
    
    output += '\n---\n\n';
  }
  
  return output;
}

function formatNewsResults(query: string, results: SearchResult[], maxResults: number = 10): string {
  if (!results || results.length === 0) {
    return `## News Results for: "${query}"\n\n*No news articles found.*`;
  }
  
  let output = `## News Results for: "${query}"\n\n`;
  output += `Found ${Math.min(results.length, maxResults)} news articles:\n\n`;
  
  const limitedResults = results.slice(0, maxResults);
  
  for (let i = 0; i < limitedResults.length; i++) {
    const result = limitedResults[i];
    output += `### ${i + 1}. ${result.title}\n\n`;
    output += `**URL:** ${result.url}\n\n`;
    
    if (result.publishedDate) {
      output += `**Published:** 📅 ${result.publishedDate}\n\n`;
    }
    
    if (result.content) {
      output += `${result.content}\n\n`;
    }
    
    if (result.engines && result.engines.length > 0) {
      output += `*📰 Source: ${result.engines.join(', ')}*\n`;
    }
    
    output += '\n---\n\n';
  }
  
  return output;
}

function formatSuggestions(query: string, suggestions: string[]): string {
  if (!suggestions || suggestions.length === 0) {
    return `## Search Suggestions for: "${query}"\n\n*No suggestions available.*`;
  }
  
  let output = `## Search Suggestions for: "${query}"\n\n`;
  output += `Found ${suggestions.length} suggestions:\n\n`;
  
  for (let i = 0; i < suggestions.length; i++) {
    output += `${i + 1}. ${suggestions[i]}\n`;
  }
  
  return output;
}

async function fetchAndExtractContent(url: string, maxLength: number = 50000): Promise<string> {
  // Lazily load heavy dependencies
  if (!JSDOM) {
    const jsdomModule = await import('jsdom');
    JSDOM = jsdomModule.JSDOM;
  }
  
  if (!Readability) {
    const readabilityModule = await import('@mozilla/readability');
    Readability = readabilityModule.Readability;
  }
  
  if (!TurndownService) {
    const turndownModule = await import('turndown');
    TurndownService = turndownModule.default;
  }
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type') || '';
  
  // Handle plain text
  if (contentType.includes('text/plain')) {
    const text = await response.text();
    return text.length > maxLength ? text.substring(0, maxLength) + '\n\n[Content truncated...]' : text;
  }
  
  // Handle HTML
  if (contentType.includes('text/html') || !contentType) {
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;
    
    // Try Readability first
    const reader = new Readability(document);
    const article = reader.parse();
    
    if (article) {
      const turndown = new TurndownService({
        headingStyle: 'atx',
        bulletListMarker: '-'
      });
      
      // Remove unwanted elements before conversion
      turndown.remove(['script', 'style', 'nav', 'header', 'footer', 'aside']);
      
      let markdown = turndown.turndown(article.content);
      
      // Add title and metadata
      let result = `# ${article.title}\n\n`;
      if (article.byline) {
        result += `*By: ${article.byline}*\n\n`;
      }
      if (article.excerpt) {
        result += `> ${article.excerpt}\n\n`;
      }
      result += `**Source:** ${url}\n\n---\n\n`;
      result += markdown;
      
      if (result.length > maxLength) {
        result = result.substring(0, maxLength) + '\n\n[Content truncated...]';
      }
      
      return result;
    }
    
    // Fallback: convert body to markdown
    const turndown = new TurndownService();
    turndown.remove(['script', 'style']);
    const body = document.body;
    if (body) {
      let markdown = turndown.turndown(body.innerHTML);
      if (markdown.length > maxLength) {
        markdown = markdown.substring(0, maxLength) + '\n\n[Content truncated...]';
      }
      return markdown;
    }
    
    return html.substring(0, maxLength);
  }
  
  // Handle JSON
  if (contentType.includes('application/json')) {
    const json = await response.json();
    return '```json\n' + JSON.stringify(json, null, 2).substring(0, maxLength) + '\n```';
  }
  
  // Default: return as text
  const text = await response.text();
  return text.length > maxLength ? text.substring(0, maxLength) + '\n\n[Content truncated...]' : text;
}

// Main plugin export
export default function searxngSearchPlugin(api: PluginApi) {
  const pluginConfig = api.config?.plugins?.entries?.['searxng-search']?.config || {};
  const logger = api.logger;
  
  logger.info('SearXNG Search Plugin initializing...');
  logger.info('Configuration:', JSON.stringify({
    searxngUrl: pluginConfig.searxngUrl || 'http://localhost:8888',
    cacheResults: pluginConfig.cacheResults !== false,
    disableBuiltin: pluginConfig.disableBuiltinWebTools !== false
  }));
  
  // Initialize SearXNG client
  const searxng = new SearXNGClient(pluginConfig, logger);
  
  // 1. WEB_SEARCH TOOL
  api.registerTool({
    name: 'web_search',
    description: 'Search the web using SearXNG. Free, private search aggregating 89+ search engines.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (required)'
        },
        count: {
          type: 'number',
          description: 'Results to return (1-50, default: 10)',
          minimum: 1,
          maximum: 50
        },
        country: {
          type: 'string',
          description: '2-letter ISO country code (e.g., "US", "DE")'
        },
        language: {
          type: 'string',
          description: 'ISO 639-1 language code (e.g., "en", "de")'
        },
        freshness: {
          type: 'string',
          description: 'Time filter: day, week, month, or year',
          enum: ['day', 'week', 'month', 'year']
        },
        safe_search: {
          type: 'string',
          description: 'Safe search level: none, moderate, or strict',
          enum: ['none', 'moderate', 'strict'],
          default: 'moderate'
        },
        page: {
          type: 'number',
          description: 'Page number for pagination',
          minimum: 1
        }
      },
      required: ['query']
    },
    async execute(_id: string, params: any) {
      try {
        const maxResults = params.count || pluginConfig.defaultMaxResults || 10;
        
        const searchParams: SearchParams = {
          query: params.query,
          category: 'general',
          max_results: maxResults
        };
        
        // Map OpenClaw parameters to SearXNG
        if (params.language) searchParams.language = params.language;
        if (params.freshness) searchParams.time_range = params.freshness;
        if (params.page) searchParams.pageno = params.page;
        
        // Map safe_search
        if (params.safe_search) {
          switch (params.safe_search) {
            case 'none': searchParams.safesearch = 0; break;
            case 'moderate': searchParams.safesearch = 1; break;
            case 'strict': searchParams.safesearch = 2; break;
          }
        }
        
        logger.info('web_search:', params.query);
        const response = await searxng.search(searchParams);
        
        const resultText = formatSearchResults(
          params.query,
          response.results,
          response.number_of_results,
          maxResults
        );
        
        return { content: [{ type: 'text', text: resultText }] };
      } catch (error: any) {
        logger.error('web_search error:', error.message);
        throw new Error(`Search failed: ${error.message}. Please ensure SearXNG is running at ${pluginConfig.searxngUrl || 'http://localhost:8888'}`);
      }
    }
  });
  
  // 2. IMAGE_SEARCH TOOL
  api.registerTool({
    name: 'image_search',
    description: 'Search for images using SearXNG.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Image search query (required)'
        },
        count: {
          type: 'number',
          description: 'Results to return (1-50, default: 10)',
          minimum: 1,
          maximum: 50
        },
        safe_search: {
          type: 'string',
          description: 'Safe search level: none, moderate, or strict',
          enum: ['none', 'moderate', 'strict'],
          default: 'moderate'
        }
      },
      required: ['query']
    },
    async execute(_id: string, params: any) {
      try {
        const maxResults = params.count || pluginConfig.defaultMaxResults || 10;
        
        const searchParams: SearchParams = {
          query: params.query,
          category: 'images',
          max_results: maxResults
        };
        
        if (params.safe_search) {
          switch (params.safe_search) {
            case 'none': searchParams.safesearch = 0; break;
            case 'moderate': searchParams.safesearch = 1; break;
            case 'strict': searchParams.safesearch = 2; break;
          }
        }
        
        logger.info('image_search:', params.query);
        const response = await searxng.search(searchParams);
        
        const resultText = formatImageResults(params.query, response.results, maxResults);
        return { content: [{ type: "text", text: resultText }] };
      } catch (error: any) {
        logger.error('image_search error:', error.message);
        throw new Error(`Image search failed: ${error.message}`);
      }
    }
  });
  
  // 3. NEWS_SEARCH TOOL
  api.registerTool({
    name: 'news_search',
    description: 'Search for news articles using SearXNG.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'News search query (required)'
        },
        count: {
          type: 'number',
          description: 'Results to return (1-50, default: 10)',
          minimum: 1,
          maximum: 50
        },
        freshness: {
          type: 'string',
          description: 'Time filter: day, week, month, or year',
          enum: ['day', 'week', 'month', 'year']
        },
        language: {
          type: 'string',
          description: 'ISO 639-1 language code (e.g., "en", "de")'
        }
      },
      required: ['query']
    },
    async execute(_id: string, params: any) {
      try {
        const maxResults = params.count || pluginConfig.defaultMaxResults || 10;
        
        const searchParams: SearchParams = {
          query: params.query,
          category: 'news',
          max_results: maxResults
        };
        
        if (params.language) searchParams.language = params.language;
        if (params.freshness) searchParams.time_range = params.freshness;
        
        logger.info('news_search:', params.query);
        const response = await searxng.search(searchParams);
        
        const resultText = formatNewsResults(params.query, response.results, maxResults);
        return { content: [{ type: "text", text: resultText }] };
      } catch (error: any) {
        logger.error('news_search error:', error.message);
        throw new Error(`News search failed: ${error.message}`);
      }
    }
  });
  
  // 4. VIDEO_SEARCH TOOL
  api.registerTool({
    name: 'video_search',
    description: 'Search for videos using SearXNG.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Video search query (required)'
        },
        count: {
          type: 'number',
          description: 'Results to return (1-50, default: 10)',
          minimum: 1,
          maximum: 50
        },
        safe_search: {
          type: 'string',
          description: 'Safe search level: none, moderate, or strict',
          enum: ['none', 'moderate', 'strict'],
          default: 'moderate'
        }
      },
      required: ['query']
    },
    async execute(_id: string, params: any) {
      try {
        const maxResults = params.count || pluginConfig.defaultMaxResults || 10;
        
        const searchParams: SearchParams = {
          query: params.query,
          category: 'videos',
          max_results: maxResults
        };
        
        if (params.safe_search) {
          switch (params.safe_search) {
            case 'none': searchParams.safesearch = 0; break;
            case 'moderate': searchParams.safesearch = 1; break;
            case 'strict': searchParams.safesearch = 2; break;
          }
        }
        
        logger.info('video_search:', params.query);
        const response = await searxng.search(searchParams);
        
        const resultText = formatVideoResults(params.query, response.results, maxResults);
        return { content: [{ type: "text", text: resultText }] };
      } catch (error: any) {
        logger.error('video_search error:', error.message);
        throw new Error(`Video search failed: ${error.message}`);
      }
    }
  });
  
  // 5. TECHNICAL_SEARCH TOOL
  api.registerTool({
    name: 'technical_search',
    description: 'Search for code, documentation, and technical content using SearXNG.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Technical search query (required)'
        },
        count: {
          type: 'number',
          description: 'Results to return (1-50, default: 10)',
          minimum: 1,
          maximum: 50
        },
        language: {
          type: 'string',
          description: 'ISO 639-1 language code (e.g., "en", "de")'
        },
        freshness: {
          type: 'string',
          description: 'Time filter: day, week, month, or year',
          enum: ['day', 'week', 'month', 'year']
        }
      },
      required: ['query']
    },
    async execute(_id: string, params: any) {
      try {
        const maxResults = params.count || pluginConfig.defaultMaxResults || 10;
        
        const searchParams: SearchParams = {
          query: params.query,
          category: 'it',
          max_results: maxResults
        };
        
        if (params.language) searchParams.language = params.language;
        if (params.freshness) searchParams.time_range = params.freshness;
        
        logger.info('technical_search:', params.query);
        const response = await searxng.search(searchParams);
        
        const resultText = formatSearchResults(params.query, response.results, response.number_of_results, maxResults);
        return { content: [{ type: "text", text: resultText }] };
      } catch (error: any) {
        logger.error('technical_search error:', error.message);
        throw new Error(`Technical search failed: ${error.message}`);
      }
    }
  });
  
  // 6. SEARCH_SUGGESTIONS TOOL
  api.registerTool({
    name: 'search_suggestions',
    description: 'Get search query suggestions and autocomplete from SearXNG.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Partial query to get suggestions for (required)'
        }
      },
      required: ['query']
    },
    async execute(_id: string, params: any) {
      try {
        logger.info('search_suggestions:', params.query);
        const suggestions = await searxng.autocomplete(params.query);
        
        const resultText = formatSuggestions(params.query, suggestions);
        return { content: [{ type: "text", text: resultText }] };
      } catch (error: any) {
        logger.error('search_suggestions error:', error.message);
        throw new Error(`Failed to get suggestions: ${error.message}`);
      }
    }
  });
  
  // 7. FETCH_URL TOOL
  api.registerTool({
    name: 'fetch_url',
    description: 'Fetch and extract content from a URL using readability and markdown conversion.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to fetch (required, http/https only)'
        },
        extract_content: {
          type: 'boolean',
          description: 'Extract main content using Readability (default: true)',
          default: true
        },
        max_length: {
          type: 'number',
          description: 'Maximum characters to return (default: 50000)',
          default: 50000
        }
      },
      required: ['url']
    },
    async execute(_id: string, params: any) {
      try {
        const url = params.url;
        const maxLength = params.max_length || 50000;
        const extractContent = params.extract_content !== false;
        
        // Validate URL
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(url);
          if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            throw new Error('Only HTTP and HTTPS URLs are supported');
          }
        } catch {
          throw new Error(`Invalid URL: ${url}`);
        }
        
        logger.info('fetch_url:', url);
        
        if (!extractContent) {
          // Just fetch raw content
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          let content = await response.text();
          if (content.length > maxLength) {
            content = content.substring(0, maxLength) + '\n\n[Content truncated...]';
          }
          
          const resultText = content;
        return { content: [{ type: "text", text: resultText }] };
        }
        
        // Extract readable content
        const content = await fetchAndExtractContent(url, maxLength);
        const resultText = content;
        return { content: [{ type: "text", text: resultText }] };
        
      } catch (error: any) {
        logger.error('fetch_url error:', error.message);
        throw new Error(`Failed to fetch URL: ${error.message}`);
      }
    }
  });
  
  // Register hook to intercept built-in web tools if auto-shadow is enabled
  if (pluginConfig.disableBuiltinWebTools !== false) {
    api.on('before_tool_call', async (event: any) => {
      const toolName = event?.tool?.name;
      
      if (toolName === 'web_search' || toolName === 'web_fetch') {
        logger.debug(`Intercepted built-in ${toolName} call, redirecting to SearXNG plugin`);
        // The built-in tool call will proceed, but our tool with the same name
        // should take precedence. If not, we can add logic here to transform the call.
      }
    });
    
    logger.info('Auto-shadow enabled: plugin will attempt to override built-in web tools');
  }
  
  // Register startup hook to check SearXNG health
  api.on('gateway:start', async () => {
    logger.info('Checking SearXNG health...');
    const healthy = await searxng.healthCheck();
    if (healthy) {
      logger.info('✓ SearXNG is healthy and ready');
    } else {
      logger.warn('✗ SearXNG health check failed. Is it running at ' + (pluginConfig.searxngUrl || 'http://localhost:8888') + '?');
    }
  });
  
  logger.info('SearXNG Search Plugin registered 7 tools successfully');
  logger.info('Tools: web_search, image_search, news_search, video_search, technical_search, search_suggestions, fetch_url');
}

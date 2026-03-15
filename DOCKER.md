# Docker Setup Guide

This guide covers setting up SearXNG using Docker for use with the SearXNG Tools plugin.

## Quick Start

### Using Docker Compose (Recommended)

1. **Navigate to the repository:**
   ```bash
   cd searxng-tools
   ```

2. **Start SearXNG:**
   ```bash
   docker-compose up -d
   ```

3. **Verify it's running:**
   ```bash
   curl http://localhost:8888/healthz
   # Should return: OK
   ```

### Using Docker Run

If you prefer not to use Docker Compose:

```bash
docker run -d \
  --name searxng-server \
  -p 8888:8080 \
  -v $(pwd)/searxng-config:/etc/searxng \
  -e SEARXNG_BASE_URL=http://localhost:8888/ \
  --restart unless-stopped \
  searxng/searxng:latest
```

## Configuration

### Customizing SearXNG Settings

1. **Create config directory:**
   ```bash
   mkdir -p searxng-config
   ```

2. **Copy default settings (optional):**
   ```bash
   docker run --rm searxng/searxng:latest cat /usr/local/searxng/searx/settings.yml > searxng-config/settings.yml
   ```

3. **Edit settings.yml** to customize:
   - Search engines to use
   - UI preferences
   - Privacy settings
   - Result filtering

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SEARXNG_BASE_URL` | `http://localhost:8888/` | Base URL for the instance |
| `SEARXNG_INSTANCE_NAME` | `SearXNG` | Display name |
| `SEARXNG_DEBUG` | `false` | Enable debug mode |

## Management Commands

### View Logs
```bash
docker-compose logs -f searxng
```

### Stop SearXNG
```bash
docker-compose down
```

### Update SearXNG
```bash
docker-compose pull
docker-compose up -d
```

### Reset Configuration
```bash
docker-compose down -v
rm -rf searxng-config
```

## Integration with OpenClaw

Once SearXNG is running, configure OpenClaw to use it:

```json
{
  "plugins": {
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
  }
}
```

## Troubleshooting

### Container Won't Start

1. **Check port conflicts:**
   ```bash
   sudo lsof -i :8888
   ```

2. **View container logs:**
   ```bash
   docker logs searxng-server
   ```

### Permission Issues

If you encounter permission errors with the config volume:

```bash
sudo chown -R 1000:1000 searxng-config
```

### Health Check Failing

The container includes a health check that verifies SearXNG is responding. If it's failing:

1. Wait 40 seconds after starting (startup period)
2. Check logs: `docker-compose logs searxng`
3. Verify no other service is using port 8888

## Advanced Setup

### Using a Reverse Proxy

For production use, place SearXNG behind a reverse proxy like Nginx or Traefik:

```yaml
version: '3.8'

services:
  searxng:
    image: searxng/searxng:latest
    container_name: searxng-server
    environment:
      - SEARXNG_BASE_URL=https://search.yourdomain.com/
    volumes:
      - ./searxng-config:/etc/searxng
    networks:
      - searxng-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - searxng-network
    depends_on:
      - searxng
    restart: unless-stopped

networks:
  searxng-network:
    driver: bridge
```

### Multiple Instances

You can run multiple SearXNG instances for load balancing:

```yaml
version: '3.8'

services:
  searxng-1:
    image: searxng/searxng:latest
    ports:
      - "8888:8080"
    volumes:
      - ./searxng-config-1:/etc/searxng

  searxng-2:
    image: searxng/searxng:latest
    ports:
      - "8889:8080"
    volumes:
      - ./searxng-config-2:/etc/searxng
```

Then configure OpenClaw with fallback:

```json
{
  "plugins": {
    "entries": {
      "searxng-tools": {
        "enabled": true,
        "config": {
          "searxngUrl": "http://localhost:8888",
          "fallbackUrl": "http://localhost:8889"
        }
      }
    }
  }
}
```

## Security Considerations

1. **Don't expose SearXNG directly to the internet** without authentication
2. **Use HTTPS** in production
3. **Regularly update** the Docker image: `docker-compose pull && docker-compose up -d`
4. **Monitor logs** for unusual activity
5. **Limit rate** if exposed publicly

## Resources

- [SearXNG Docker Documentation](https://docs.searxng.org/admin/installation-docker.html)
- [SearXNG Configuration](https://docs.searxng.org/admin/settings/settings.html)
- [OpenClaw Documentation](https://docs.openclaw.ai)

# Systemd Integration Guide

This guide explains how to ensure SearXNG automatically starts when your system boots and stays running alongside OpenClaw.

## Overview

There are three recommended approaches to ensure SearXNG is always available when OpenClaw needs it:

1. **Systemd Service** (Recommended) - Managed by systemd, starts on boot
2. **Docker Compose Integration** - Docker-managed, auto-restart enabled
3. **Plugin Auto-Start** - Plugin attempts to start SearXNG if not running

## Method 1: Systemd Service (Recommended)

### Installation

1. **Copy the systemd service file:**
   ```bash
   sudo cp searxng.service /etc/systemd/system/
   sudo systemctl daemon-reload
   ```

2. **Edit the service file** to match your installation path:
   ```bash
   sudo nano /etc/systemd/system/searxng.service
   ```
   
   Update the `WorkingDirectory` to point to your searxng-tools installation:
   ```ini
   WorkingDirectory=/home/YOUR_USERNAME/searxng-tools
   ```

3. **Enable and start the service:**
   ```bash
   sudo systemctl enable searxng.service
   sudo systemctl start searxng.service
   ```

4. **Verify it's running:**
   ```bash
   sudo systemctl status searxng.service
   curl http://localhost:8888/healthz
   ```

### Making OpenClaw Depend on SearXNG

If you want to ensure SearXNG starts before OpenClaw:

1. **Edit the OpenClaw systemd service:**
   ```bash
   sudo systemctl edit --full openclaw-gateway.service
   ```

2. **Add SearXNG as a dependency:**
   ```ini
   [Unit]
   Description=OpenClaw Gateway
   After=network.target searxng.service
   Requires=searxng.service
   
   [Service]
   # ... existing configuration ...
   
   [Install]
   WantedBy=multi-user.target
   ```

3. **Reload and restart:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart openclaw-gateway.service
   ```

### Checking Service Status

```bash
# Check SearXNG status
sudo systemctl status searxng.service

# View logs
sudo journalctl -u searxng.service -f

# Restart SearXNG
sudo systemctl restart searxng.service

# Stop SearXNG
sudo systemctl stop searxng.service
```

## Method 2: Docker Compose with Auto-Restart

The included `docker-compose.yml` already has restart policies configured:

```yaml
restart: unless-stopped
```

### To start on system boot:

1. **Enable Docker service:**
   ```bash
   sudo systemctl enable docker
   ```

2. **Create a systemd service for the compose project:**
   ```bash
   sudo nano /etc/systemd/system/searxng-compose.service
   ```

   Add:
   ```ini
   [Unit]
   Description=SearXNG Docker Compose
   Requires=docker.service
   After=docker.service
   
   [Service]
   Type=oneshot
   RemainAfterExit=yes
   WorkingDirectory=/home/YOUR_USERNAME/searxng-tools
   ExecStart=/usr/local/bin/docker-compose up -d
   ExecStop=/usr/local/bin/docker-compose down
   
   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable the service:**
   ```bash
   sudo systemctl enable searxng-compose.service
   sudo systemctl start searxng-compose.service
   ```

## Method 3: Plugin Health Check

The plugin includes a health check script that can auto-start SearXNG.

### Using the Health Check Script

```bash
# Check if SearXNG is running
./check-searxng.sh check

# Start SearXNG if not running
./check-searxng.sh start

# Ensure SearXNG is running (idempotent)
./check-searxng.sh ensure
```

### Adding to System Startup

Add to your `.bashrc` or `.zshrc` (for user sessions):

```bash
# Auto-start SearXNG on shell initialization
~/searxng-tools/check-searxng.sh ensure > /dev/null 2>&1 || true
```

Or create a desktop entry for GUI sessions:

```bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/searxng.desktop <> EOF
[Desktop Entry]
Type=Application
Name=SearXNG Server
Exec=/home/YOUR_USERNAME/searxng-tools/check-searxng.sh ensure
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
```

## Method 4: Cron Job (Alternative)

Ensure SearXNG is running every minute:

```bash
# Edit crontab
crontab -e

# Add this line:
* * * * * /home/YOUR_USERNAME/searxng-tools/check-searxng.sh ensure > /dev/null 2>&1
```

## Verification

### Test the Integration

1. **Reboot your system:**
   ```bash
   sudo reboot
   ```

2. **After reboot, verify both services:**
   ```bash
   # Check SearXNG
   curl http://localhost:8888/healthz
   
   # Check OpenClaw
   openclaw gateway status
   
   # Test a search
   openclaw run web_search '{"query": "test", "count": 3}'
   ```

### Monitoring

Set up monitoring to alert if SearXNG goes down:

```bash
# Add to a monitoring script
if ! curl -s http://localhost:8888/healthz > /dev/null; then
    echo "SearXNG is down!" | mail -s "SearXNG Alert" your-email@example.com
fi
```

## Troubleshooting

### SearXNG Won't Start

1. **Check Docker:**
   ```bash
   sudo systemctl status docker
   sudo docker ps -a | grep searxng
   ```

2. **Check logs:**
   ```bash
   sudo journalctl -u searxng.service -n 50
   # or
   docker logs searxng-server
   ```

3. **Port conflicts:**
   ```bash
   sudo lsof -i :8888
   sudo netstat -tlnp | grep 8888
   ```

### OpenClaw Can't Connect

1. **Verify SearXNG is accessible:**
   ```bash
   curl http://localhost:8888/search?q=test&format=json
   ```

2. **Check OpenClaw logs:**
   ```bash
   openclaw logs | grep -i searxng
   ```

3. **Test plugin configuration:**
   ```bash
   openclaw plugins list | grep searxng
   ```

## Recommended Setup

For production use, we recommend **Method 1 (Systemd Service)** with OpenClaw dependency:

1. SearXNG starts automatically on boot
2. OpenClaw waits for SearXNG before starting
3. If SearXNG crashes, systemd restarts it
4. Both services are managed through systemd

This ensures maximum reliability and proper dependency management.

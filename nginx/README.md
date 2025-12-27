# Nginx Configuration

This directory contains the Nginx reverse proxy configuration for production deployment.

## Files

- `default.conf` - Main Nginx configuration file
- `ssl/` - Directory for SSL certificates (create this directory)

## Setup

1. **Update Domain**: Edit `default.conf` and replace `yourdomain.com` with your actual domain
2. **SSL Certificates**: Place your SSL certificates in the `ssl/` directory:
   - `cert.pem` - SSL certificate
   - `key.pem` - Private key
3. **Enable HTTPS**: Uncomment the HTTPS server block in `default.conf` after SSL setup

## Configuration Details

### Routing

- `/api/*` → Proxied to `gateway:3000`
- `/` → Proxied to `frontend:80` (React app)
- Static assets cached for 1 year

### Security

- Rate limiting on API endpoints
- Security headers (X-Frame-Options, CSP, etc.)
- Gzip compression enabled
- File upload limit: 100MB

### SSL Setup

After obtaining SSL certificates (e.g., via Let's Encrypt):

1. Copy certificates to `ssl/` directory
2. Uncomment HTTPS server block in `default.conf`
3. Uncomment HTTP to HTTPS redirect
4. Restart nginx container

## Testing

```bash
# Test nginx configuration
docker exec nginx nginx -t

# View nginx logs
docker logs nginx

# Test from inside container
docker exec nginx curl http://frontend:80
docker exec nginx curl http://gateway:3000/health
```


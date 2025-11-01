# MARKOUB Backend (Laravel) Deployment Guide

This guide covers deploying the Laravel API in production using Ubuntu + Nginx + PHP-FPM + MySQL. It also includes notes for cPanel and PaaS providers.

## Requirements
- Ubuntu 22.04+ (or any Linux with systemd)
- Nginx (or Apache)
- PHP 8.2+ with extensions: bcmath, ctype, curl, dom, fileinfo, gd, intl, mbstring, openssl, pdo_mysql, tokenizer, xml, zip
- Composer
- MySQL 8+ (or MariaDB)

## 1) Prepare server
```bash
# As root or with sudo
apt update && apt upgrade -y
apt install -y nginx git unzip curl software-properties-common
add-apt-repository ppa:ondrej/php -y && apt update
apt install -y php8.2 php8.2-fpm php8.2-bcmath php8.2-ctype php8.2-curl php8.2-gd php8.2-intl php8.2-mbstring php8.2-mysql php8.2-xml php8.2-zip
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
```

## 2) Upload code
```bash
mkdir -p /var/www/markoub-backend
cd /var/www/markoub-backend
# Option A: clone your repo
# git clone <YOUR_REPO_URL> .
# Option B: SFTP/rsync upload the backend/ folder contents here

composer install --no-dev --optimize-autoloader
```

## 3) Environment variables
Create the .env file from the provided template:
```bash
cp .env.example .env
# OR use the provided .env.production.example in this project
```
Then edit .env for production:
- APP_ENV=production
- APP_DEBUG=false
- APP_URL=https://api.yourdomain.com
- DB_CONNECTION=mysql
- DB_HOST=127.0.0.1
- DB_PORT=3306
- DB_DATABASE=markoub_db
- DB_USERNAME=markoub_user
- DB_PASSWORD=strong_password
- FRONTEND_URL=https://your-frontend-domain.com
- CORS (config/cors.php) already whitelists env('FRONTEND_URL'); add other domains if needed.
- JWT_SECRET=generate a strong secret or run `php artisan jwt:secret` (see below)

Generate keys/secrets:
```bash
php artisan key:generate --force
# If you prefer to generate JWT secret via artisan (optional if you set JWT_SECRET manually)
php artisan jwt:secret --force
```

## 4) Storage, cache, DB
```bash
php artisan storage:link
php artisan migrate --force
php artisan db:seed --force   # optional
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Set permissions:
```bash
chown -R www-data:www-data /var/www/markoub-backend
chmod -R ug+rwX storage bootstrap/cache
```

## 5) Nginx config
Create `/etc/nginx/sites-available/markoub-backend`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/markoub-backend/public;
    index index.php;

    # Serve static files/directories
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```
Enable and reload:
```bash
ln -s /etc/nginx/sites-available/markoub-backend /etc/nginx/sites-enabled/markoub-backend
nginx -t && systemctl reload nginx
```

Add HTTPS with certbot (optional but recommended):
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

## 6) Queue workers and scheduler (optional)
```bash
# Supervisor for queues
apt install -y supervisor
cat > /etc/supervisor/conf.d/markoub-queue.conf <<'EOF'
[program:markoub-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/markoub-backend/artisan queue:work --sleep=3 --tries=3 --timeout=90
autostart=true
autorestart=true
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/supervisor/markoub-queue.log
EOF
supervisorctl reread && supervisorctl update && supervisorctl start markoub-queue:*

# Laravel scheduler
(crontab -l ; echo "* * * * * php /var/www/markoub-backend/artisan schedule:run >> /dev/null 2>&1") | crontab -
```

## 7) CORS
In `config/cors.php`, ensure `allowed_origins` includes your frontend origin(s):
- https://your-frontend-domain.com
- https://www.your-frontend-domain.com

You can also set `FRONTEND_URL` in .env and keep the array entry `env('FRONTEND_URL')`.

## 8) Health check
- Check: `https://api.yourdomain.com/api/health` should return `{ "status":"ok" }`.

## cPanel (shared hosting) notes
- Use “Laravel on subdomain” guides from your host.
- Point Document Root to `public/` folder.
- Set environment variables via cPanel’s .env editor or file manager.
- Run `composer install` from cPanel Terminal (if available) or upload vendor.

## PaaS alternatives
- Render / Railway: PHP (Nginx) + MySQL managed services. Run build: `composer install --no-dev` and start: `php artisan serve` or Nginx buildpack.
- Laravel Forge: provision server + deploy hooks out of the box.
- Laravel Vapor: Serverless on AWS (advanced).

## Production checklist
- [ ] APP_ENV=production, APP_DEBUG=false, APP_URL set
- [ ] DB configured (MySQL) and migrated
- [ ] JWT_SECRET set (or `jwt:secret` run)
- [ ] Storage symlink created
- [ ] Nginx points to public/ and PHP-FPM correct socket
- [ ] HTTPS with valid certificate
- [ ] CORS allowed origins include frontend domain(s)
- [ ] Supervisor queue and cron scheduler (if using queues/schedule)
- [ ] Config/routes/views cached

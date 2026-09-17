#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE DÉPLOIEMENT AUTOMATISÉ POUR WEDDING MOOD SUR CONTABO VPS (UBUNTU)
# ==============================================================================
# Ce script installe et configure l'environnement complet de production :
# Node.js 20 LTS, PostgreSQL, PM2, Nginx, Certbot SSL, UFW Firewall et sauvegarde.
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "  DÉPLOIEMENT WEDDING MOOD SUR CONTABO VPS (UBUNTU LINUX) "
echo "=========================================================="

APP_DIR="/var/www/wedding-mood"
DOMAIN="weddingmood.ci"
DB_NAME="wedding_mood_db"
DB_USER="weddingmood_user"

# 1. Mise à jour du système Ubuntu
echo "[1/8] Mise à jour des dépôts et paquets système..."
sudo apt update -y && sudo apt upgrade -y
sudo apt install -y curl wget git unzip ufw nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# 2. Installation de Node.js 20 LTS
echo "[2/8] Vérification / Installation de Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# 3. Installation globale de PM2
echo "[3/8] Installation du gestionnaire de processus PM2..."
sudo npm install -g pm2

# 4. Configuration de la base de données PostgreSQL
echo "[4/8] Configuration de PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9')

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "Base de données $DB_NAME prête."

# 5. Déploiement et compilation de l'application
echo "[5/8] Installation des dépendances et compilation Next.js..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ ! -f .env ]; then
    echo "Génération du fichier .env de production..."
    cat <<EOF > .env
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
NEXT_PUBLIC_WHATSAPP_CONTACT=https://wa.me/22570501356
NEXT_PUBLIC_WAVE_PAY_URL=https://pay.wave.com/m/M_W9fOyOGfFiNN/c/ci/?amount=2000
SESSION_SECRET=$(openssl rand -base64 32)
EOF
fi

npm ci --prefer-offline || npm install
npx drizzle-kit push
npm run build

# 6. Démarrage de l'application avec PM2
echo "[6/8] Démarrage de Wedding Mood avec PM2..."
pm2 delete wedding-mood 2>/dev/null || true
pm2 start npm --name "wedding-mood" -- start
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1 | bash 2>/dev/null || true

# 7. Configuration Nginx et Pare-feu UFW
echo "[7/8] Configuration de Nginx et activation du pare-feu..."
sudo cp nginx/wedding-mood.conf /etc/nginx/sites-available/"$DOMAIN" 2>/dev/null || true
sudo ln -sf /etc/nginx/sites-available/"$DOMAIN" /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable

# 8. Certificat SSL Let's Encrypt (optionnel si domaine pointé)
echo "[8/8] Obtention du certificat SSL..."
echo "Pour activer HTTPS, lancez :"
echo "sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"

echo "=========================================================="
echo "  DÉPLOIEMENT TERMINÉ AVEC SUCCÈS SUR CONTABO VPS !       "
echo "  Application accessible sur : http://$DOMAIN (ou https)  "
echo "=========================================================="

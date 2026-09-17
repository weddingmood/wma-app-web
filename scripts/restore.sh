#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE RESTAURATION DE SAUVEGARDE POUR WEDDING MOOD
# ==============================================================================
# Usage : ./scripts/restore.sh /chemin/vers/db_wedding_mood_db_YYYYMMDD_HHMMSS.sql.gz
# ==============================================================================

set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage : $0 /chemin/vers/db_backup.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="wedding_mood_db"
APP_DIR="/var/www/wedding-mood"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Erreur : le fichier de sauvegarde $BACKUP_FILE est introuvable."
    exit 1
fi

echo "ATTENTION : cette opération va écraser la base de données actuelle '$DB_NAME'."
read -p "Confirmez-vous la restauration ? (oui/non) : " CONFIRM
if [ "$CONFIRM" != "oui" ]; then
    echo "Restauration annulée."
    exit 0
fi

echo "[1/3] Arrêt temporaire de l'application via PM2..."
pm2 stop wedding-mood 2>/dev/null || true

echo "[2/3] Restauration de la base de données PostgreSQL..."
gunzip -c "$BACKUP_FILE" | sudo -u postgres psql -d "$DB_NAME"

echo "[3/3] Redémarrage de l'application..."
pm2 restart wedding-mood || pm2 start npm --name "wedding-mood" -- start

echo "Restauration terminée avec succès !"

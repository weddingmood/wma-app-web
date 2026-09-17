#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE SAUVEGARDE AUTOMATISÉE POUR WEDDING MOOD
# ==============================================================================
# Sauvegarde la base de données PostgreSQL et les fichiers média/uploads.
# À planifier dans cron (ex: tous les jours à 03h00) :
# 0 3 * * * /var/www/wedding-mood/scripts/backup.sh >> /var/log/wedding-mood-backup.log 2>&1
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/var/backups/wedding-mood"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="wedding_mood_db"
APP_DIR="/var/www/wedding-mood"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Début de la sauvegarde Wedding Mood..."

# 1. Sauvegarde de la base de données
DB_BACKUP_FILE="${BACKUP_DIR}/db_${DB_NAME}_${DATE}.sql.gz"
sudo -u postgres pg_dump "$DB_NAME" | gzip > "$DB_BACKUP_FILE"
echo "Base de données sauvegardée dans : $DB_BACKUP_FILE"

# 2. Sauvegarde des uploads et fichiers média
MEDIA_BACKUP_FILE="${BACKUP_DIR}/media_${DATE}.tar.gz"
if [ -d "${APP_DIR}/public" ]; then
    tar -czf "$MEDIA_BACKUP_FILE" -C "${APP_DIR}" public
    echo "Fichiers médias sauvegardés dans : $MEDIA_BACKUP_FILE"
fi

# 3. Nettoyage des sauvegardes datant de plus de 30 jours
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +30 -exec rm -f {} \;
echo "[$(date)] Sauvegarde terminée avec succès. Anciennes sauvegardes nettoyées."

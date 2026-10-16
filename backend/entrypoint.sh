#!/bin/sh
set -e

export PORT="${PORT:-8000}"

echo "==> Running Django database migrations..."
python manage.py migrate --noinput || echo "Warning: Database migration skipped or failed"

echo "==> Collecting static files..."
python manage.py collectstatic --noinput --clear || echo "Warning: collectstatic skipped"

echo "==> Launching Redis + Celery + Gunicorn via Supervisord..."
exec supervisord -c /app/supervisord.conf

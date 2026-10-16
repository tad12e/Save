#!/bin/bash
set -e

echo "==> [Azure Startup] Running migrations..."
python manage.py migrate --noinput || echo "Warning: Migration failed"

echo "==> [Azure Startup] Collecting static files..."
python manage.py collectstatic --noinput || echo "Warning: Collectstatic failed"

echo "==> [Azure Startup] Starting Gunicorn WSGI server..."
gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -

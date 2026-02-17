# Setup Guide — Troubleshooting

This document provides quick troubleshooting tips for starting the development environment on macOS and Linux.

Common Docker Desktop issues (macOS)

- Ensure Docker Desktop is installed and running.
- File sharing / permissions: allow access to your project folder when Docker prompts. If you see permission errors, try restarting Docker Desktop.
- Resource limits: increase CPU / memory in Docker Desktop Preferences if builds or containers OOM.

Inspecting container logs

- Tail all logs: `docker compose logs -f`.
- Tail a single service: `docker compose logs -f backend`.

If a container fails to start

- Check `docker compose ps` and `docker compose logs -f <service>` for errors.
- If volumes are corrupted, reset with: `docker compose down -v` then `docker compose up -d`.

Running migrations manually

```bash
cd backend
bun run db:migrate
```

Connecting to Postgres from host

```bash
# run psql from a container
docker compose exec -T postgres psql -U postgres -d personal_vault

# or, if you have psql locally:
psql -h localhost -U postgres -d personal_vault
```

macOS-specific tips

- If ports appear in use, `lsof -i :8000` and `lsof -i :3000` can show processes.
- If Docker Desktop behaves oddly, try: Restart Docker Desktop → `docker compose down -v` → `docker compose up -d`.

Linux-specific tips

- Ensure `docker` and `docker-compose` (or Docker Compose v2 plugin) are installed and your user is in the `docker` group or use `sudo`.
- For systemd-managed Docker, check `journalctl -u docker.service` for errors.

Further help

- If you still have problems, capture logs and the output of `docker compose ps` and open an issue with the logs attached.

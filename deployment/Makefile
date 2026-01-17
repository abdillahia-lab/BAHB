# BAHB Deployment Makefile
# Simplifies common Docker and deployment operations

.PHONY: help build up down restart logs status clean install health test

# Default target
.DEFAULT_GOAL := help

# Configuration
COMPOSE_FILE := deployment/docker-compose.yml
PROJECT_NAME := bahb

# ==========================================
# Help
# ==========================================
help: ## Show this help message
	@echo "BAHB Deployment Makefile"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ==========================================
# Installation
# ==========================================
install: ## Run the installation script
	@echo "Running BAHB installer..."
	sudo ./deployment/install.sh

# ==========================================
# Docker Operations
# ==========================================
build: ## Build Docker images
	@echo "Building BAHB Docker images..."
	docker compose -f $(COMPOSE_FILE) build --progress=plain

pull: ## Pull pre-built images (if available)
	@echo "Pulling BAHB images..."
	docker compose -f $(COMPOSE_FILE) pull

up: ## Start all services
	@echo "Starting BAHB services..."
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "Services started. Use 'make logs' to view logs."

up-monitoring: ## Start services with monitoring (Prometheus + Grafana)
	@echo "Starting BAHB with monitoring..."
	docker compose -f $(COMPOSE_FILE) --profile monitoring up -d

down: ## Stop all services
	@echo "Stopping BAHB services..."
	docker compose -f $(COMPOSE_FILE) down

restart: ## Restart all services
	@echo "Restarting BAHB services..."
	docker compose -f $(COMPOSE_FILE) restart

restart-bahb: ## Restart only BAHB main service
	@echo "Restarting BAHB main..."
	docker compose -f $(COMPOSE_FILE) restart bahb

# ==========================================
# Monitoring
# ==========================================
logs: ## View logs from all services
	docker compose -f $(COMPOSE_FILE) logs -f

logs-bahb: ## View logs from BAHB main service
	docker logs bahb-main -f --tail 100

logs-mqtt: ## View logs from MQTT broker
	docker logs bahb-mqtt -f --tail 50

status: ## Show status of all services
	@echo "BAHB Service Status:"
	@docker compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "System Status:"
	@if command -v nvidia-smi >/dev/null 2>&1; then nvidia-smi; fi
	@echo ""
	@if command -v tegrastats >/dev/null 2>&1; then echo "Run 'tegrastats' to monitor Jetson resources"; fi

health: ## Check health of all services
	@echo "Checking service health..."
	@docker compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "Testing MQTT broker..."
	@mosquitto_sub -h localhost -t '$$SYS/broker/uptime' -C 1 || echo "MQTT broker not responding"
	@echo ""
	@echo "Testing BAHB main service..."
	@curl -f http://localhost:8080/health 2>/dev/null && echo "BAHB is healthy" || echo "BAHB not responding"

stats: ## Show resource usage
	docker stats --no-stream

# ==========================================
# Systemd Operations
# ==========================================
enable: ## Enable systemd service
	sudo systemctl enable bahb
	@echo "BAHB will start automatically on boot"

disable: ## Disable systemd service
	sudo systemctl disable bahb
	@echo "BAHB will not start automatically on boot"

start: ## Start BAHB via systemd
	sudo systemctl start bahb
	@sleep 2
	sudo systemctl status bahb

stop: ## Stop BAHB via systemd
	sudo systemctl stop bahb

systemd-status: ## Show systemd service status
	sudo systemctl status bahb

systemd-logs: ## View systemd logs
	journalctl -u bahb -f

# ==========================================
# Development
# ==========================================
shell: ## Open shell in BAHB container
	docker exec -it bahb-main /bin/bash

shell-mqtt: ## Open shell in MQTT container
	docker exec -it bahb-mqtt /bin/sh

exec: ## Execute command in BAHB container (use: make exec CMD="python3 -c 'import torch; print(torch.cuda.is_available())'")
	docker exec -it bahb-main $(CMD)

# ==========================================
# Testing
# ==========================================
test: ## Run basic tests
	@echo "Testing CUDA availability..."
	@docker exec bahb-main python3 -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
	@echo ""
	@echo "Testing TensorRT..."
	@docker exec bahb-main python3 -c "import tensorrt; print(f'TensorRT version: {tensorrt.__version__}')"
	@echo ""
	@echo "Testing MQTT..."
	@mosquitto_pub -h localhost -t 'bahb/test' -m 'test message'
	@mosquitto_sub -h localhost -t 'bahb/test' -C 1

test-camera: ## Test camera/RTSP streams
	@echo "Testing RTSP streams (requires gstreamer)..."
	@gst-launch-1.0 rtspsrc location=rtsp://192.168.42.2:8554/wide ! fakesink || echo "RTSP test failed"

# ==========================================
# Performance
# ==========================================
optimize: ## Set Jetson to maximum performance
	@echo "Setting MAXN power mode..."
	@sudo nvpmodel -m 0 || echo "nvpmodel not available"
	@echo "Enabling maximum clocks..."
	@sudo jetson_clocks || echo "jetson_clocks not available"
	@echo "Performance optimization complete"

optimize-status: ## Check performance mode
	@echo "Current power mode:"
	@sudo nvpmodel -q || echo "nvpmodel not available"

# ==========================================
# Maintenance
# ==========================================
clean: ## Remove stopped containers and unused images
	@echo "Cleaning up Docker resources..."
	docker compose -f $(COMPOSE_FILE) down -v
	docker system prune -f

clean-all: ## Remove all Docker resources (WARNING: removes all images)
	@echo "WARNING: This will remove ALL Docker images and volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose -f $(COMPOSE_FILE) down -v; \
		docker system prune -af --volumes; \
	fi

clean-logs: ## Clean old log files
	@echo "Cleaning old logs (older than 7 days)..."
	find deployment/logs -name "*.log" -mtime +7 -delete || true
	find /data/bahb/logs -name "*.log" -mtime +7 -delete || true

clean-recordings: ## Clean old recordings (older than 30 days)
	@echo "Cleaning old recordings (older than 30 days)..."
	find deployment/recordings -type f -mtime +30 -delete || true
	find /data/bahb/recordings -type f -mtime +30 -delete || true

# ==========================================
# Backup & Restore
# ==========================================
backup: ## Backup BAHB data and configuration
	@echo "Creating backup..."
	@mkdir -p backups
	tar -czf backups/bahb-backup-$$(date +%Y%m%d-%H%M%S).tar.gz \
		-C /data bahb \
		-C /opt/bahb configs deployment
	@echo "Backup created in backups/"

backup-data: ## Backup only data (recordings, reports)
	@echo "Creating data backup..."
	@mkdir -p backups
	tar -czf backups/bahb-data-$$(date +%Y%m%d-%H%M%S).tar.gz \
		-C /data/bahb recordings reports
	@echo "Data backup created in backups/"

# ==========================================
# Updates
# ==========================================
update: ## Update BAHB (pull latest code, rebuild, restart)
	@echo "Updating BAHB..."
	git pull
	$(MAKE) build
	$(MAKE) restart
	@echo "Update complete"

update-images: ## Update base images and rebuild
	docker compose -f $(COMPOSE_FILE) build --pull --no-cache

# ==========================================
# Debugging
# ==========================================
debug: ## Show debug information
	@echo "=== BAHB Debug Information ==="
	@echo ""
	@echo "--- Docker Version ---"
	@docker --version
	@docker compose version
	@echo ""
	@echo "--- NVIDIA Runtime ---"
	@docker info | grep -A 5 Runtimes || echo "NVIDIA runtime not found"
	@echo ""
	@echo "--- Container Status ---"
	@docker compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "--- GPU Status ---"
	@nvidia-smi || echo "nvidia-smi not available"
	@echo ""
	@echo "--- Jetson Info ---"
	@jetson_release || echo "jetson_release not available"
	@echo ""
	@echo "--- Network ---"
	@ip addr show
	@echo ""
	@echo "--- Disk Usage ---"
	@df -h /data/bahb
	@echo ""
	@echo "--- Recent Logs ---"
	@docker logs bahb-main --tail 20 || echo "BAHB container not running"

# ==========================================
# Documentation
# ==========================================
docs: ## Open documentation
	@if command -v xdg-open >/dev/null 2>&1; then \
		xdg-open deployment/README.md; \
	else \
		cat deployment/README.md; \
	fi

# ==========================================
# Quick Actions
# ==========================================
quick-start: build up ## Quick start: build and start all services
	@echo "BAHB is starting up..."
	@sleep 5
	$(MAKE) status

quick-restart: restart logs ## Quick restart: restart and follow logs

quick-stop: down clean-logs ## Quick stop: stop services and clean logs

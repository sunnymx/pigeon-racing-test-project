---
name: docker
description: Docker container management, deployment, and troubleshooting. Covers Docker installation, daemon management, container operations, image building, Docker Compose, and common workflows. Use when working with Docker, containers, containerization, or deployment environments.
---

# Docker Expert

## When to Use This Skill

Activate when working with:
- Docker container management
- Container deployment and orchestration
- Dockerfile creation and optimization
- Docker Compose multi-container apps
- Container troubleshooting
- Docker networking and volumes

## Docker Installation and Setup

### Starting Docker in Container Environments

First, check if Docker is already installed:
```bash
which docker
docker --version
```

To start Docker daemon in a container environment:
```bash
# Start Docker daemon in the background
sudo dockerd > /tmp/docker.log 2>&1 &

# Wait for Docker to initialize
sleep 5

# Verify Docker is running
sudo docker ps
```

### Verifying Installation

Test Docker with hello-world:
```bash
sudo docker run hello-world
```

## Common Docker Commands

### Container Management
```bash
# List containers
docker ps                    # Running containers
docker ps -a                 # All containers including stopped

# Run a container
docker run -d --name myapp nginx                  # Detached mode
docker run -it ubuntu bash                        # Interactive mode
docker run -p 8080:80 nginx                       # Port mapping
docker run -v /host/path:/container/path nginx    # Volume mounting

# Container operations
docker start <container_id>                       # Start stopped container
docker stop <container_id>                        # Stop running container
docker restart <container_id>                     # Restart container
docker rm <container_id>                          # Remove container
docker logs <container_id>                        # View logs
docker exec -it <container_id> bash               # Execute command in container
```

### Image Management
```bash
# List images
docker images
docker images -a              # Include intermediate images

# Pull/Push images
docker pull ubuntu:latest
docker push myrepo/myimage:tag

# Build images
docker build -t myimage:tag .
docker build -t myimage:tag -f Dockerfile.prod .

# Remove images
docker rmi <image_id>
docker image prune            # Remove unused images
```

### Docker Compose
```bash
# Start services
docker-compose up             # Foreground
docker-compose up -d          # Background

# Stop services
docker-compose down           # Stop and remove
docker-compose stop           # Just stop

# View logs
docker-compose logs -f        # Follow logs
docker-compose logs service   # Specific service

# Rebuild services
docker-compose build
docker-compose up --build
```

## Dockerfile Best Practices

### Multi-stage Build
```dockerfile
# Build stage
FROM node:16 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:16-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --production
CMD ["node", "dist/server.js"]
```

### Optimization Tips
```dockerfile
# Use specific versions
FROM python:3.9-slim

# Combine RUN commands to reduce layers
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        && rm -rf /var/lib/apt/lists/*

# Use .dockerignore
# Copy dependencies first (leverage cache)
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy code last
COPY . .

# Use non-root user
RUN useradd -m appuser
USER appuser

# Define healthcheck
HEALTHCHECK CMD curl --fail http://localhost:8080/ || exit 1
```

## Troubleshooting

### Common Issues

**Docker daemon not running**:
```bash
sudo systemctl status docker
sudo systemctl start docker
```

**Permission denied**:
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

**Container won't start**:
```bash
docker logs <container_id>
docker inspect <container_id>
```

**Out of disk space**:
```bash
docker system prune           # Remove unused data
docker volume prune           # Remove unused volumes
docker image prune -a         # Remove all unused images
```

## Docker Compose Example

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./app:/app
    depends_on:
      - db
    networks:
      - app-network

  db:
    image: postgres:14
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  db-data:

networks:
  app-network:
    driver: bridge
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `docker ps` | List running containers |
| `docker images` | List images |
| `docker logs -f <id>` | Follow container logs |
| `docker exec -it <id> bash` | Shell into container |
| `docker-compose up -d` | Start services in background |
| `docker system prune` | Clean up unused resources |

## Resources

- Docker Docs: https://docs.docker.com/
- Docker Hub: https://hub.docker.com/
- Best Practices: https://docs.docker.com/develop/dev-best-practices/

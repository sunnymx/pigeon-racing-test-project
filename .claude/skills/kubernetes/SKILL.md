---
name: kubernetes
description: Kubernetes (K8s) cluster management, deployment, and local development using KIND (Kubernetes IN Docker). Covers kubectl commands, cluster operations, pod management, service deployment, and troubleshooting. Use when working with Kubernetes, K8s, container orchestration, or microservices deployment.
---

# Kubernetes Expert

## When to Use This Skill

Activate when working with:
- Kubernetes cluster management
- Pod and deployment operations
- Service and ingress configuration
- Local K8s development with KIND
- Container orchestration
- Microservices deployment

## KIND Installation and Setup

KIND (Kubernetes IN Docker) runs local Kubernetes clusters using Docker containers as nodes.

### Prerequisites

**IMPORTANT**: Ensure Docker is installed and running before proceeding.

### Install KIND and kubectl

On Debian/Ubuntu systems:
```bash
# Install KIND
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv ./kubectl /usr/local/bin/
```

## Essential kubectl Commands

### Cluster Info
```bash
kubectl cluster-info
kubectl get nodes
kubectl get namespaces
```

### Pod Management
```bash
kubectl get pods
kubectl describe pod <pod-name>
kubectl logs -f <pod-name>
kubectl exec -it <pod-name> -- bash
```

### Deployments
```bash
kubectl create deployment nginx --image=nginx
kubectl scale deployment nginx --replicas=3
kubectl rollout status deployment/nginx
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `kubectl get pods` | List pods |
| `kubectl logs -f <name>` | Follow pod logs |
| `kubectl apply -f file.yaml` | Apply manifest |
| `kind create cluster` | Create local cluster |

## Resources

- Kubernetes Docs: https://kubernetes.io/docs/
- KIND Docs: https://kind.sigs.k8s.io/

---
name: ssh
description: SSH (Secure Shell) connection management, authentication, key generation, and remote server operations. Expert in SSH configuration, key-based auth, SCP file transfer, and troubleshooting. Use when connecting to remote servers, managing SSH keys, transferring files, or debugging SSH issues.
---

# SSH Expert

## When to Use This Skill

Activate when working with:
- SSH connections to remote servers
- SSH key generation and management
- Secure file transfer (SCP/SFTP)
- Remote command execution
- SSH configuration

## Authentication Methods

### Password Authentication
```bash
ssh username@hostname
# You'll be prompted for password
```

### Key-Based Authentication (Recommended)

#### Generate SSH Key
```bash
# Generate ED25519 key (modern, secure)
ssh-keygen -t ed25519 -f ~/.ssh/key_name -C "comment" -N ""

# Generate RSA key (compatibility)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/key_name -C "comment" -N ""
```

#### Copy Key to Server
```bash
ssh-copy-id -i ~/.ssh/key_name.pub username@hostname
```

#### Connect with Key
```bash
ssh -i ~/.ssh/key_name username@hostname
```

## SSH Configuration

Create `~/.ssh/config` for easier connections:

```bash
mkdir -p ~/.ssh
cat > ~/.ssh/config << 'EOF'
Host myserver
    HostName hostname_or_ip
    User username
    IdentityFile ~/.ssh/key_name
    Port 22
    ServerAliveInterval 60
EOF
chmod 600 ~/.ssh/config

# Now connect simply with:
ssh myserver
```

## File Transfer with SCP

### Copy Files
```bash
# Local to remote
scp /path/to/local/file username@hostname:/path/to/remote/

# Remote to local
scp username@hostname:/path/to/remote/file /path/to/local/

# Copy directory recursively
scp -r /path/to/directory username@hostname:/path/to/remote/
```

### Common SCP Options
- `-r`: Recursive (for directories)
- `-P port`: Specify port
- `-i keyfile`: Use specific key
- `-v`: Verbose mode

## SSH Agent

Manage keys in memory:

```bash
# Start SSH agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/key_name

# List loaded keys
ssh-add -l
```

## Common SSH Options

```bash
ssh -p PORT hostname              # Custom port
ssh -X hostname                   # X11 forwarding
ssh -L 8080:localhost:80 host     # Local port forwarding
ssh -R 8080:localhost:80 host     # Remote port forwarding
ssh -N -f host                    # Background, no command
ssh -vvv hostname                 # Debug mode (verbose)
```

## Troubleshooting

### Permission Issues
```bash
# Fix SSH directory permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 600 ~/.ssh/config
chmod 600 ~/.ssh/authorized_keys
```

### Connection Issues
```bash
# Verbose debug output
ssh -vvv username@hostname

# Check if port is open
nc -zv hostname 22

# Remove old host key (if changed)
ssh-keygen -R hostname
```

### Common Errors

**Host key verification failed**:
```bash
ssh-keygen -R hostname
# Then reconnect
```

**Permission denied (publickey)**:
- Check key permissions (600 for private, 644 for public)
- Verify key is added to server's authorized_keys
- Use `ssh -vvv` to debug

**Connection timed out**:
- Check firewall rules
- Verify port is correct (default 22)
- Test with `nc -zv hostname port`

## Security Best Practices

1. **Use key-based auth** (disable password auth)
2. **Use strong key types** (ED25519 or RSA 4096)
3. **Protect private keys** (chmod 600)
4. **Use SSH agent** for convenience
5. **Keep SSH updated**
6. **Use different keys** for different servers
7. **Add passphrase** to keys for extra security

## Quick Reference

| Command | Purpose |
|---------|---------|
| `ssh user@host` | Connect to server |
| `ssh-keygen -t ed25519` | Generate key |
| `ssh-copy-id user@host` | Copy key to server |
| `scp file user@host:/path` | Copy file to server |
| `ssh-add keyfile` | Add key to agent |
| `ssh -vvv host` | Debug connection |

## Resources

- SSH.COM Docs: https://www.ssh.com/academy/ssh
- OpenSSH Manual: https://www.openssh.com/manual.html

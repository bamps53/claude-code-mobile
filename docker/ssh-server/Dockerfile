FROM ubuntu:22.04

# Install SSH server, tmux, and utilities
RUN apt-get update && apt-get install -y \
    openssh-server \
    tmux \
    curl \
    vim \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Create test user
RUN useradd -m -s /bin/bash testuser && \
    echo 'testuser:testpass' | chpasswd && \
    mkdir -p /home/testuser/.ssh && \
    chown testuser:testuser /home/testuser/.ssh && \
    chmod 700 /home/testuser/.ssh

# Configure SSH
RUN mkdir /var/run/sshd && \
    echo 'PermitRootLogin no' >> /etc/ssh/sshd_config && \
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config && \
    echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config && \
    echo 'Port 2222' >> /etc/ssh/sshd_config

# Add test SSH key
COPY test_key.pub /home/testuser/.ssh/authorized_keys
RUN chown testuser:testuser /home/testuser/.ssh/authorized_keys && \
    chmod 600 /home/testuser/.ssh/authorized_keys

# Create Claude Code simulation script
COPY claude-code-sim.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/claude-code-sim.sh

EXPOSE 2222

CMD ["/usr/sbin/sshd", "-D"]
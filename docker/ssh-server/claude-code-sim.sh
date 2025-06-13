#!/bin/bash

# Claude Code simulation script for testing
# Simulates Claude Code terminal behavior including bell character for notifications

echo "🤖 Claude Code Test Simulation Started"
echo "Type 'help' for available test commands"

while true; do
    read -p "claude-test$ " cmd
    
    case "$cmd" in
        "help")
            echo "Available test commands:"
            echo "  bell - Send bell character (for notification testing)"
            echo "  long - Start long-running command"
            echo "  error - Simulate error condition"
            echo "  exit - Exit simulation"
            ;;
        "bell")
            echo -e "Bell notification test \a"
            echo "Bell character sent for push notification testing"
            ;;
        "long")
            echo "Starting long-running operation..."
            for i in {1..10}; do
                sleep 1
                echo "Processing step $i/10..."
            done
            echo "Long operation completed"
            ;;
        "error")
            echo "Error: Simulated connection failure" >&2
            exit 1
            ;;
        "exit"|"quit")
            echo "Claude Code simulation ended"
            exit 0
            ;;
        "")
            # Empty command, continue
            ;;
        *)
            echo "Running: $cmd"
            eval "$cmd" 2>&1 || echo "Command failed with exit code $?"
            ;;
    esac
done
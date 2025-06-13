/**
 * Integration test setup file
 * Configures Docker containers and SSH connections for testing
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export class IntegrationTestEnvironment {
  private static instance: IntegrationTestEnvironment;
  private isSetup = false;
  private containerName = 'ssh-integration-test';

  static getInstance(): IntegrationTestEnvironment {
    if (!IntegrationTestEnvironment.instance) {
      IntegrationTestEnvironment.instance = new IntegrationTestEnvironment();
    }
    return IntegrationTestEnvironment.instance;
  }

  async setup(): Promise<void> {
    if (this.isSetup) return;

    console.log('Setting up integration test environment...');

    try {
      // Build and start Docker containers
      await execAsync('docker-compose -f docker/docker-compose.yml up -d --build');
      
      // Wait for SSH server to be ready
      await this.waitForSSHServer();
      
      this.isSetup = true;
      console.log('Integration test environment ready');
    } catch (error) {
      console.error('Failed to setup integration test environment:', error);
      throw error;
    }
  }

  async teardown(): Promise<void> {
    if (!this.isSetup) return;

    console.log('Tearing down integration test environment...');

    try {
      await execAsync('docker-compose -f docker/docker-compose.yml down -v');
      this.isSetup = false;
      console.log('Integration test environment cleaned up');
    } catch (error) {
      console.error('Failed to teardown integration test environment:', error);
    }
  }

  private async waitForSSHServer(maxRetries = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await execAsync('nc -z localhost 2222');
        console.log('SSH server is ready');
        return;
      } catch {
        console.log(`Waiting for SSH server... (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('SSH server failed to start within timeout');
  }

  getSSHConfig() {
    return {
      host: 'localhost',
      port: 2222,
      username: 'testuser',
      password: 'testpass',
      privateKey: fs.readFileSync(path.join(__dirname, '../docker/ssh-server/test_key'), 'utf8'),
    };
  }

  getMockFCMEndpoint() {
    return 'http://localhost:8080';
  }
}

// Global setup and teardown for integration tests
let testEnv: IntegrationTestEnvironment;

beforeAll(async () => {
  testEnv = IntegrationTestEnvironment.getInstance();
  await testEnv.setup();
}, 60000); // 60 second timeout for setup

afterAll(async () => {
  if (testEnv) {
    await testEnv.teardown();
  }
}, 30000); // 30 second timeout for teardown

export { testEnv };
/**
 * Integration tests for push notification system
 * Tests notification setup, device token registration, and bell character handling
 */

import { NotificationManager, BellNotification } from '../src/api/notifications';
import { SSHConnectionManager } from '../src/api/ssh';
import { IntegrationTestEnvironment } from './setup';

// Mock Expo Notifications for testing
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

describe('Push Notification Integration', () => {
  let notificationManager: NotificationManager;
  let sshManager: SSHConnectionManager;
  let testEnv: IntegrationTestEnvironment;
  const testSessionName = `notification-test-${Date.now()}`;

  beforeAll(() => {
    testEnv = IntegrationTestEnvironment.getInstance();
  });

  beforeEach(async () => {
    notificationManager = new NotificationManager();
    sshManager = new SSHConnectionManager();
    
    // Mock notification permissions and token
    const mockNotifications = require('expo-notifications');
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ 
      data: 'ExponentPushToken[test-token-123]' 
    });
  });

  afterEach(async () => {
    try {
      if (sshManager.isConnectionActive()) {
        await sshManager.killSession(testSessionName);
        await sshManager.disconnect();
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Notification Setup and Permissions', () => {
    it('should initialize notification system successfully', async () => {
      const config = {
        fcmEndpoint: testEnv.getMockFCMEndpoint(),
        serverKey: 'test-server-key',
      };

      await expect(notificationManager.initialize(config))
        .resolves.toBeUndefined();
      
      expect(notificationManager.getDeviceToken()).toBeDefined();
      expect(notificationManager.getDeviceToken()).toContain('ExponentPushToken');
    });

    it('should handle permission denied gracefully', async () => {
      const mockNotifications = require('expo-notifications');
      mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
      mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const config = {
        fcmEndpoint: testEnv.getMockFCMEndpoint(),
      };

      await expect(notificationManager.initialize(config))
        .rejects.toThrow('Notification permissions not granted');
    });

    it('should handle push token retrieval failure', async () => {
      const mockNotifications = require('expo-notifications');
      mockNotifications.getExpoPushTokenAsync.mockRejectedValue(
        new Error('Token retrieval failed')
      );

      const config = {
        fcmEndpoint: testEnv.getMockFCMEndpoint(),
      };

      await expect(notificationManager.initialize(config))
        .rejects.toThrow('Failed to get push token');
    });

    it('should check notification status correctly', async () => {
      const mockNotifications = require('expo-notifications');
      mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });

      const isEnabled = await notificationManager.areNotificationsEnabled();
      expect(isEnabled).toBe(true);
    });
  });

  describe('Device Token Registration', () => {
    beforeEach(async () => {
      const config = {
        fcmEndpoint: testEnv.getMockFCMEndpoint(),
        serverKey: 'test-server-key',
      };
      await notificationManager.initialize(config);
      await sshManager.connect(testEnv.getSSHConfig());
    });

    it('should register device token for session notifications', async () => {
      await sshManager.createSession(testSessionName);
      
      await expect(notificationManager.registerForSessionNotifications(
        testSessionName,
        testEnv.getSSHConfig()
      )).resolves.toBeUndefined();
    });

    it('should unregister device token from session notifications', async () => {
      await sshManager.createSession(testSessionName);
      
      // Register first
      await notificationManager.registerForSessionNotifications(
        testSessionName,
        testEnv.getSSHConfig()
      );
      
      // Then unregister
      await expect(notificationManager.unregisterFromSessionNotifications(testSessionName))
        .resolves.toBeUndefined();
    });

    it('should handle registration failure gracefully', async () => {
      // Use invalid endpoint to simulate failure
      const invalidConfig = {
        fcmEndpoint: 'http://invalid.endpoint',
      };
      
      const invalidNotificationManager = new NotificationManager();
      await invalidNotificationManager.initialize(invalidConfig);
      
      await expect(invalidNotificationManager.registerForSessionNotifications(
        testSessionName,
        testEnv.getSSHConfig()
      )).rejects.toThrow('Failed to register for notifications');
    });

    it('should fail registration when not initialized', async () => {
      const uninitializedManager = new NotificationManager();
      
      await expect(uninitializedManager.registerForSessionNotifications(
        testSessionName,
        testEnv.getSSHConfig()
      )).rejects.toThrow('Notification manager not initialized');
    });
  });

  describe('Bell Notification Handling', () => {
    beforeEach(async () => {
      const config = {
        fcmEndpoint: testEnv.getMockFCMEndpoint(),
        serverKey: 'test-server-key',
      };
      await notificationManager.initialize(config);
    });

    it('should send test bell notification successfully', async () => {
      const bellNotification: BellNotification = {
        sessionId: testSessionName,
        sessionName: testSessionName,
        timestamp: new Date(),
        message: 'Test bell notification',
      };

      await expect(notificationManager.sendTestBellNotification(bellNotification))
        .resolves.toBeUndefined();
    });

    it('should handle bell notification listeners', async () => {
      const receivedNotifications: BellNotification[] = [];
      
      const testListener = (notification: BellNotification) => {
        receivedNotifications.push(notification);
      };
      
      notificationManager.addBellListener(testListener);
      
      // Simulate receiving a notification
      const mockNotifications = require('expo-notifications');
      const mockListener = mockNotifications.addNotificationReceivedListener.mock.calls[0][0];
      
      const mockNotification = {
        request: {
          content: {
            data: {
              type: 'bell',
              sessionId: testSessionName,
              sessionName: testSessionName,
              timestamp: new Date().toISOString(),
            },
            body: 'Test notification body',
          },
        },
      };
      
      mockListener(mockNotification);
      
      expect(receivedNotifications).toHaveLength(1);
      expect(receivedNotifications[0].sessionId).toBe(testSessionName);
      expect(receivedNotifications[0].message).toBe('Test notification body');
      
      notificationManager.removeBellListener(testListener);
    });

    it('should handle notification response (user tap)', async () => {
      const receivedNotifications: BellNotification[] = [];
      
      const testListener = (notification: BellNotification) => {
        receivedNotifications.push(notification);
      };
      
      notificationManager.addBellListener(testListener);
      
      // Simulate user tapping notification
      const mockNotifications = require('expo-notifications');
      const mockResponseListener = mockNotifications.addNotificationResponseReceivedListener.mock.calls[0][0];
      
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'bell',
                sessionId: testSessionName,
                sessionName: testSessionName,
                timestamp: new Date().toISOString(),
              },
              body: 'Tapped notification',
            },
          },
        },
      };
      
      mockResponseListener(mockResponse);
      
      expect(receivedNotifications).toHaveLength(1);
      expect(receivedNotifications[0].sessionId).toBe(testSessionName);
      
      notificationManager.removeBellListener(testListener);
    });

    it('should handle multiple bell listeners', async () => {
      const listener1Notifications: BellNotification[] = [];
      const listener2Notifications: BellNotification[] = [];
      
      const listener1 = (notification: BellNotification) => {
        listener1Notifications.push(notification);
      };
      
      const listener2 = (notification: BellNotification) => {
        listener2Notifications.push(notification);
      };
      
      notificationManager.addBellListener(listener1);
      notificationManager.addBellListener(listener2);
      
      // Simulate notification
      const mockNotifications = require('expo-notifications');
      const mockListener = mockNotifications.addNotificationReceivedListener.mock.calls[0][0];
      
      const mockNotification = {
        request: {
          content: {
            data: {
              type: 'bell',
              sessionId: testSessionName,
              sessionName: testSessionName,
              timestamp: new Date().toISOString(),
            },
            body: 'Multiple listeners test',
          },
        },
      };
      
      mockListener(mockNotification);
      
      expect(listener1Notifications).toHaveLength(1);
      expect(listener2Notifications).toHaveLength(1);
      expect(listener1Notifications[0].sessionId).toBe(testSessionName);
      expect(listener2Notifications[0].sessionId).toBe(testSessionName);
      
      notificationManager.removeBellListener(listener1);
      notificationManager.removeBellListener(listener2);
    });
  });

  describe('Integration with SSH Sessions', () => {
    beforeEach(async () => {
      const config = {
        fcmEndpoint: testEnv.getMockFCMEndpoint(),
        serverKey: 'test-server-key',
      };
      await notificationManager.initialize(config);
      await sshManager.connect(testEnv.getSSHConfig());
    });

    it('should integrate notification registration with session creation', async () => {
      await sshManager.createSession(testSessionName);
      
      const sessions = await sshManager.listSessions();
      const createdSession = sessions.find(s => s.name === testSessionName);
      expect(createdSession).toBeDefined();
      
      // Register for notifications on the created session
      await expect(notificationManager.registerForSessionNotifications(
        createdSession!.id,
        testEnv.getSSHConfig()
      )).resolves.toBeUndefined();
    });

    it('should handle session cleanup with notification unregistration', async () => {
      await sshManager.createSession(testSessionName);
      
      // Register for notifications
      await notificationManager.registerForSessionNotifications(
        testSessionName,
        testEnv.getSSHConfig()
      );
      
      // Kill session and unregister
      await sshManager.killSession(testSessionName);
      await notificationManager.unregisterFromSessionNotifications(testSessionName);
      
      // Verify session is gone
      const sessions = await sshManager.listSessions();
      expect(sessions.find(s => s.name === testSessionName)).toBeUndefined();
    });

    it('should simulate bell character detection and notification', async () => {
      await sshManager.createSession(testSessionName);
      await notificationManager.registerForSessionNotifications(
        testSessionName,
        testEnv.getSSHConfig()
      );
      
      // Simulate bell notification from server monitoring
      const bellNotification: BellNotification = {
        sessionId: testSessionName,
        sessionName: testSessionName,
        timestamp: new Date(),
        message: 'Bell character detected in session',
      };
      
      await expect(notificationManager.sendTestBellNotification(bellNotification))
        .resolves.toBeUndefined();
    });
  });

  describe('Background and Foreground Notification Handling', () => {
    beforeEach(async () => {
      const config = {
        fcmEndpoint: testEnv.getMockFCMEndpoint(),
      };
      await notificationManager.initialize(config);
    });

    it('should configure notification handler correctly', async () => {
      const mockNotifications = require('expo-notifications');
      expect(mockNotifications.setNotificationHandler).toHaveBeenCalled();
      
      const handlerConfig = mockNotifications.setNotificationHandler.mock.calls[0][0];
      expect(handlerConfig).toBeDefined();
      
      // Test the handler function
      const result = await handlerConfig.handleNotification();
      expect(result.shouldShowAlert).toBe(true);
      expect(result.shouldPlaySound).toBe(true);
      expect(result.shouldSetBadge).toBe(false);
    });

    it('should handle errors in bell listeners gracefully', async () => {
      const faultyListener = (notification: BellNotification) => {
        throw new Error('Listener error');
      };
      
      notificationManager.addBellListener(faultyListener);
      
      // Simulate notification that would trigger the faulty listener
      const mockNotifications = require('expo-notifications');
      const mockListener = mockNotifications.addNotificationReceivedListener.mock.calls[0][0];
      
      const mockNotification = {
        request: {
          content: {
            data: {
              type: 'bell',
              sessionId: testSessionName,
              sessionName: testSessionName,
              timestamp: new Date().toISOString(),
            },
            body: 'Error test',
          },
        },
      };
      
      // Should not throw despite faulty listener
      expect(() => mockListener(mockNotification)).not.toThrow();
      
      notificationManager.removeBellListener(faultyListener);
    });
  });

  describe('Performance and Reliability', () => {
    beforeEach(async () => {
      const config = {
        fcmEndpoint: testEnv.getMockFCMEndpoint(),
      };
      await notificationManager.initialize(config);
    });

    it('should handle rapid notification registration/unregistration', async () => {
      const sessionIds = Array.from({ length: 5 }, (_, i) => `rapid-test-${i}`);
      
      // Rapid registration
      const registrations = sessionIds.map(id =>
        notificationManager.registerForSessionNotifications(id, testEnv.getSSHConfig())
      );
      
      await Promise.all(registrations);
      
      // Rapid unregistration
      const unregistrations = sessionIds.map(id =>
        notificationManager.unregisterFromSessionNotifications(id)
      );
      
      await Promise.all(unregistrations);
      
      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should maintain notification state across multiple operations', async () => {
      const deviceToken = notificationManager.getDeviceToken();
      expect(deviceToken).toBeDefined();
      
      // Perform multiple operations
      await notificationManager.registerForSessionNotifications(
        testSessionName,
        testEnv.getSSHConfig()
      );
      
      await notificationManager.sendTestBellNotification({
        sessionId: testSessionName,
        sessionName: testSessionName,
        timestamp: new Date(),
      });
      
      await notificationManager.unregisterFromSessionNotifications(testSessionName);
      
      // Device token should remain the same
      expect(notificationManager.getDeviceToken()).toBe(deviceToken);
    });
  });
});
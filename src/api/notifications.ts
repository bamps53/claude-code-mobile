/**
 * Push notification API for Claude Code mobile client
 * Handles FCM/APNS token registration and notification processing
 */

import * as Notifications from 'expo-notifications';

export interface NotificationConfig {
  fcmEndpoint: string;
  serverKey?: string;
  deviceToken?: string;
}

export interface BellNotification {
  sessionId: string;
  sessionName: string;
  timestamp: Date;
  message?: string;
}

export class NotificationManager {
  private config: NotificationConfig | null = null;
  private deviceToken: string | null = null;
  private bellListeners: Array<(notification: BellNotification) => void> = [];

  /**
   * Initialize notification system and request permissions
   * @param config Notification configuration
   */
  async initialize(config: NotificationConfig): Promise<void> {
    this.config = config;

    // Request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Notification permissions not granted');
    }

    // Get push notification token
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      this.deviceToken = token.data;
    } catch (error) {
      throw new Error(`Failed to get push token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Set up notification handlers
    this.setupNotificationHandlers();
  }

  /**
   * Register device token with server monitoring service
   * @param sessionId Session ID to monitor
   * @param sshConfig SSH connection details for server monitoring
   */
  async registerForSessionNotifications(sessionId: string, sshConfig: any): Promise<void> {
    if (!this.config || !this.deviceToken) {
      throw new Error('Notification manager not initialized');
    }

    try {
      // In a real implementation, this would call a server endpoint
      // that sets up monitoring for the specific session
      const registrationData = {
        deviceToken: this.deviceToken,
        sessionId: sessionId,
        sshConfig: {
          host: sshConfig.host,
          port: sshConfig.port,
          username: sshConfig.username,
          // Don't send sensitive data like passwords/keys
        },
        platform: 'expo',
        timestamp: new Date().toISOString(),
      };

      // Mock registration with FCM endpoint
      const response = await fetch(`${this.config.fcmEndpoint}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.serverKey && { 'Authorization': `key=${this.config.serverKey}` }),
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      console.log(`Registered for notifications on session ${sessionId}`);
    } catch (error) {
      throw new Error(`Failed to register for notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Unregister device from session notifications
   * @param sessionId Session ID to stop monitoring
   */
  async unregisterFromSessionNotifications(sessionId: string): Promise<void> {
    if (!this.config || !this.deviceToken) {
      throw new Error('Notification manager not initialized');
    }

    try {
      const unregistrationData = {
        deviceToken: this.deviceToken,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${this.config.fcmEndpoint}/unregister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.serverKey && { 'Authorization': `key=${this.config.serverKey}` }),
        },
        body: JSON.stringify(unregistrationData),
      });

      if (!response.ok) {
        throw new Error(`Unregistration failed: ${response.statusText}`);
      }

      console.log(`Unregistered from notifications on session ${sessionId}`);
    } catch (error) {
      throw new Error(`Failed to unregister from notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Simulate sending a bell notification (for testing)
   * @param notification Bell notification data
   */
  async sendTestBellNotification(notification: BellNotification): Promise<void> {
    if (!this.config || !this.deviceToken) {
      throw new Error('Notification manager not initialized');
    }

    try {
      const notificationPayload = {
        to: this.deviceToken,
        title: `Claude Code - ${notification.sessionName}`,
        body: notification.message || 'Bell notification from terminal',
        data: {
          type: 'bell',
          sessionId: notification.sessionId,
          sessionName: notification.sessionName,
          timestamp: notification.timestamp.toISOString(),
        },
        priority: 'high',
        sound: 'default',
      };

      const response = await fetch(`${this.config.fcmEndpoint}/fcm/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.serverKey && { 'Authorization': `key=${this.config.serverKey}` }),
        },
        body: JSON.stringify(notificationPayload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }

      console.log('Test bell notification sent');
    } catch (error) {
      throw new Error(`Failed to send test notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add listener for bell notifications
   * @param listener Function to call when bell notification is received
   */
  addBellListener(listener: (notification: BellNotification) => void): void {
    this.bellListeners.push(listener);
  }

  /**
   * Remove bell notification listener
   * @param listener Function to remove
   */
  removeBellListener(listener: (notification: BellNotification) => void): void {
    this.bellListeners = this.bellListeners.filter(l => l !== listener);
  }

  /**
   * Get current device token
   */
  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  private setupNotificationHandlers(): void {
    // Handle notifications received while app is running
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      const data = notification.request.content.data;
      if (data && data.type === 'bell') {
        const bellNotification: BellNotification = {
          sessionId: data.sessionId,
          sessionName: data.sessionName,
          timestamp: new Date(data.timestamp),
          message: notification.request.content.body || undefined,
        };
        
        this.notifyBellListeners(bellNotification);
      }
    });

    // Handle notifications that user tapped on
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      if (data && data.type === 'bell') {
        const bellNotification: BellNotification = {
          sessionId: data.sessionId,
          sessionName: data.sessionName,
          timestamp: new Date(data.timestamp),
          message: response.notification.request.content.body || undefined,
        };
        
        this.notifyBellListeners(bellNotification);
        
        // TODO: Navigate to the specific session
        console.log(`User tapped notification for session: ${data.sessionName}`);
      }
    });

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  private notifyBellListeners(notification: BellNotification): void {
    this.bellListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in bell notification listener:', error);
      }
    });
  }
}
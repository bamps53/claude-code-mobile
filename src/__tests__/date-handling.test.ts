/**
 * Date handling tests
 * @description Tests for proper date serialization/deserialization in the app
 */

import { SSHConnection, TmuxSession } from '../types';

describe('Date Handling', () => {
  describe('ConnectionCard date formatting', () => {
    const formatDate = (date: Date | string | undefined): string => {
      if (!date) return 'Never';

      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return 'Invalid date';
        return dateObj.toLocaleDateString();
      } catch (error) {
        return 'Invalid date';
      }
    };

    it('should handle Date objects', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(testDate);
      expect(result).toBe(testDate.toLocaleDateString());
    });

    it('should handle date strings', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const result = formatDate(dateString);
      const expected = new Date(dateString).toLocaleDateString();
      expect(result).toBe(expected);
    });

    it('should handle undefined dates', () => {
      const result = formatDate(undefined);
      expect(result).toBe('Never');
    });

    it('should handle invalid date strings', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('Invalid date');
    });

    it('should handle null dates', () => {
      const result = formatDate(null as any);
      expect(result).toBe('Never');
    });
  });

  describe('SessionCard relative date formatting', () => {
    const formatRelativeDate = (date: Date | string | undefined): string => {
      if (!date) return 'Unknown';

      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return 'Invalid date';

        const now = new Date();
        const diffMs = now.getTime() - dateObj.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
          return `${diffMins}m ago`;
        } else if (diffHours < 24) {
          return `${diffHours}h ago`;
        } else {
          return `${diffDays}d ago`;
        }
      } catch (error) {
        return 'Invalid date';
      }
    };

    it('should format minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatRelativeDate(fiveMinutesAgo);
      expect(result).toBe('5m ago');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatRelativeDate(twoHoursAgo);
      expect(result).toBe('2h ago');
    });

    it('should format days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeDate(threeDaysAgo);
      expect(result).toBe('3d ago');
    });

    it('should handle string dates', () => {
      const dateString = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const result = formatRelativeDate(dateString);
      expect(result).toBe('30m ago');
    });

    it('should handle undefined dates', () => {
      const result = formatRelativeDate(undefined);
      expect(result).toBe('Unknown');
    });

    it('should handle invalid dates', () => {
      const result = formatRelativeDate('not-a-date');
      expect(result).toBe('Invalid date');
    });
  });

  describe('Type compatibility', () => {
    it('should handle SSHConnection with string lastConnected', () => {
      const connection: SSHConnection = {
        id: 'test-1',
        name: 'Test Server',
        host: 'localhost',
        port: 22,
        username: 'test',
        authType: 'password',
        lastConnected: '2024-01-15T10:30:00Z', // string from persistence
        isConnected: false,
      };

      expect(typeof connection.lastConnected).toBe('string');
    });

    it('should handle SSHConnection with Date lastConnected', () => {
      const connection: SSHConnection = {
        id: 'test-1',
        name: 'Test Server',
        host: 'localhost',
        port: 22,
        username: 'test',
        authType: 'password',
        lastConnected: new Date(), // Date in memory
        isConnected: false,
      };

      expect(connection.lastConnected).toBeInstanceOf(Date);
    });

    it('should handle TmuxSession with string dates', () => {
      const session: TmuxSession = {
        id: 'session-1',
        name: 'main',
        created: '2024-01-15T10:00:00Z', // string from persistence
        lastActivity: '2024-01-15T10:30:00Z', // string from persistence
        windowCount: 1,
        isActive: true,
        connectionId: 'conn-1',
      };

      expect(typeof session.created).toBe('string');
      expect(typeof session.lastActivity).toBe('string');
    });
  });
});

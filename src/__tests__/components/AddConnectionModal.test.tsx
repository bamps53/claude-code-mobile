/**
 * AddConnectionModal component tests
 * @description Tests for the SSH connection modal functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider, Portal } from 'react-native-paper';
import AddConnectionModal from '../../components/AddConnectionModal';
import { useAppStore } from '../../store';

// Mock the store
jest.mock('../../store', () => ({
  useAppStore: jest.fn(),
}));

describe('AddConnectionModal', () => {
  const mockAddConnection = jest.fn();
  const mockUpdateConnection = jest.fn();
  const mockTestConnection = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as jest.Mock).mockReturnValue({
      addConnection: mockAddConnection,
      updateConnection: mockUpdateConnection,
      testConnection: mockTestConnection,
    });
  });

  /**
   * Wraps component with required providers
   */
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <PaperProvider>
        {component}
        <Portal.Host />
      </PaperProvider>
    );
  };

  it('should render when visible is true', () => {
    const { getByText } = renderWithProviders(
      <AddConnectionModal visible={true} onDismiss={mockOnDismiss} />
    );

    expect(getByText('Add SSH Connection')).toBeTruthy();
  });

  it('should not render when visible is false', () => {
    const { queryByText } = renderWithProviders(
      <AddConnectionModal visible={false} onDismiss={mockOnDismiss} />
    );

    expect(queryByText('Add SSH Connection')).toBeNull();
  });

  it('should show edit title when editing a connection', () => {
    const editConnection = {
      id: '1',
      name: 'Test Server',
      host: 'test.com',
      port: 22,
      username: 'testuser',
      authType: 'password' as const,
      password: 'testpass',
      isConnected: false,
    };

    const { getByText } = renderWithProviders(
      <AddConnectionModal
        visible={true}
        onDismiss={mockOnDismiss}
        editConnection={editConnection}
      />
    );

    expect(getByText('Edit Connection')).toBeTruthy();
  });

  it('should call onDismiss when Cancel button is pressed', () => {
    const { getByText } = renderWithProviders(
      <AddConnectionModal visible={true} onDismiss={mockOnDismiss} />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('should validate required fields', async () => {
    const { getByText, getByTestId } = renderWithProviders(
      <AddConnectionModal visible={true} onDismiss={mockOnDismiss} />
    );

    // Try to save without filling fields
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(getByText('Connection name is required')).toBeTruthy();
      expect(getByText('Host is required')).toBeTruthy();
      expect(getByText('Username is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
    });
  });

  it('should switch between password and SSH key authentication', () => {
    const { getByText, getByLabelText, queryByLabelText } = renderWithProviders(
      <AddConnectionModal visible={true} onDismiss={mockOnDismiss} />
    );

    // Initially password field should be visible
    expect(getByLabelText('Password')).toBeTruthy();
    expect(queryByLabelText('Private Key')).toBeNull();

    // Switch to SSH key
    fireEvent.press(getByText('SSH Key'));

    // Now private key field should be visible
    expect(queryByLabelText('Password')).toBeNull();
    expect(getByLabelText('Private Key')).toBeTruthy();
  });
});

/**
 * Add/Edit Connection Modal
 * @description Modal form for creating and editing SSH connection profiles
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  RadioButton,
  Text,
  useTheme,
  ActivityIndicator,
  HelperText,
  Divider,
} from 'react-native-paper';
import { useAppStore } from '../store';
import { SSHConnection } from '../types';

interface AddConnectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  editConnection?: SSHConnection;
}

interface FormData {
  name: string;
  host: string;
  port: string;
  username: string;
  authType: 'password' | 'key';
  password: string;
  privateKey: string;
}

interface FormErrors {
  name?: string;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  privateKey?: string;
}

/**
 * Modal component for adding or editing SSH connections
 * @param visible - Whether the modal is visible
 * @param onDismiss - Callback when modal is dismissed
 * @param editConnection - Optional connection to edit
 * @returns React component with connection form modal
 */
export default function AddConnectionModal({
  visible,
  onDismiss,
  editConnection,
}: AddConnectionModalProps) {
  const theme = useTheme();
  const { addConnection, updateConnection, testConnection } = useAppStore();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    host: '',
    port: '22',
    username: '',
    authType: 'password',
    password: '',
    privateKey: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Initialize form data when editing
  useEffect(() => {
    if (editConnection) {
      setFormData({
        name: editConnection.name,
        host: editConnection.host,
        port: editConnection.port.toString(),
        username: editConnection.username,
        authType: editConnection.authType,
        password: editConnection.password || '',
        privateKey: editConnection.privateKey || '',
      });
    } else {
      setFormData({
        name: '',
        host: '',
        port: '22',
        username: '',
        authType: 'password',
        password: '',
        privateKey: '',
      });
    }
    setErrors({});
  }, [editConnection, visible]);

  /**
   * Validates form data and returns errors
   * @returns Object containing validation errors
   */
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Connection name is required';
    }

    if (!formData.host.trim()) {
      newErrors.host = 'Host is required';
    } else if (!/^[a-zA-Z0-9.-]+$/.test(formData.host)) {
      newErrors.host = 'Invalid host format';
    }

    const port = parseInt(formData.port);
    if (!formData.port || isNaN(port) || port < 1 || port > 65535) {
      newErrors.port = 'Port must be between 1 and 65535';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (formData.authType === 'password') {
      if (!formData.password.trim()) {
        newErrors.password = 'Password is required';
      }
    } else if (formData.authType === 'key') {
      if (!formData.privateKey.trim()) {
        newErrors.privateKey = 'Private key is required';
      } else if (
        !formData.privateKey.includes('-----BEGIN') ||
        !formData.privateKey.includes('-----END')
      ) {
        newErrors.privateKey = 'Invalid private key format';
      }
    }

    return newErrors;
  };

  /**
   * Tests the SSH connection with current form data
   */
  const handleTestConnection = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Alert.alert('Validation Error', 'Please fix the form errors before testing');
      return;
    }

    setIsTesting(true);
    setErrors({});

    try {
      const testConnectionData: SSHConnection = {
        id: 'test-connection',
        name: formData.name,
        host: formData.host,
        port: parseInt(formData.port),
        username: formData.username,
        authType: formData.authType,
        password: formData.authType === 'password' ? formData.password : undefined,
        privateKey: formData.authType === 'key' ? formData.privateKey : undefined,
        isConnected: false,
      };

      const success = await testConnection(testConnectionData);

      if (success) {
        Alert.alert('Connection Test', 'Connection successful! ✅');
      } else {
        Alert.alert(
          'Connection Test',
          'Connection failed. Please check your credentials and network.'
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Connection test failed';
      Alert.alert('Connection Test Failed', errorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const connectionData = {
        name: formData.name.trim(),
        host: formData.host.trim(),
        port: parseInt(formData.port),
        username: formData.username.trim(),
        authType: formData.authType,
        password: formData.authType === 'password' ? formData.password : undefined,
        privateKey: formData.authType === 'key' ? formData.privateKey : undefined,
      };

      if (editConnection) {
        updateConnection(editConnection.id, connectionData);
      } else {
        addConnection(connectionData);
      }

      onDismiss();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save connection';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates form field value
   * @param field - Field name to update
   * @param value - New field value
   */
  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing (only for fields that can have errors)
    if (field in errors && errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof FormErrors]: undefined }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <Card>
              <Card.Content>
                <Title style={styles.modalTitle}>
                  {editConnection ? 'Edit Connection' : 'Add SSH Connection'}
                </Title>

                <ScrollView
                  style={styles.formContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Connection Name */}
                  <TextInput
                    label="Connection Name"
                    value={formData.name}
                    onChangeText={value => updateField('name', value)}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.name}
                    autoCapitalize="words"
                  />
                  <HelperText type="error" visible={!!errors.name}>
                    {errors.name}
                  </HelperText>

                  {/* Host */}
                  <TextInput
                    label="Host"
                    value={formData.host}
                    onChangeText={value => updateField('host', value)}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.host}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="192.168.1.100 or myserver.com"
                  />
                  <HelperText type="error" visible={!!errors.host}>
                    {errors.host}
                  </HelperText>

                  {/* Port */}
                  <TextInput
                    label="Port"
                    value={formData.port}
                    onChangeText={value => updateField('port', value)}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.port}
                    keyboardType="numeric"
                    placeholder="22"
                  />
                  <HelperText type="error" visible={!!errors.port}>
                    {errors.port}
                  </HelperText>

                  {/* Username */}
                  <TextInput
                    label="Username"
                    value={formData.username}
                    onChangeText={value => updateField('username', value)}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.username}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <HelperText type="error" visible={!!errors.username}>
                    {errors.username}
                  </HelperText>

                  <Divider style={styles.divider} />

                  {/* Authentication Type */}
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Authentication Method
                  </Text>
                  <RadioButton.Group
                    onValueChange={value => updateField('authType', value)}
                    value={formData.authType}
                  >
                    <View style={styles.radioOption}>
                      <RadioButton value="password" />
                      <Text variant="bodyLarge" style={styles.radioLabel}>
                        Password
                      </Text>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="key" />
                      <Text variant="bodyLarge" style={styles.radioLabel}>
                        SSH Key
                      </Text>
                    </View>
                  </RadioButton.Group>

                  {/* Password Field */}
                  {formData.authType === 'password' && (
                    <>
                      <TextInput
                        label="Password"
                        value={formData.password}
                        onChangeText={value => updateField('password', value)}
                        mode="outlined"
                        style={styles.input}
                        error={!!errors.password}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <HelperText type="error" visible={!!errors.password}>
                        {errors.password}
                      </HelperText>
                    </>
                  )}

                  {/* Private Key Field */}
                  {formData.authType === 'key' && (
                    <>
                      <TextInput
                        label="Private Key"
                        value={formData.privateKey}
                        onChangeText={value => updateField('privateKey', value)}
                        mode="outlined"
                        style={[styles.input, styles.multilineInput]}
                        error={!!errors.privateKey}
                        multiline
                        numberOfLines={6}
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <HelperText type="error" visible={!!errors.privateKey}>
                        {errors.privateKey}
                      </HelperText>
                    </>
                  )}
                </ScrollView>
              </Card.Content>

              <Card.Actions style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={handleTestConnection}
                  disabled={isLoading || isTesting}
                  style={styles.testButton}
                >
                  {isTesting ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    'Test Connection'
                  )}
                </Button>

                <View style={styles.primaryActions}>
                  <Button mode="text" onPress={onDismiss} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    disabled={isLoading || isTesting}
                    style={styles.saveButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                    ) : editConnection ? (
                      'Update'
                    ) : (
                      'Save'
                    )}
                  </Button>
                </View>
              </Card.Actions>
            </Card>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    margin: 20,
    borderRadius: 8,
    width: '90%',
    maxHeight: '90%',
  },
  keyboardAvoid: {
    width: '100%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  formContainer: {
    maxHeight: 400,
  },
  input: {
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 120,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  radioLabel: {
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingTop: 16,
  },
  testButton: {
    marginBottom: 8,
  },
  primaryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  saveButton: {
    marginLeft: 8,
  },
});

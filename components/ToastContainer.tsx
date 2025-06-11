// components/ToastContainer.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useToast } from '../context/NotificationContext';

// Tipos para as props do Toast individual
interface ToastProps {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss: (id: string) => void;
}

// Cores para diferentes tipos de toast
const TOAST_COLORS = {
  success: {
    background: '#4CAF50',
    border: '#45a049',
    text: '#ffffff',
  },
  error: {
    background: '#f44336',
    border: '#da190b',
    text: '#ffffff',
  },
  warning: {
    background: '#ff9800',
    border: '#e68a00',
    text: '#ffffff',
  },
  info: {
    background: '#2196F3',
    border: '#0b7dda',
    text: '#ffffff',
  },
};

// Componente Toast individual
const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  type,
  action,
  onDismiss,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleDismiss = () => {
    // Animação de saída
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  };

  const colors = TOAST_COLORS[type];

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: colors.background,
          borderLeftColor: colors.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={handleDismiss}
        activeOpacity={0.8}
      >
        <View style={styles.toastTextContainer}>
          <Text style={[styles.toastTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {message && (
            <Text style={[styles.toastMessage, { color: colors.text }]} numberOfLines={2}>
              {message}
            </Text>
          )}
        </View>

        {action && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.text }]}
            onPress={() => {
              action.onPress();
              handleDismiss();
            }}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Botão X para fechar */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.closeButtonText, { color: colors.text }]}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Componente principal ToastContainer
const ToastContainer: React.FC = () => {
  const { toastNotifications, hideToast } = useToast();

  if (toastNotifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toastNotifications.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onDismiss={hideToast}
        />
      ))}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Ajuste conforme a altura da status bar + header
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  toastContainer: {
    minHeight: 60,
    backgroundColor: '#333',
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 18,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});

export default ToastContainer;
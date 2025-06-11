
import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
import { NotificationDto, NotificationService } from '../services/api';

// Tipos para notificações toast/in-app
interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // em milissegundos, undefined = não remove automaticamente
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Tipos para o estado das notificações
interface NotificationState {
  // Notificações do servidor
  notifications: NotificationDto[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Notificações toast/in-app
  toastNotifications: ToastNotification[];
}

// Tipos para as ações do reducer
type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: NotificationDto[] }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationDto }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'UPDATE_UNREAD_COUNT' }
  | { type: 'ADD_TOAST'; payload: ToastNotification }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_ALL_TOASTS' }
  | { type: 'CLEAR_STATE' };

// Tipos para o contexto
interface NotificationContextType {
  // Estado das notificações do servidor
  notifications: NotificationDto[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Estado das notificações toast
  toastNotifications: ToastNotification[];
  
  // Ações para notificações do servidor
  loadNotifications: (isRead?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // Ações para notificações toast
  showToast: (notification: Omit<ToastNotification, 'id'>) => string;
  hideToast: (toastId: string) => void;
  clearAllToasts: () => void;
  
  // Ações auxiliares para diferentes tipos de toast
  showSuccess: (title: string, message?: string, duration?: number) => string;
  showError: (title: string, message?: string, duration?: number) => string;
  showWarning: (title: string, message?: string, duration?: number) => string;
  showInfo: (title: string, message?: string, duration?: number) => string;
  
  // Utilitários
  clearError: () => void;
  clearState: () => void;
}

// Estado inicial
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  toastNotifications: [],
};

// Função para calcular count de não lidas
const calculateUnreadCount = (notifications: NotificationDto[]): number => {
  return notifications.filter(notification => !notification.isRead).length;
};

// Reducer para gerenciar o estado das notificações
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: calculateUnreadCount(action.payload),
        loading: false,
        error: null,
      };

    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: calculateUnreadCount(newNotifications),
      };

    case 'MARK_AS_READ':
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload 
          ? { ...notification, isRead: true }
          : notification
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: calculateUnreadCount(updatedNotifications),
        loading: false,
        error: null,
      };

    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(notification => ({
        ...notification,
        isRead: true,
      }));
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0,
        loading: false,
        error: null,
      };

    case 'UPDATE_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: calculateUnreadCount(state.notifications),
      };

    case 'ADD_TOAST':
      return {
        ...state,
        toastNotifications: [...state.toastNotifications, action.payload],
      };

    case 'REMOVE_TOAST':
      return {
        ...state,
        toastNotifications: state.toastNotifications.filter(toast => toast.id !== action.payload),
      };

    case 'CLEAR_ALL_TOASTS':
      return {
        ...state,
        toastNotifications: [],
      };

    case 'CLEAR_STATE':
      return initialState;

    default:
      return state;
  }
};

// Função para gerar ID único para toast
const generateToastId = (): string => {
  return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Criação do contexto
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Props do provider
interface NotificationProviderProps {
  children: ReactNode;
  autoRefreshInterval?: number; // em milissegundos, padrão 30 segundos
}

// Provider do contexto
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  autoRefreshInterval = 30000 
}) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Carregar notificações do servidor
  const loadNotifications = useCallback(async (isRead?: boolean): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const notifications = await NotificationService.getNotifications(isRead);
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar notificações';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Erro ao carregar notificações:', error);
    }
  }, []);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await NotificationService.markNotificationAsRead(notificationId);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao marcar notificação como lida';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }, []);

  // Marcar todas as notificações como lidas
  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await NotificationService.markAllNotificationsAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao marcar todas as notificações como lidas';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      throw error;
    }
  }, []);

  // Atualizar notificações
  const refreshNotifications = useCallback(async (): Promise<void> => {
    await loadNotifications();
  }, [loadNotifications]);

  // Mostrar toast personalizado
  const showToast = useCallback((notification: Omit<ToastNotification, 'id'>): string => {
    const toastId = generateToastId();
    const toast: ToastNotification = {
      ...notification,
      id: toastId,
    };

    dispatch({ type: 'ADD_TOAST', payload: toast });

    // Remove automaticamente após o tempo especificado
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: toastId });
      }, toast.duration);
    }

    return toastId;
  }, []);

  // Ocultar toast específico
  const hideToast = useCallback((toastId: string): void => {
    dispatch({ type: 'REMOVE_TOAST', payload: toastId });
  }, []);

  // Limpar todos os toasts
  const clearAllToasts = useCallback((): void => {
    dispatch({ type: 'CLEAR_ALL_TOASTS' });
  }, []);

  // Helpers para diferentes tipos de toast
  const showSuccess = useCallback((title: string, message?: string, duration: number = 4000): string => {
    return showToast({
      title,
      message: message || '',
      type: 'success',
      duration,
    });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, duration: number = 6000): string => {
    return showToast({
      title,
      message: message || '',
      type: 'error',
      duration,
    });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string, duration: number = 5000): string => {
    return showToast({
      title,
      message: message || '',
      type: 'warning',
      duration,
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string, duration: number = 4000): string => {
    return showToast({
      title,
      message: message || '',
      type: 'info',
      duration,
    });
  }, [showToast]);

  // Limpar erro
  const clearError = useCallback((): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Limpar estado completo
  const clearState = useCallback((): void => {
    dispatch({ type: 'CLEAR_STATE' });
  }, []);

  // Auto-refresh das notificações
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        refreshNotifications();
      }, autoRefreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, refreshNotifications]);

  // Carregar notificações na inicialização
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Valor do contexto
  const contextValue: NotificationContextType = {
    // Estado das notificações do servidor
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    
    // Estado das notificações toast
    toastNotifications: state.toastNotifications,
    
    // Ações para notificações do servidor
    loadNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    
    // Ações para notificações toast
    showToast,
    hideToast,
    clearAllToasts,
    
    // Helpers para toast
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Utilitários
    clearError,
    clearState,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook para usar o contexto
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotificationContext deve ser usado dentro de um NotificationProvider');
  }
  
  return context;
};

// Hook personalizado para notificações do servidor
export const useNotifications = () => {
  const context = useNotificationContext();
  
  return {
    // Estado básico
    notifications: context.notifications,
    unreadCount: context.unreadCount,
    loading: context.loading,
    error: context.error,
    
    // Operações
    loadNotifications: context.loadNotifications,
    markAsRead: context.markAsRead,
    markAllAsRead: context.markAllAsRead,
    refreshNotifications: context.refreshNotifications,
    
    // Utilitários
    clearError: context.clearError,
  };
};

// Hook personalizado para notificações toast
export const useToast = () => {
  const context = useNotificationContext();
  
  return {
    // Estado
    toastNotifications: context.toastNotifications,
    
    // Ações básicas
    showToast: context.showToast,
    hideToast: context.hideToast,
    clearAllToasts: context.clearAllToasts,
    
    // Helpers por tipo
    showSuccess: context.showSuccess,
    showError: context.showError,
    showWarning: context.showWarning,
    showInfo: context.showInfo,
  };
};

// Hook personalizado combinado (mais conveniente)
export const useNotificationSystem = () => {
  const context = useNotificationContext();
  
  return {
    // Notificações do servidor
    notifications: {
      list: context.notifications,
      unreadCount: context.unreadCount,
      loading: context.loading,
      error: context.error,
      load: context.loadNotifications,
      markAsRead: context.markAsRead,
      markAllAsRead: context.markAllAsRead,
      refresh: context.refreshNotifications,
    },
    
    // Toast notifications
    toast: {
      list: context.toastNotifications,
      show: context.showToast,
      hide: context.hideToast,
      clearAll: context.clearAllToasts,
      success: context.showSuccess,
      error: context.showError,
      warning: context.showWarning,
      info: context.showInfo,
    },
    
    // Utilitários
    clearError: context.clearError,
    clearState: context.clearState,
  };
};

export default NotificationContext;
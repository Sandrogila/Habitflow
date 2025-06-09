// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração base da API - ATUALIZE ESTAS URLs
const BASE_URL = process.env.NODE_ENV === 'development' 
    ? 'http://192.168.0.17:5071' // IP da máquina que roda o back-end
    : 'http://192.168.0.17:5071'; // Mesmo IP para produção local

// Tipos para as requisições e respostas
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
}

export interface LoggedInUserDto {
  token: string;
  user: UserDto;
}

export interface RegisteredUserDto {
  id: string;
  name: string;
  email: string;
  registrationDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Tipos para Categorias
export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color: string;
}

export interface UpdateCategoryDto {
  name: string;
  description?: string;
  color: string;
}

// Tipos para Hábitos
export interface HabitDto {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: CategoryDto;
  frequency: string;
  target?: string;
  color: string;
  createdAt: string;
  records?: HabitRecordDto[];
}

export interface CreateHabitDto {
  name: string;
  description?: string;
  categoryId?: string;
  frequency: string;
  target?: string;
  color: string;
}

export interface UpdateHabitDto {
  name: string;
  description?: string;
  categoryId?: string;
  frequency: string;
  target?: string;
  color: string;
}

// Tipos para Registros de Hábitos
export interface HabitRecordDto {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  note?: string;
  achievedValue?: number;
  createdAt: string;
}

export interface MarkHabitAsDoneDto {
  date: string;
  note?: string;
  achievedValue?: number;
}

export interface MarkHabitAsNotDoneDto {
  date: string;
  note?: string;
  achievedValue?: number;
}

// Tipos para Notificações
export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
}

// Instância do Axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@HabitFlow:token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao recuperar token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      await AsyncStorage.multiRemove(['@HabitFlow:token', '@HabitFlow:user']);
      // Aqui você pode redirecionar para a tela de login se necessário
    }
    return Promise.reject(error);
  }
);

// Classe do serviço de autenticação
export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoggedInUserDto> {
    try {
      const response = await api.post<LoggedInUserDto>('/auth/login', credentials);
      
      // Salvar token e dados do usuário no AsyncStorage
      await AsyncStorage.setItem('@HabitFlow:token', response.data.token);
      await AsyncStorage.setItem('@HabitFlow:user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 401) {
        throw new Error('Email ou senha incorretos');
      } else if (error.response?.status >= 500) {
        throw new Error('Erro interno do servidor. Tente novamente mais tarde.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Tempo limite da requisição. Verifique sua conexão.');
      } else if (error.message === 'Network Error') {
        throw new Error('Erro de conexão. Verifique sua internet.');
      }
      throw new Error('Erro inesperado ao fazer login');
    }
  }

  static async register(userData: RegisterRequest): Promise<RegisteredUserDto> {
    try {
      const response = await api.post<RegisteredUserDto>('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 400) {
        throw new Error('Dados inválidos. Verifique as informações.');
      } else if (error.response?.status === 409) {
        throw new Error('Este email já está cadastrado');
      } else if (error.response?.status >= 500) {
        throw new Error('Erro interno do servidor. Tente novamente mais tarde.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Tempo limite da requisição. Verifique sua conexão.');
      } else if (error.message === 'Network Error') {
        throw new Error('Erro de conexão. Verifique sua internet.');
      }
      throw new Error('Erro inesperado ao criar conta');
    }
  }

  static async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['@HabitFlow:token', '@HabitFlow:user']);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  static async getCurrentUser(): Promise<UserDto | null> {
    try {
      const userData = await AsyncStorage.getItem('@HabitFlow:user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao recuperar usuário atual:', error);
      return null;
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@HabitFlow:token');
    } catch (error) {
      console.error('Erro ao recuperar token:', error);
      return null;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('@HabitFlow:token');
      const user = await AsyncStorage.getItem('@HabitFlow:user');
      return !!(token && user);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  }
}

// Classe para serviços de Categorias
export class CategoryService {
  static async getCategories(): Promise<CategoryDto[]> {
    try {
      const response = await api.get<CategoryDto[]>('/categories');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error);
      throw new Error('Erro ao carregar categorias');
    }
  }

  static async createCategory(categoryData: CreateCategoryDto): Promise<CategoryDto> {
    try {
      const response = await api.post<CategoryDto>('/categories', categoryData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      throw new Error('Erro ao criar categoria');
    }
  }

  static async updateCategory(categoryId: string, categoryData: UpdateCategoryDto): Promise<CategoryDto> {
    try {
      const response = await api.put<CategoryDto>(`/categories/${categoryId}`, categoryData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error);
      throw new Error('Erro ao atualizar categoria');
    }
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      await api.delete(`/categories/${categoryId}`);
    } catch (error: any) {
      console.error('Erro ao deletar categoria:', error);
      throw new Error('Erro ao deletar categoria');
    }
  }
}

// Classe para serviços de Hábitos
export class HabitService {
  static async getHabits(): Promise<HabitDto[]> {
    try {
      const response = await api.get<HabitDto[]>('/habits');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar hábitos:', error);
      throw new Error('Erro ao carregar hábitos');
    }
  }

  static async getHabitById(habitId: string): Promise<HabitDto> {
    try {
      const response = await api.get<HabitDto>(`/habits/${habitId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar hábito:', error);
      if (error.response?.status === 404) {
        throw new Error('Hábito não encontrado');
      }
      throw new Error('Erro ao carregar hábito');
    }
  }

  static async createHabit(habitData: CreateHabitDto): Promise<HabitDto> {
    try {
      const response = await api.post<HabitDto>('/habits', habitData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar hábito:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 400) {
        throw new Error('Dados inválidos. Verifique as informações.');
      }
      throw new Error('Erro ao criar hábito');
    }
  }

  static async updateHabit(habitId: string, habitData: UpdateHabitDto): Promise<HabitDto> {
    try {
      const response = await api.put<HabitDto>(`/habits/${habitId}`, habitData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar hábito:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 404) {
        throw new Error('Hábito não encontrado');
      } else if (error.response?.status === 400) {
        throw new Error('Dados inválidos. Verifique as informações.');
      } else if (error.response?.status === 401) {
        throw new Error('Não autorizado - faça login novamente');
      }
      throw new Error('Erro ao atualizar hábito');
    }
  }

  static async deleteHabit(habitId: string): Promise<void> {
    try {
      await api.delete(`/habits/${habitId}`);
    } catch (error: any) {
      console.error('Erro ao deletar hábito:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 404) {
        throw new Error('Hábito não encontrado');
      } else if (error.response?.status === 401) {
        throw new Error('Não autorizado - faça login novamente');
      } else if (error.response?.status === 403) {
        throw new Error('Você não tem permissão para deletar este hábito');
      }
      throw new Error('Erro ao deletar hábito');
    }
  }

  static async markHabitAsDone(habitId: string, data: MarkHabitAsDoneDto): Promise<HabitRecordDto> {
    try {
      // Validar e formatar dados
      if (!data.date) {
        throw new Error('Data é obrigatória');
      }

      // Garantir que a data está no formato ISO correto
      let formattedDate: string;
      try {
        formattedDate = new Date(data.date).toISOString();
      } catch (dateError) {
        throw new Error('Formato de data inválido');
      }

      const requestData = {
        date: formattedDate,
        note: data.note || "feito",
        achievedValue: data.achievedValue || 1
      };

      console.log('Dados enviados para markHabitAsDone:', requestData);
      
      const response = await api.post<HabitRecordDto>(`/habits/${habitId}/records/done`, requestData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao marcar hábito como feito:', error);
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 400) {
        const errorDetails = error.response.data?.errors || error.response.data;
        console.error('Detalhes do erro 400:', errorDetails);
        throw new Error(`Dados inválidos: ${JSON.stringify(errorDetails)}`);
      } else if (error.response?.status === 404) {
        throw new Error('Hábito não encontrado');
      } else if (error.response?.status === 401) {
        throw new Error('Não autorizado - faça login novamente');
      }
      throw new Error('Erro ao marcar hábito como feito');
    }
  }

  static async markHabitAsNotDone(habitId: string, data: MarkHabitAsNotDoneDto): Promise<HabitRecordDto> {
    try {
      // Validar e formatar dados
      if (!data.date) {
        throw new Error('Data é obrigatória');
      }

      // Garantir que a data está no formato ISO correto
      let formattedDate: string;
      try {
        formattedDate = new Date(data.date).toISOString();
      } catch (dateError) {
        throw new Error('Formato de data inválido');
      }

      const requestData = {
        date: formattedDate,
        note: data.note || "desmarcado",
        achievedValue: data.achievedValue || 0
      };

      console.log('Dados enviados para markHabitAsNotDone:', requestData);
      
      const response = await api.post<HabitRecordDto>(`/habits/${habitId}/records/not-done`, requestData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao marcar hábito como não feito:', error);
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 400) {
        const errorDetails = error.response.data?.errors || error.response.data;
        console.error('Detalhes do erro 400:', errorDetails);
        throw new Error(`Dados inválidos: ${JSON.stringify(errorDetails)}`);
      } else if (error.response?.status === 404) {
        throw new Error('Hábito não encontrado');
      } else if (error.response?.status === 401) {
        throw new Error('Não autorizado - faça login novamente');
      }
      throw new Error('Erro ao marcar hábito como não feito');
    }
  }
}

// Classe para serviços de Notificações
export class NotificationService {
  static async getNotifications(isRead?: boolean): Promise<NotificationDto[]> {
    try {
      const params = isRead !== undefined ? { isRead } : {};
      const response = await api.get<NotificationDto[]>('/notifications', { params });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error);
      if (error.response?.status === 401) {
        throw new Error('Não autorizado - faça login novamente');
      }
      throw new Error('Erro ao carregar notificações');
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error);
      if (error.response?.status === 401) {
        throw new Error('Não autorizado - faça login novamente');
      } else if (error.response?.status === 404) {
        throw new Error('Notificação não encontrada');
      }
      throw new Error('Erro ao marcar notificação como lida');
    }
  }

  static async markAllNotificationsAsRead(): Promise<void> {
    try {
      await api.post('/notifications/mark-all-read');
    } catch (error: any) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      if (error.response?.status === 401) {
        throw new Error('Não autorizado - faça login novamente');
      }
      throw new Error('Erro ao marcar todas as notificações como lidas');
    }
  }
}

export default api;
// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração base da API - ATUALIZE ESTAS URLs
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://127.0.0.1:5071'  // Para desenvolvimento local
  : 'http://192.168.0.62:5071'; // Para dispositivos na rede
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

// Instância do Axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
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

// Classe para outros serviços da API (exemplo para hábitos)
export class HabitService {
  static async getHabits(): Promise<any[]> {
    try {
      const response = await api.get('/habits');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar hábitos:', error);
      throw new Error('Erro ao carregar hábitos');
    }
  }

  static async createHabit(habitData: any): Promise<any> {
    try {
      const response = await api.post('/habits', habitData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar hábito:', error);
      throw new Error('Erro ao criar hábito');
    }
  }

  static async updateHabit(habitId: string, habitData: any): Promise<any> {
    try {
      const response = await api.put(`/habits/${habitId}`, habitData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar hábito:', error);
      throw new Error('Erro ao atualizar hábito');
    }
  }

  static async deleteHabit(habitId: string): Promise<void> {
    try {
      await api.delete(`/habits/${habitId}`);
    } catch (error: any) {
      console.error('Erro ao deletar hábito:', error);
      throw new Error('Erro ao deletar hábito');
    }
  }
}

export default api;
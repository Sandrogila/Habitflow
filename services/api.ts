// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração da API - ajuste o IP conforme necessário
const API_BASE_URL = 'http://192.168.0.60:5071';

// Criar instância do axios com configurações específicas
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para adicionar logs de debug
api.interceptors.request.use(
  async (config) => {
    console.log('🚀 Fazendo requisição para:', config.url);
    console.log('📝 Dados:', config.data);
    
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    console.log('✅ Resposta recebida:', response.status, response.data);
    return response;
  },
  async (error) => {
    console.error('❌ Erro na resposta:', error);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Dados do erro:', error.response.data);
      console.error('📝 Headers:', error.response.headers);
    } else if (error.request) {
      console.error('📡 Erro de rede - sem resposta do servidor');
      console.error('🔗 Request:', error.request);
    } else {
      console.error('⚙️ Erro de configuração:', error.message);
    }
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userInfo');
    }
    return Promise.reject(error);
  }
);

// Tipos para as requisições
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
}

// Função para testar conectividade
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testando conexão com:', API_BASE_URL);
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Conexão OK:', response.status);
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão:', error);
    return false;
  }
};

// Serviços de autenticação
export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('📝 Tentando registrar usuário:', data.email);
      const response = await api.post('/auth/register', data);
      console.log('✅ Registro bem-sucedido');
      return response.data;
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      throw error;
    }
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔐 Tentando fazer login:', data.email);
      const response = await api.post('/auth/login', data);
      console.log('✅ Login bem-sucedido');
      return response.data;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  },

  async saveAuthData(authData: AuthResponse): Promise<void> {
    try {
      await AsyncStorage.setItem('authToken', authData.token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(authData.user));
      console.log('💾 Dados de auth salvos');
    } catch (error) {
      console.error('❌ Erro ao salvar dados de auth:', error);
      throw error;
    }
  },

  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userInfo');
      console.log('🗑️ Dados de auth removidos');
    } catch (error) {
      console.error('❌ Erro ao limpar dados de auth:', error);
    }
  },

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('❌ Erro ao obter token:', error);
      return null;
    }
  },

  async getUserInfo(): Promise<any | null> {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('❌ Erro ao obter info do usuário:', error);
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      return false;
    }
  }
};

export default api;
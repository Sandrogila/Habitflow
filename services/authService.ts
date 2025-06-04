import api from './api';

interface LoginResponse {
  token: string;
  email: string;
  userId: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

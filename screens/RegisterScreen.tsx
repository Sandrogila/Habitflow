// screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { AuthService, RegisterRequest } from '../services/api';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('register');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Nome é obrigatório';
    }

    if (name.trim().length < 2) {
      return 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!email.trim()) {
      return 'Email é obrigatório';
    }

    if (!validateEmail(email.trim())) {
      return 'Por favor, insira um email válido';
    }

    if (!password.trim()) {
      return 'Senha é obrigatória';
    }

    if (password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres';
    }

    if (!confirmPassword.trim()) {
      return 'Confirmação de senha é obrigatória';
    }

    if (password !== confirmPassword) {
      return 'As senhas não coincidem';
    }

    return null;
  };

  const handleRegister = async () => {
    // Validar formulário
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Erro', validationError);
      return;
    }

    setLoading(true);

    try {
      const registerData: RegisterRequest = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      };

      const response = await AuthService.register(registerData);
      
      // Registro bem-sucedido
      console.log('Registro realizado com sucesso:', response.name);
      
      Alert.alert(
        'Sucesso!', 
        `Conta criada com sucesso! Bem-vindo(a), ${response.name}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navegar para a tela de login para o usuário fazer login
              navigation.navigate('Login');
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Erro no registro:', error);
      Alert.alert('Erro no Cadastro', error.message || 'Erro inesperado ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const switchToLogin = () => {
    setActiveTab('login');
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <View style={styles.logoInner}>
                  <View style={styles.logoCenter} />
                </View>
              </View>
              <Text style={styles.appName}>HabitFlow</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'login' && styles.activeTab]}
                onPress={switchToLogin}
                disabled={loading}
              >
                <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                  Entrar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'register' && styles.activeTab]}
                disabled={loading}
              >
                <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
                  Cadastrar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <TextInput
                style={[styles.input, loading && styles.inputDisabled]}
                placeholder="Nome completo"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor="#C7C7CD"
                editable={!loading}
                autoCorrect={false}
              />

              <TextInput
                style={[styles.input, loading && styles.inputDisabled]}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholderTextColor="#C7C7CD"
                editable={!loading}
                autoCorrect={false}
              />

              <TextInput
                style={[styles.input, loading && styles.inputDisabled]}
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#C7C7CD"
                editable={!loading}
                autoCorrect={false}
              />

              <TextInput
                style={[styles.input, loading && styles.inputDisabled]}
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#C7C7CD"
                editable={!loading}
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.registerButtonText, { marginLeft: 8 }]}>
                      Criando conta...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.registerButtonText}>Cadastrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8E44AD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCenter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2E',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#8E44AD',
  },
  form: {
    flex: 1,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2C2C2E',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  registerButton: {
    backgroundColor: '#8E44AD',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default RegisterScreen;
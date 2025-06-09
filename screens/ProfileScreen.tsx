import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { AuthService, UserDto } from '../services/api';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Carregar dados do usuário ao montar o componente
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      // Se não conseguir carregar o usuário, redirecionar para login
      navigation.replace('Login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      await AuthService.logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao sair da conta. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Função para obter iniciais do nome
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const ProfileOption = ({ 
    title, 
    icon, 
    onPress, 
    showArrow = true, 
    backgroundColor = '#F3F4F6',
    textColor = '#1F2937',
    disabled = false
  }: {
    title: string;
    icon: string;
    onPress?: () => void;
    showArrow?: boolean;
    backgroundColor?: string;
    textColor?: string;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.optionCard, 
        { backgroundColor },
        disabled && styles.optionCardDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.optionLeft}>
        <Text style={styles.optionIcon}>{icon}</Text>
        <Text style={[styles.optionTitle, { color: textColor }]}>{title}</Text>
      </View>
      {showArrow && !disabled && (
        <Text style={[styles.arrow, { color: textColor }]}>›</Text>
      )}
      {disabled && (
        <ActivityIndicator size="small" color={textColor} />
      )}
    </TouchableOpacity>
  );

  const NotificationOption = ({ title, icon }: { title: string; icon: string }) => (
    <View style={styles.optionCard}>
      <View style={styles.optionLeft}>
        <Text style={styles.optionIcon}>{icon}</Text>
        <Text style={styles.optionTitle}>{title}</Text>
      </View>
      <Switch
        value={notificationsEnabled}
        onValueChange={setNotificationsEnabled}
        trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
        thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  // Mostrar loading enquanto carrega os dados
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>
              {currentUser ? getInitials(currentUser.name) : 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {currentUser?.name || 'Usuário'}
          </Text>
          <Text style={styles.profileEmail}>
            {currentUser?.email || ''}
          </Text>
          <Text style={styles.profileSubtitle}>Continue construindo seus hábitos</Text>
        </View>

        {/* Configurations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <View style={styles.optionsContainer}>
            <NotificationOption title="Notificações" icon="🔔" />
            <ProfileOption 
              title="Editar Perfil" 
              icon="👤" 
              onPress={() => {
                // Implementar navegação para edição de perfil
                Alert.alert('Em breve', 'Funcionalidade de edição de perfil será implementada em breve.');
              }} 
            />
            <ProfileOption 
              title={isLoggingOut ? "Saindo..." : "Sair da Conta"}
              icon="🚪" 
              onPress={handleLogout}
              backgroundColor="#FEE2E2"
              textColor="#DC2626"
              disabled={isLoggingOut}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre o App</Text>
          
          <View style={styles.optionsContainer}>
            <ProfileOption 
              title="Política de Privacidade" 
              icon="📋" 
              onPress={() => {
                Alert.alert('Em breve', 'Política de Privacidade será disponibilizada em breve.');
              }} 
            />
            <ProfileOption 
              title="Termos de Uso" 
              icon="📄" 
              onPress={() => {
                Alert.alert('Em breve', 'Termos de Uso serão disponibilizados em breve.');
              }} 
            />
            <ProfileOption 
              title="Avaliar App" 
              icon="⭐" 
              onPress={() => {
                Alert.alert('Obrigado!', 'Agradecemos seu interesse em avaliar o app.');
              }} 
            />
            <ProfileOption 
              title="Versão 1.0.0" 
              icon="ℹ️" 
              showArrow={false} 
              onPress={() => {}} 
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  arrow: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
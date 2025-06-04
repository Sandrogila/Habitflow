import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const ProfileOption = ({ 
    title, 
    icon, 
    onPress, 
    showArrow = true, 
    backgroundColor = '#F3F4F6',
    textColor = '#1F2937'
  }: {
    title: string;
    icon: string;
    onPress?: () => void;
    showArrow?: boolean;
    backgroundColor?: string;
    textColor?: string;
  }) => (
    <TouchableOpacity
      style={[styles.optionCard, { backgroundColor }]}
      onPress={onPress}
    >
      <View style={styles.optionLeft}>
        <Text style={styles.optionIcon}>{icon}</Text>
        <Text style={[styles.optionTitle, { color: textColor }]}>{title}</Text>
      </View>
      {showArrow && (
        <Text style={[styles.arrow, { color: textColor }]}>›</Text>
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
            <Text style={styles.avatarText}>D</Text>
          </View>
          <Text style={styles.profileName}>Délcio</Text>
          <Text style={styles.profileSubtitle}>Continue construindo seus hábitos</Text>
        </View>

        {/* Configurations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <View style={styles.optionsContainer}>
            <NotificationOption title="Notificações" icon="🔔" />
            <ProfileOption title="Perfil" icon="👤" onPress={() => {}} />
            <ProfileOption 
              title="Sair da Conta" 
              icon="🚪" 
              onPress={() => {}}
              backgroundColor="#FEE2E2"
              textColor="#DC2626"
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre o App</Text>
          
          <View style={styles.optionsContainer}>
            <ProfileOption title="Política de Privacidade" icon="📋" onPress={() => {}} />
            <ProfileOption title="Termos de Uso" icon="📄" onPress={() => {}} />
            <ProfileOption title="Avaliar App" icon="⭐" onPress={() => {}} />
            <ProfileOption title="Versão 1.0.0" icon="ℹ️" showArrow={false} onPress={() => {}} />
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
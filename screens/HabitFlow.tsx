import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type HabitFlowProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'HabitFlow'>;
};

const { width } = Dimensions.get('window');

const HabitFlow: React.FC<HabitFlowProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎯</Text>
          </View>
          <Text style={styles.title}>HabitFlow</Text>
          <Text style={styles.subtitle}>
            Transforme sua vida um hábito de cada vez
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Acompanhe seu progresso</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔔</Text>
            <Text style={styles.featureText}>Lembretes personalizados</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🏆</Text>
            <Text style={styles.featureText}>Conquiste seus objetivos</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>Criar Conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 60,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#667eea',
  },
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default HabitFlow;
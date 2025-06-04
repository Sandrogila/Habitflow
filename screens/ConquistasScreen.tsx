import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type ConquistasScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const ConquistasScreen: React.FC<ConquistasScreenProps> = ({ navigation }) => {
  const achievements = [
    {
      id: 1,
      title: 'Hidratado',
      description: 'bebeu água por 30 dias (150L)',
      icon: '💧',
      isCompleted: true,
      isStarred: true,
      color: '#FCD34D',
    },
    {
      id: 2,
      title: 'Leitor Dedicado',
      description: 'Conseguiu ler por 21 dias consecutivos',
      icon: '📚',
      isCompleted: true,
      isStarred: true,
      color: '#FCD34D',
    },
    {
      id: 3,
      title: 'Leitor Dedicado',
      description: 'Conseguiu ler por 21 dias consecutivos',
      icon: '📚',
      isCompleted: false,
      isStarred: false,
      color: '#D1D5DB',
    },
    {
      id: 4,
      title: 'Hidratado',
      description: 'bebeu água por 30 dias (150L)',
      icon: '💧',
      isCompleted: false,
      isStarred: false,
      color: '#D1D5DB',
    },
  ];

  const AchievementCard = ({ achievement }: { achievement: any }) => (
    <View style={[
      styles.achievementCard,
      { backgroundColor: achievement.isCompleted ? '#FEF3C7' : '#F3F4F6' }
    ]}>
      <View style={styles.achievementContent}>
        <View style={styles.achievementLeft}>
          <View style={[
            styles.achievementIcon,
            { backgroundColor: achievement.color }
          ]}>
            <Text style={styles.iconText}>{achievement.icon}</Text>
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[
              styles.achievementTitle,
              { color: achievement.isCompleted ? '#92400E' : '#6B7280' }
            ]}>
              {achievement.title}
            </Text>
            <Text style={[
              styles.achievementDescription,
              { color: achievement.isCompleted ? '#92400E' : '#6B7280' }
            ]}>
              {achievement.description}
            </Text>
          </View>
        </View>
        
        {achievement.isStarred && (
          <View style={styles.starContainer}>
            <Text style={styles.starIcon}>⭐</Text>
          </View>
        )}
      </View>
    </View>
  );

  const TabButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.appIcon}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>⚪</Text>
              </View>
              <Text style={styles.appName}>HabitFlow</Text>
            </View>
          </View>
          
          <Text style={styles.greeting}>Délcio, Fantástico!</Text>
          <Text style={styles.subtitle}>Continue construindo seus hábitos</Text>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TabButton title="Início" isActive={false} onPress={() => navigation.navigate('MainTabs')} />
          <TabButton title="Estatísticas" isActive={false} onPress={() => navigation.navigate('Reports')} />
          <TabButton title="Conquistas" isActive={true} onPress={() => {}} />
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conquistas</Text>
          
          <View style={styles.achievementsContainer}>
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Progresso Total</Text>
              <Text style={styles.summaryIcon}>🏆</Text>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>2</Text>
                <Text style={styles.summaryLabel}>Conquistadas</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>2</Text>
                <Text style={styles.summaryLabel}>Em Progresso</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>50%</Text>
                <Text style={styles.summaryLabel}>Completo</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Motivation Card */}
        <View style={styles.section}>
          <View style={styles.motivationCard}>
            <Text style={styles.motivationTitle}>Continue assim! 🚀</Text>
            <Text style={styles.motivationText}>
              Você está no caminho certo. Mais 2 conquistas te aguardam!
            </Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  appIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeTabButton: {
    backgroundColor: '#7C3AED',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  achievementContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
  },
  starContainer: {
    marginLeft: 12,
  },
  starIcon: {
    fontSize: 20,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryIcon: {
    fontSize: 24,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  motivationCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ConquistasScreen;
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
import { useHabits } from '../context/HabitContext';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { habits, toggleHabitCompletion, getHabitsForDate, getHabitStats } = useHabits();
  
  const today = new Date().toISOString().split('T')[0];
  const todayHabits = getHabitsForDate(today);
  const stats = getHabitStats();

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Saúde': '#2563EB', // Blue
      'Educação': '#16A34A', // Green
      'Exercício': '#EA580C', // Orange
      'health': '#2563EB',
      'learning': '#16A34A',
      'fitness': '#EA580C',
      'productivity': '#7C3AED',
      'mindfulness': '#DB2777',
      'social': '#0891B2',
      'creativity': '#DC2626',
      'other': '#6B7280',
    };
    return colors[category] || '#6B7280';
  };

  const HabitCard = ({ habit }: { habit: any }) => {
    const isCompleted = habit.completedDates.includes(today);
    const categoryColor = getCategoryColor(habit.category);
    
    return (
      <TouchableOpacity
        style={styles.habitCard}
        onPress={() => toggleHabitCompletion(habit.id, today)}
      >
        <View style={styles.habitCardContent}>
          <View style={styles.habitLeft}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
            <View style={styles.habitInfo}>
              <Text style={styles.habitName}>{habit.name}</Text>
              <Text style={[styles.habitCategory, { color: categoryColor }]}>
                {habit.category}
              </Text>
            </View>
          </View>
          
          <View style={styles.habitRight}>
            <TouchableOpacity
              style={[
                styles.checkButton,
                isCompleted && { backgroundColor: '#16A34A' }
              ]}
              onPress={() => toggleHabitCompletion(habit.id, today)}
            >
              {isCompleted && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{habit.streak}/8</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateHabit')}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.greeting}>Olá, Délcio!</Text>
          <Text style={styles.subtitle}>Continue construindo seus hábitos</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sequência Atual</Text>
            <Text style={styles.statNumber}>5 dias</Text>
          </View>
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={styles.successLabel}>Taxa de Sucesso</Text>
            <Text style={styles.successNumber}>86%</Text>
            <View style={styles.targetIcon}>
              <Text style={styles.targetText}>🎯</Text>
            </View>
          </View>
        </View>

        {/* Habits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hábitos de Hoje</Text>
          
          <View style={styles.habitsContainer}>
            {todayHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
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
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
  },
  successCard: {
    backgroundColor: '#16A34A',
    position: 'relative',
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  successLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  successNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  targetIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  targetText: {
    fontSize: 20,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  habitsContainer: {
    gap: 12,
  },
  habitCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  habitCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  habitCategory: {
    fontSize: 14,
    fontWeight: '500',
  },
  habitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default HomeScreen;
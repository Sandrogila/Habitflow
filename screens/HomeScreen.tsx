import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
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

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const HabitCard = ({ habit }: { habit: any }) => {
    const isCompleted = habit.completedDates.includes(today);
    
    return (
      <TouchableOpacity
        style={[styles.habitCard, isCompleted && styles.habitCardCompleted]}
        onPress={() => toggleHabitCompletion(habit.id, today)}
      >
        <View style={styles.habitCardContent}>
          <View style={styles.habitInfo}>
            <Text style={[styles.habitName, isCompleted && styles.habitNameCompleted]}>
              {habit.name}
            </Text>
            <Text style={[styles.habitCategory, isCompleted && styles.habitCategoryCompleted]}>
              {habit.category}
            </Text>
            {habit.time && (
              <Text style={[styles.habitTime, isCompleted && styles.habitTimeCompleted]}>
                {habit.time}
              </Text>
            )}
          </View>
          <View style={styles.habitActions}>
            <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
              {isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.streakContainer}>
              <Text style={[styles.streakNumber, isCompleted && styles.streakNumberCompleted]}>
                {habit.streak}
              </Text>
              <Text style={[styles.streakLabel, isCompleted && styles.streakLabelCompleted]}>
                dias
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Bom dia! 👋</Text>
          <Text style={styles.date}>{formatDate(today)}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Concluídos hoje</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalCompletionsThisWeek}</Text>
            <Text style={styles.statLabel}>Esta semana</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalHabits}</Text>
            <Text style={styles.statLabel}>Total de hábitos</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hábitos de hoje</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateHabit')}
            >
              <Text style={styles.addButtonText}>+ Novo</Text>
            </TouchableOpacity>
          </View>

          {todayHabits.length > 0 ? (
            <View style={styles.habitsContainer}>
              {todayHabits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎯</Text>
              <Text style={styles.emptyStateTitle}>Nenhum hábito para hoje</Text>
              <Text style={styles.emptyStateText}>
                Que tal criar seu primeiro hábito?
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('CreateHabit')}
              >
                <Text style={styles.emptyStateButtonText}>Criar Hábito</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  habitsContainer: {
    gap: 12,
  },
  habitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  habitCardCompleted: {
    backgroundColor: '#F0F9FF',
    borderColor: '#667eea',
    borderWidth: 1,
  },
  habitCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  habitNameCompleted: {
    color: '#667eea',
    textDecorationLine: 'line-through',
  },
  habitCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  habitCategoryCompleted: {
    color: '#667eea',
  },
  habitTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  habitTimeCompleted: {
    color: '#667eea',
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  streakContainer: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  streakNumberCompleted: {
    color: '#667eea',
  },
  streakLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  streakLabelCompleted: {
    color: '#667eea',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default HomeScreen;
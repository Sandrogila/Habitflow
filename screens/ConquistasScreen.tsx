import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

type ConquistasScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

// Tipos para as conquistas
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isCompleted: boolean;
  isStarred: boolean;
  color: string;
  progress: number;
  maxProgress: number;
  category: 'streak' | 'completion' | 'variety' | 'consistency' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Chaves para o AsyncStorage (mesmas das outras telas)
const STORAGE_KEYS = {
  HABIT_COMPLETIONS: '@HabitFlow:completions',
  LAST_RESET_DATE: '@HabitFlow:lastResetDate'
};

const ConquistasScreen: React.FC<ConquistasScreenProps> = ({ navigation }) => {
  const { habits, categories, getHabitsForDate } = useHabits();
  const [localCompletions, setLocalCompletions] = useState<Record<string, { completed: boolean, date: string }>>({});
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const today = new Date().toISOString().split('T')[0];

  // Função para carregar dados do AsyncStorage (igual às outras telas)
  const loadStorageData = async () => {
    try {
      const [completionsData, lastResetDate] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HABIT_COMPLETIONS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE)
      ]);

      // Verificar se precisa resetar (novo dia)
      const shouldReset = !lastResetDate || lastResetDate !== today;
      
      if (shouldReset) {
        console.log('Novo dia detectado, resetando completions');
        const currentCompletions = completionsData ? JSON.parse(completionsData) : {};
        
        const updatedCompletions: Record<string, { completed: boolean, date: string }> = {};
        
        Object.keys(currentCompletions).forEach(key => {
          const completion = currentCompletions[key];
          if (completion.date !== today) {
            updatedCompletions[key] = completion;
          }
        });
        
        setLocalCompletions(updatedCompletions);
        await AsyncStorage.setItem(STORAGE_KEYS.HABIT_COMPLETIONS, JSON.stringify(updatedCompletions));
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
      } else {
        const completions = completionsData ? JSON.parse(completionsData) : {};
        setLocalCompletions(completions);
      }
      
      setIsStorageLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar dados do storage:', error);
      setIsStorageLoaded(true);
    }
  };

  // Carregar dados do AsyncStorage
  useEffect(() => {
    loadStorageData();
  }, []);

  // Função para verificar se o hábito foi completado em uma data específica
  const isHabitCompletedOnDate = useCallback((habit: any, dateStr: string) => {
    const localKey = `${habit.id}-${dateStr}`;
    
    // Verificar primeiro no estado local (dados persistidos)
    if (localCompletions[localKey]) {
      return localCompletions[localKey].completed && localCompletions[localKey].date === dateStr;
    }

    // Se não tem no estado local, verificar os records do backend
    if (!habit.records || habit.records.length === 0) return false;
    
    const record = habit.records.find((record: any) => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === dateStr;
    });
    
    return record?.completed || false;
  }, [localCompletions]);

  // Função para determinar se um hábito deve aparecer em uma data
  const shouldHabitAppearOnDate = (habit: any, date: Date): boolean => {
    const dayOfWeek = date.getDay();
    
    switch (habit.frequency) {
      case 'daily':
        return true;
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'weekends':
        return dayOfWeek === 0 || dayOfWeek === 6;
      case 'weekly':
        return true;
      default:
        return true;
    }
  };

  // Calcular sequência atual
  const calculateCurrentStreak = useCallback((): number => {
    let currentStreak = 0;
    const currentDate = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const habitsForDate = getHabitsForDate(dateStr);
      let hasCompletedHabit = false;
      
      for (const habit of habitsForDate) {
        if (isHabitCompletedOnDate(habit, dateStr)) {
          hasCompletedHabit = true;
          break;
        }
      }
      
      if (hasCompletedHabit) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return currentStreak;
  }, [getHabitsForDate, isHabitCompletedOnDate]);

  // Calcular total de completions
  const calculateTotalCompletions = useCallback((): number => {
    let totalCompletions = 0;
    
    // Contar completions dos records do backend
    habits.forEach(habit => {
      if (habit.records && habit.records.length > 0) {
        totalCompletions += habit.records.filter((record: any) => record.completed).length;
      }
    });
    
    // Contar completions locais
    Object.values(localCompletions).forEach(completion => {
      if (completion.completed) {
        totalCompletions++;
      }
    });
    
    return totalCompletions;
  }, [habits, localCompletions]);

  // Calcular dias consecutivos perfeitos (todos os hábitos do dia completados)
  const calculatePerfectDays = useCallback((): number => {
    let perfectDays = 0;
    const currentDate = new Date();
    
    for (let i = 0; i < 30; i++) { // Últimos 30 dias
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const habitsForDate = getHabitsForDate(dateStr);
      if (habitsForDate.length === 0) continue;
      
      let allCompleted = true;
      for (const habit of habitsForDate) {
        if (!isHabitCompletedOnDate(habit, dateStr)) {
          allCompleted = false;
          break;
        }
      }
      
      if (allCompleted) {
        perfectDays++;
      }
    }
    
    return perfectDays;
  }, [getHabitsForDate, isHabitCompletedOnDate]);

  // Calcular variedade de categorias usadas
  const calculateCategoryVariety = useCallback((): number => {
    const usedCategories = new Set();
    
    habits.forEach(habit => {
      if (habit.categoryId) {
        usedCategories.add(habit.categoryId);
      }
    });
    
    return usedCategories.size;
  }, [habits]);

  // Definir todas as conquistas possíveis
  const allAchievements = useMemo((): Achievement[] => {
    if (!isStorageLoaded) return [];
    
    const currentStreak = calculateCurrentStreak();
    const totalCompletions = calculateTotalCompletions();
    const perfectDays = calculatePerfectDays();
    const categoryVariety = calculateCategoryVariety();
    const totalHabits = habits.length;
    
    return [
      // Conquistas de Sequência
      {
        id: 'streak_3',
        title: 'Consistente',
        description: 'Mantenha uma sequência de 3 dias',
        icon: '🔥',
        isCompleted: currentStreak >= 3,
        isStarred: currentStreak >= 3,
        color: currentStreak >= 3 ? '#F59E0B' : '#D1D5DB',
        progress: Math.min(currentStreak, 3),
        maxProgress: 3,
        category: 'streak',
        rarity: 'common'
      },
      {
        id: 'streak_7',
        title: 'Dedicado',
        description: 'Mantenha uma sequência de 7 dias',
        icon: '🔥',
        isCompleted: currentStreak >= 7,
        isStarred: currentStreak >= 7,
        color: currentStreak >= 7 ? '#F59E0B' : '#D1D5DB',
        progress: Math.min(currentStreak, 7),
        maxProgress: 7,
        category: 'streak',
        rarity: 'rare'
      },
      {
        id: 'streak_30',
        title: 'Imparável',
        description: 'Mantenha uma sequência de 30 dias',
        icon: '🔥',
        isCompleted: currentStreak >= 30,
        isStarred: currentStreak >= 30,
        color: currentStreak >= 30 ? '#F59E0B' : '#D1D5DB',
        progress: Math.min(currentStreak, 30),
        maxProgress: 30,
        category: 'streak',
        rarity: 'epic'
      },
      {
        id: 'streak_100',
        title: 'Lendário',
        description: 'Mantenha uma sequência de 100 dias',
        icon: '🏆',
        isCompleted: currentStreak >= 100,
        isStarred: currentStreak >= 100,
        color: currentStreak >= 100 ? '#8B5CF6' : '#D1D5DB',
        progress: Math.min(currentStreak, 100),
        maxProgress: 100,
        category: 'streak',
        rarity: 'legendary'
      },
      
      // Conquistas de Completions
      {
        id: 'complete_10',
        title: 'Começando',
        description: 'Complete 10 hábitos',
        icon: '✅',
        isCompleted: totalCompletions >= 10,
        isStarred: totalCompletions >= 10,
        color: totalCompletions >= 10 ? '#10B981' : '#D1D5DB',
        progress: Math.min(totalCompletions, 10),
        maxProgress: 10,
        category: 'completion',
        rarity: 'common'
      },
      {
        id: 'complete_50',
        title: 'Engajado',
        description: 'Complete 50 hábitos',
        icon: '✅',
        isCompleted: totalCompletions >= 50,
        isStarred: totalCompletions >= 50,
        color: totalCompletions >= 50 ? '#10B981' : '#D1D5DB',
        progress: Math.min(totalCompletions, 50),
        maxProgress: 50,
        category: 'completion',
        rarity: 'rare'
      },
      {
        id: 'complete_100',
        title: 'Centena',
        description: 'Complete 100 hábitos',
        icon: '💯',
        isCompleted: totalCompletions >= 100,
        isStarred: totalCompletions >= 100,
        color: totalCompletions >= 100 ? '#10B981' : '#D1D5DB',
        progress: Math.min(totalCompletions, 100),
        maxProgress: 100,
        category: 'completion',
        rarity: 'epic'
      },
      {
        id: 'complete_500',
        title: 'Incansável',
        description: 'Complete 500 hábitos',
        icon: '🌟',
        isCompleted: totalCompletions >= 500,
        isStarred: totalCompletions >= 500,
        color: totalCompletions >= 500 ? '#8B5CF6' : '#D1D5DB',
        progress: Math.min(totalCompletions, 500),
        maxProgress: 500,
        category: 'completion',
        rarity: 'legendary'
      },
      
      // Conquistas de Dias Perfeitos
      {
        id: 'perfect_1',
        title: 'Dia Perfeito',
        description: 'Complete todos os hábitos em 1 dia',
        icon: '⭐',
        isCompleted: perfectDays >= 1,
        isStarred: perfectDays >= 1,
        color: perfectDays >= 1 ? '#F59E0B' : '#D1D5DB',
        progress: Math.min(perfectDays, 1),
        maxProgress: 1,
        category: 'consistency',
        rarity: 'common'
      },
      {
        id: 'perfect_7',
        title: 'Semana Perfeita',
        description: 'Complete todos os hábitos por 7 dias',
        icon: '🌟',
        isCompleted: perfectDays >= 7,
        isStarred: perfectDays >= 7,
        color: perfectDays >= 7 ? '#8B5CF6' : '#D1D5DB',
        progress: Math.min(perfectDays, 7),
        maxProgress: 7,
        category: 'consistency',
        rarity: 'epic'
      },
      
      // Conquistas de Variedade
      {
        id: 'variety_3',
        title: 'Diversificado',
        description: 'Tenha hábitos em 3 categorias diferentes',
        icon: '🎨',
        isCompleted: categoryVariety >= 3,
        isStarred: categoryVariety >= 3,
        color: categoryVariety >= 3 ? '#3B82F6' : '#D1D5DB',
        progress: Math.min(categoryVariety, 3),
        maxProgress: 3,
        category: 'variety',
        rarity: 'rare'
      },
      {
        id: 'variety_5',
        title: 'Multifacetado',
        description: 'Tenha hábitos em 5 categorias diferentes',
        icon: '🌈',
        isCompleted: categoryVariety >= 5,
        isStarred: categoryVariety >= 5,
        color: categoryVariety >= 5 ? '#8B5CF6' : '#D1D5DB',
        progress: Math.min(categoryVariety, 5),
        maxProgress: 5,
        category: 'variety',
        rarity: 'epic'
      },
      
      // Conquistas de Marcos
      {
        id: 'habits_5',
        title: 'Colecionador',
        description: 'Crie 5 hábitos diferentes',
        icon: '📚',
        isCompleted: totalHabits >= 5,
        isStarred: totalHabits >= 5,
        color: totalHabits >= 5 ? '#10B981' : '#D1D5DB',
        progress: Math.min(totalHabits, 5),
        maxProgress: 5,
        category: 'milestone',
        rarity: 'common'
      },
      {
        id: 'habits_10',
        title: 'Ambicioso',
        description: 'Crie 10 hábitos diferentes',
        icon: '🎯',
        isCompleted: totalHabits >= 10,
        isStarred: totalHabits >= 10,
        color: totalHabits >= 10 ? '#F59E0B' : '#D1D5DB',
        progress: Math.min(totalHabits, 10),
        maxProgress: 10,
        category: 'milestone',
        rarity: 'rare'
      }
    ];
  }, [
    isStorageLoaded,
    calculateCurrentStreak,
    calculateTotalCompletions,
    calculatePerfectDays,
    calculateCategoryVariety,
    habits.length
  ]);

  // Filtrar conquistas por categoria
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return allAchievements;
    return allAchievements.filter(achievement => achievement.category === selectedCategory);
  }, [allAchievements, selectedCategory]);

  // Calcular estatísticas gerais
  const achievementStats = useMemo(() => {
    const completed = allAchievements.filter(a => a.isCompleted).length;
    const total = allAchievements.length;
    const inProgress = allAchievements.filter(a => !a.isCompleted && a.progress > 0).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      completed,
      total,
      inProgress,
      completionRate
    };
  }, [allAchievements]);

  // Componentes
  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
    
    return (
      <View style={[
        styles.achievementCard,
        { 
          backgroundColor: achievement.isCompleted ? '#FEF3C7' : '#F9FAFB',
          borderColor: achievement.isCompleted ? '#F59E0B' : '#E5E7EB'
        }
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
              <View style={styles.achievementHeader}>
                <Text style={[
                  styles.achievementTitle,
                  { color: achievement.isCompleted ? '#92400E' : '#6B7280' }
                ]}>
                  {achievement.title}
                </Text>
                {achievement.rarity !== 'common' && (
                  <View style={[
                    styles.rarityBadge,
                    { backgroundColor: getRarityColor(achievement.rarity) }
                  ]}>
                    <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.achievementDescription,
                { color: achievement.isCompleted ? '#92400E' : '#6B7280' }
              ]}>
                {achievement.description}
              </Text>
              
              {/* Barra de Progresso */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${progressPercentage}%`,
                        backgroundColor: achievement.isCompleted ? '#F59E0B' : '#7C3AED'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {achievement.progress}/{achievement.maxProgress}
                </Text>
              </View>
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
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const CategoryButton = ({ category, title, isActive, onPress }: { 
    category: string; 
    title: string; 
    isActive: boolean; 
    onPress: () => void 
  }) => (
    <TouchableOpacity
      style={[styles.categoryButton, isActive && styles.activeCategoryButton]}
      onPress={onPress}
    >
      <Text style={[styles.categoryButtonText, isActive && styles.activeCategoryButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
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

  // Loading state
  if (!isStorageLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando conquistas...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          
          <Text style={styles.greeting}>Fantástico! 🏆</Text>
          <Text style={styles.subtitle}>
            {achievementStats.completed} de {achievementStats.total} conquistas desbloqueadas
          </Text>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TabButton title="Início" isActive={false} onPress={() => navigation.navigate('MainTabs')} />
          <TabButton title="Estatísticas" isActive={false} onPress={() => navigation.navigate('Reports')} />
          <TabButton title="Conquistas" isActive={true} onPress={() => {}} />
        </View>

        {/* Progress Summary */}
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Progresso das Conquistas</Text>
              <Text style={styles.summaryIcon}>🏆</Text>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{achievementStats.completed}</Text>
                <Text style={styles.summaryLabel}>Conquistadas</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{achievementStats.inProgress}</Text>
                <Text style={styles.summaryLabel}>Em Progresso</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{achievementStats.completionRate}%</Text>
                <Text style={styles.summaryLabel}>Completo</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Category Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filtrar por Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
            <CategoryButton
              category="all"
              title="Todas"
              isActive={selectedCategory === 'all'}
              onPress={() => setSelectedCategory('all')}
            />
            <CategoryButton
              category="streak"
              title="Sequências"
              isActive={selectedCategory === 'streak'}
              onPress={() => setSelectedCategory('streak')}
            />
            <CategoryButton
              category="completion"
              title="Completions"
              isActive={selectedCategory === 'completion'}
              onPress={() => setSelectedCategory('completion')}
            />
            <CategoryButton
              category="consistency"
              title="Consistência"
              isActive={selectedCategory === 'consistency'}
              onPress={() => setSelectedCategory('consistency')}
            />
            <CategoryButton
              category="variety"
              title="Variedade"
              isActive={selectedCategory === 'variety'}
              onPress={() => setSelectedCategory('variety')}
            />
            <CategoryButton
              category="milestone"
              title="Marcos"
              isActive={selectedCategory === 'milestone'}
              onPress={() => setSelectedCategory('milestone')}
            />
          </ScrollView>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'Todas as Conquistas' : `Conquistas - ${selectedCategory}`}
          </Text>
          
          <View style={styles.achievementsContainer}>
            {filteredAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>

        {/* Motivation Card */}
        <View style={styles.section}>
          <View style={styles.motivationCard}>
            <Text style={styles.motivationTitle}>Continue assim! 🚀</Text>
            <Text style={styles.motivationText}>
              {achievementStats.completed === 0 
                ? 'Suas primeiras conquistas estão esperando por você!'
                : achievementStats.inProgress > 0
                ? `Você tem ${achievementStats.inProgress} conquistas em progresso. Continue assim!`
                : 'Parabéns! Você está dominando suas conquistas!'
              }
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
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#7C3AED',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeCategoryButtonText: {
    color: '#FFFFFF',
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  achievementContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  achievementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIconText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  starContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
  },
  starIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryIcon: {
    fontSize: 24,
    color: '#7C3AED',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  motivationCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  
});

export default ConquistasScreen;
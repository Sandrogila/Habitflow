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

type ReportsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

// Definindo tipos para melhor type safety
interface ChartDataItem {
  day: string;
  height: number;
  completed: number;
  fullDayName: string;
}

interface CategoryStat {
  name: string;
  color: string;
  count: number;
}

interface WeeklyStats {
  totalCompletions: number;
  successRate: number;
  currentStreak: number;
  totalActiveHabits: number;
}

// Chaves para o AsyncStorage (mesmas da HomeScreen)
const STORAGE_KEYS = {
  HABIT_COMPLETIONS: '@HabitFlow:completions',
  LAST_RESET_DATE: '@HabitFlow:lastResetDate'
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const { habits, categories, getHabitsForDate } = useHabits();
  const [localCompletions, setLocalCompletions] = useState<Record<string, { completed: boolean, date: string }>>({});
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];

  // Função para carregar dados do AsyncStorage (igual à HomeScreen)
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
        console.log('Dados carregados do storage:', Object.keys(completions).length, 'completions');
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
  
  // Gerar dados do gráfico dos últimos 7 dias (aprimorado)
  const chartData = useMemo((): ChartDataItem[] => {
    if (!isStorageLoaded) return [];
    
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayAbbrevs = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const last7Days: ChartDataItem[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];
      const dayAbbrev = dayAbbrevs[date.getDay()];
      
      // Contar hábitos completados neste dia
      let completedCount = 0;
      let totalHabitsForDay = 0;
      
      habits.forEach(habit => {
        if (shouldHabitAppearOnDate(habit, date)) {
          totalHabitsForDay++;
          if (isHabitCompletedOnDate(habit, dateStr)) {
            completedCount++;
          }
        }
      });
      
      last7Days.push({
        day: dayAbbrev,
        height: Math.max(20, completedCount * 25), // Altura baseada nos hábitos completados
        completed: completedCount,
        fullDayName: dayName
      });
    }
    
    return last7Days;
  }, [habits, isStorageLoaded, localCompletions, isHabitCompletedOnDate]);

  // Agrupar hábitos por categoria (melhorado)
  const categoryStats = useMemo((): CategoryStat[] => {
    const categoryCount: { [key: string]: CategoryStat } = {};
    
    habits.forEach(habit => {
      if (habit.categoryId) {
        const category = categories.find(c => c.id === habit.categoryId);
        if (category) {
          if (!categoryCount[category.id]) {
            categoryCount[category.id] = {
              name: category.name,
              color: category.color,
              count: 0
            };
          }
          categoryCount[category.id].count++;
        }
      } else {
        // Hábitos sem categoria
        if (!categoryCount['uncategorized']) {
          categoryCount['uncategorized'] = {
            name: 'Sem categoria',
            color: '#6B7280',
            count: 0
          };
        }
        categoryCount['uncategorized'].count++;
      }
    });
    
    return Object.values(categoryCount).sort((a, b) => b.count - a.count);
  }, [habits, categories]);

  // Função para contar completions em um período
  const countCompletionsInPeriod = useCallback((startDate: Date, endDate: Date) => {
    let totalCompletions = 0;
    let totalPossible = 0;
    
    habits.forEach(habit => {
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (shouldHabitAppearOnDate(habit, currentDate)) {
          totalPossible++;
          const dateStr = currentDate.toISOString().split('T')[0];
          if (isHabitCompletedOnDate(habit, dateStr)) {
            totalCompletions++;
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    
    return { totalCompletions, totalPossible };
  }, [habits, isHabitCompletedOnDate]);

  // Calcular estatísticas da semana (melhorado)
  const weeklyStats = useMemo((): WeeklyStats => {
    if (!isStorageLoaded) {
      return {
        totalCompletions: 0,
        successRate: 0,
        currentStreak: 0,
        totalActiveHabits: 0
      };
    }
    
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date();
    endOfWeek.setHours(23, 59, 59, 999);
    
    const { totalCompletions, totalPossible } = countCompletionsInPeriod(startOfWeek, endOfWeek);
    
    // Calcular sequência atual
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
    
    const successRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
    
    return {
      totalCompletions,
      successRate,
      currentStreak,
      totalActiveHabits: habits.length
    };
  }, [habits, getHabitsForDate, isStorageLoaded, countCompletionsInPeriod, isHabitCompletedOnDate]);

  // Calcular estatísticas mensais
  const monthlyStats = useMemo(() => {
    if (!isStorageLoaded) return { completions: 0, successRate: 0 };
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    const { totalCompletions, totalPossible } = countCompletionsInPeriod(startOfMonth, endOfMonth);
    const successRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
    
    return {
      completions: totalCompletions,
      successRate
    };
  }, [countCompletionsInPeriod, isStorageLoaded]);

  // Obter o melhor dia da semana
  const getBestDay = (): { day: string; count: number } => {
    if (chartData.length === 0) return { day: 'Nenhum', count: 0 };
    
    const bestDay = chartData.reduce((best, current) => 
      current.completed > best.completed ? current : best
    );
    
    return {
      day: bestDay.fullDayName,
      count: bestDay.completed
    };
  };

  // Obter categoria mais ativa
  const getMostActiveCategory = (): { name: string; count: number } => {
    if (categoryStats.length === 0) return { name: 'Nenhuma', count: 0 };
    
    const mostActive = categoryStats.reduce((max, cat) => 
      cat.count > max.count ? cat : max
    );
    
    return {
      name: mostActive.name,
      count: mostActive.count
    };
  };

  // Componentes
  const ChartBar = ({ day, height, completed, fullDayName }: ChartDataItem) => (
    <View style={styles.chartBarContainer}>
      <View style={[styles.chartBar, { height: Math.max(height, 20) }]} />
      <Text style={styles.chartDay}>{day}</Text>
    </View>
  );

  const CategoryItem = ({ name, color, count }: CategoryStat) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryLeft}>
        <View style={[styles.categoryDot, { backgroundColor: color }]} />
        <Text style={styles.categoryName}>{name}</Text>
      </View>
      <Text style={styles.categoryCount}>
        {count} {count === 1 ? 'hábito' : 'hábitos'}
      </Text>
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

  // Loading state
  if (!isStorageLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando estatísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const bestDay = getBestDay();
  const mostActiveCategory = getMostActiveCategory();

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
          <Text style={styles.headerTitle}>Estatísticas</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TabButton title="Início" isActive={false} onPress={() => navigation.navigate('MainTabs')} />
          <TabButton title="Estatísticas" isActive={true} onPress={() => {}} />
          <TabButton title="Conquistas" isActive={false} onPress={() => navigation.navigate('Conquistas')} />
        </View>

        {/* Progress Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progresso dos Últimos 7 Dias</Text>
          
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {chartData.map((item, index) => (
                <ChartBar 
                  key={index} 
                  day={item.day} 
                  height={item.height} 
                  completed={item.completed}
                  fullDayName={item.fullDayName}
                />
              ))}
            </View>
            <Text style={styles.chartSubtitle}>
              Hábitos completados por dia
            </Text>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hábitos por Categoria</Text>
          
          <View style={styles.categoriesContainer}>
            {categoryStats.length > 0 ? (
              categoryStats.map((category, index) => (
                <CategoryItem
                  key={index}
                  name={category.name}
                  color={category.color}
                  count={category.count}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhum hábito cadastrado ainda</Text>
            )}
          </View>
        </View>

        {/* Enhanced Weekly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas da Semana</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.totalCompletions}</Text>
              <Text style={styles.statLabel}>Hábitos Completados</Text>
            </View>
            
            <View style={[styles.statCard, styles.successRateCard]}>
              <Text style={[styles.statNumber, styles.successRateNumber]}>{weeklyStats.successRate}%</Text>
              <Text style={styles.statLabel}>Taxa de Sucesso</Text>
            </View>
            
            <View style={[styles.statCard, styles.streakCard]}>
              <Text style={[styles.statNumber, styles.streakNumber]}>{weeklyStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Sequência Atual</Text>
              <Text style={styles.streakIcon}>🔥</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.totalActiveHabits}</Text>
              <Text style={styles.statLabel}>Hábitos Ativos</Text>
            </View>
          </View>
        </View>

        {/* Monthly Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Mês</Text>
          
          <View style={styles.monthlyContainer}>
            <View style={styles.monthlyCard}>
              <Text style={styles.monthlyNumber}>{monthlyStats.completions}</Text>
              <Text style={styles.monthlyLabel}>Completions este mês</Text>
            </View>
            <View style={[styles.monthlyCard, styles.monthlySuccessCard]}>
              <Text style={[styles.monthlyNumber, styles.monthlySuccessNumber]}>{monthlyStats.successRate}%</Text>
              <Text style={styles.monthlyLabel}>Taxa de sucesso mensal</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Insights Section */}
        {habits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights Pessoais</Text>
            
            <View style={styles.insightsContainer}>
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>📊</Text>
                  <Text style={styles.insightTitle}>Melhor Dia da Semana</Text>
                </View>
                <Text style={styles.insightText}>{bestDay.day}</Text>
                <Text style={styles.insightSubtext}>
                  {bestDay.count} {bestDay.count === 1 ? 'hábito completado' : 'hábitos completados'} em média
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>🎯</Text>
                  <Text style={styles.insightTitle}>Categoria Mais Ativa</Text>
                </View>
                <Text style={styles.insightText}>{mostActiveCategory.name}</Text>
                <Text style={styles.insightSubtext}>
                  {mostActiveCategory.count} {mostActiveCategory.count === 1 ? 'hábito' : 'hábitos'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Progress Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo de Progresso</Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>🚀 Continue assim!</Text>
              <Text style={styles.summaryText}>
                Você completou {weeklyStats.totalCompletions} hábitos esta semana com uma taxa de sucesso de {weeklyStats.successRate}%.
                {weeklyStats.currentStreak > 0 && ` Sua sequência atual é de ${weeklyStats.currentStreak} dias!`}
              </Text>
            </View>
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 12,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 24,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    marginBottom: 8,
  },
  chartDay: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  categoriesContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  successRateCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  streakCard: {
    backgroundColor: '#FEF3E2',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  successRateNumber: {
    color: '#16A34A',
  },
  streakNumber: {
    color: '#EA580C',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  streakIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
  },
  monthlyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  monthlyCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  monthlySuccessCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  monthlyNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  monthlySuccessNumber: {
    color: '#2563EB',
  },
  monthlyLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  insightText: {
    fontSize: 18,
    color: '#7C3AED',
    fontWeight: '600',
    marginBottom: 4,
  },
  insightSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default ReportsScreen;
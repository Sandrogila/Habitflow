import React, { useMemo } from 'react';
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

type ReportsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

// Definindo tipos para melhor type safety
interface ChartDataItem {
  day: string;
  height: number;
  completed: number;
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

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const { habits, categories } = useHabits();
  
  // Função auxiliar para determinar se um hábito deve aparecer em uma data
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
        return true; // Assumindo que pode ser qualquer dia da semana
      default:
        return true;
    }
  };
  
  // Gerar dados do gráfico dos últimos 7 dias
  const chartData = useMemo((): ChartDataItem[] => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const last7Days: ChartDataItem[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];
      
      // Contar hábitos completados neste dia
      let completedCount = 0;
      habits.forEach(habit => {
        const record = habit.records?.find(r => 
          r.date.split('T')[0] === dateStr && r.completed
        );
        if (record) completedCount++;
      });
      
      last7Days.push({
        day: dayName.charAt(0), // Primeira letra do dia
        height: Math.max(20, completedCount * 20), // Altura baseada nos hábitos completados
        completed: completedCount
      });
    }
    
    return last7Days;
  }, [habits]);

  // Agrupar hábitos por categoria
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
    
    return Object.values(categoryCount);
  }, [habits, categories]);

  // Calcular estatísticas da semana
  const weeklyStats = useMemo((): WeeklyStats => {
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    
    let totalCompletions = 0;
    let totalPossibleCompletions = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    let maxStreak = 0;
    
    // Calcular total de conclusões na semana
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      let dayCompletions = 0;
      let dayPossible = 0;
      
      habits.forEach(habit => {
        // Verificar se o hábito deve aparecer neste dia
        if (shouldHabitAppearOnDate(habit, date)) {
          dayPossible++;
          const record = habit.records?.find(r => 
            r.date.split('T')[0] === dateStr && r.completed
          );
          if (record) {
            dayCompletions++;
          }
        }
      });
      
      totalCompletions += dayCompletions;
      totalPossibleCompletions += dayPossible;
      
      // Calcular sequência
      if (dayCompletions === dayPossible && dayPossible > 0) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
        if (dateStr === today) {
          currentStreak = tempStreak;
        }
      } else {
        if (dateStr === today) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }
    }
    
    const successRate = totalPossibleCompletions > 0 
      ? Math.round((totalCompletions / totalPossibleCompletions) * 100)
      : 0;
    
    return {
      totalCompletions,
      successRate,
      currentStreak: Math.max(currentStreak, maxStreak),
      totalActiveHabits: habits.length
    };
  }, [habits, shouldHabitAppearOnDate]);

  // Função para mapear letras dos dias para nomes completos
  const getDayName = (dayLetter: string): string => {
    const dayMap: { [key: string]: string } = {
      'D': 'Domingo',
      'Sg': 'Segunda',
      'T': 'Terça',
      'Qa': 'Quarta',
      'Qi': 'Quinta',
      'Se': 'Sexta',
      'Sa': 'Sábado'
    };
    return dayMap[dayLetter] || 'Desconhecido';
  };

  // Função melhorada para obter o melhor dia
  const getBestDay = (): string => {
    if (chartData.length === 0) return 'Nenhum';
    
    const bestDay = chartData.reduce((best, current) => 
      current.completed > best.completed ? current : best
    );
    
    // Mapear corretamente baseado no índice
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayIndex = chartData.indexOf(bestDay);
    return days[dayIndex] || 'Desconhecido';
  };

  const ChartBar = ({ day, height, completed }: { day: string; height: number; completed: number }) => (
    <View style={styles.chartBarContainer}>
      <View style={[styles.chartBar, { height: Math.max(height, 20) }]} />
      <Text style={styles.chartDay}>{day}</Text>
    </View>
  );

  const CategoryItem = ({ name, color, count }: { name: string; color: string; count: number }) => (
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

        {/* Weekly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas da Semana</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.totalCompletions}</Text>
              <Text style={styles.statLabel}>Hábitos Completados</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.successRate}%</Text>
              <Text style={styles.statLabel}>Taxa de Sucesso</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Sequência Atual</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{weeklyStats.totalActiveHabits}</Text>
              <Text style={styles.statLabel}>Hábitos Ativos</Text>
            </View>
          </View>
        </View>

        {/* Insights Section */}
        {habits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            
            <View style={styles.insightsContainer}>
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>Melhor Dia da Semana</Text>
                <Text style={styles.insightText}>
                  {getBestDay()}
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>Categoria Mais Ativa</Text>
                <Text style={styles.insightText}>
                  {categoryStats.length > 0 
                    ? categoryStats.reduce((max, cat) => 
                        cat.count > max.count ? cat : max
                      ).name
                    : 'Nenhuma'
                  }
                </Text>
              </View>
            </View>
          </View>
        )}
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
    width: 20,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
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
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
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
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '500',
  },
});

export default ReportsScreen;
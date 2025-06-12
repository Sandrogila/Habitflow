import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useHabits } from '../context/HabitContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Chaves para o AsyncStorage (mesmas da HomeScreen e ReportsScreen)
const STORAGE_KEYS = {
  HABIT_COMPLETIONS: '@HabitFlow:completions',
  LAST_RESET_DATE: '@HabitFlow:lastResetDate'
};

const CalendarScreen: React.FC = () => {
  const { habits, getHabitsForDate } = useHabits();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localCompletions, setLocalCompletions] = useState<Record<string, { completed: boolean, date: string }>>({});
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];

  // Função para carregar dados do AsyncStorage
  const loadStorageData = useCallback(async () => {
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
  }, [today]);

  // Carregar dados do AsyncStorage
  useEffect(() => {
    loadStorageData();
  }, [loadStorageData]);

  // Função para determinar se um hábito deve aparecer em uma data
  const shouldHabitAppearOnDate = useCallback((habit: any, date: Date): boolean => {
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

  // Função para obter hábitos filtrados por data considerando frequência
  const getFilteredHabitsForDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return habits.filter(habit => shouldHabitAppearOnDate(habit, date));
  }, [habits, shouldHabitAppearOnDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Dias em branco no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  // Taxa de conclusão melhorada usando dados persistidos
  const getCompletionRate = useCallback((dateStr: string) => {
    if (!isStorageLoaded) return 0;
    
    const habitsForDate = getFilteredHabitsForDate(dateStr);
    if (habitsForDate.length === 0) return 0;
    
    const completedCount = habitsForDate.filter(habit => 
      isHabitCompletedOnDate(habit, dateStr)
    ).length;
    
    return completedCount / habitsForDate.length;
  }, [isStorageLoaded, getFilteredHabitsForDate, isHabitCompletedOnDate]);

  const formatDateString = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate.toDateString() === today.toDateString();
  };

  const getCompletionStyle = (completionRate: number) => {
    if (completionRate === 0) return null;
    if (completionRate <= 0.33) return styles.lowCompletion;
    if (completionRate <= 0.66) return styles.mediumCompletion;
    return styles.highCompletion;
  };

  // Estatísticas do mês atual
  const monthlyStats = useMemo(() => {
    if (!isStorageLoaded) return { totalDays: 0, completedDays: 0, averageRate: 0 };
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;
    
    let totalCompletions = 0;
    let totalPossible = 0;
    let daysWithActivity = 0;
    
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = formatDateString(day);
      const habitsForDate = getFilteredHabitsForDate(dateStr);
      
      if (habitsForDate.length > 0) {
        daysWithActivity++;
        const completedCount = habitsForDate.filter(habit => 
          isHabitCompletedOnDate(habit, dateStr)
        ).length;
        
        totalCompletions += completedCount;
        totalPossible += habitsForDate.length;
      }
    }
    
    const averageRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
    
    return {
      totalDays: daysWithActivity,
      completedDays: Math.round((totalCompletions / Math.max(totalPossible / daysWithActivity, 1)) * daysWithActivity),
      averageRate,
      totalCompletions,
      totalPossible
    };
  }, [currentMonth, isStorageLoaded, getFilteredHabitsForDate, isHabitCompletedOnDate]);

  const renderCalendarDay = (day: number | null, index: number) => {
    if (!day) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const dateStr = formatDateString(day);
    const completionRate = getCompletionRate(dateStr);
    const isSelected = dateStr === selectedDate;
    const todayCheck = isToday(day);
    const habitsCount = getFilteredHabitsForDate(dateStr).length;

    let dayStyle = [styles.calendarDay];
    let textStyle = [styles.calendarDayText];

    // Aplicar estilos baseados no estado
    if (isSelected) {
      dayStyle = [{ ...styles.calendarDay, ...styles.selectedDay }];
      textStyle.push(styles.selectedDayText);
    }
    
    if (todayCheck) {
      dayStyle = [{ ...styles.calendarDay, ...(isSelected ? styles.selectedDay : {}), ...styles.today }];
    }

    // Aplicar cor de fundo baseada na taxa de conclusão
    const completionStyle = getCompletionStyle(completionRate);
    if (completionStyle && !isSelected) {
      dayStyle = [{ ...styles.calendarDay, ...completionStyle }];
    }

    return (
      <TouchableOpacity
        key={index}
        style={dayStyle}
        onPress={() => setSelectedDate(dateStr)}
      >
        <Text style={textStyle}>{day}</Text>
        {habitsCount > 0 && (
          <View style={styles.completionIndicator}>
            <View 
              style={[
                styles.completionBar, 
                { width: `${Math.max(completionRate * 100, 10)}%` }
              ]} 
            />
          </View>
        )}
        {habitsCount > 0 && (
          <Text style={styles.habitCount}>{habitsCount}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const selectedDateHabits = getFilteredHabitsForDate(selectedDate);

  // Loading state
  if (!isStorageLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando calendário...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <Text style={styles.navButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.monthTitle}>
              {formatMonthYear(currentMonth)}
            </Text>
            {monthlyStats.totalDays > 0 && (
              <Text style={styles.monthSubtitle}>
                {monthlyStats.averageRate}% de conclusão média
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <Text style={styles.navButton}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Estatísticas do mês */}
        {monthlyStats.totalDays > 0 && (
          <View style={styles.monthlyStatsContainer}>
            <View style={styles.monthlyStatCard}>
              <Text style={styles.monthlyStatNumber}>{monthlyStats.totalCompletions}</Text>
              <Text style={styles.monthlyStatLabel}>Hábitos Completados</Text>
            </View>
            <View style={styles.monthlyStatCard}>
              <Text style={styles.monthlyStatNumber}>{monthlyStats.totalDays}</Text>
              <Text style={styles.monthlyStatLabel}>Dias com Atividade</Text>
            </View>
            <View style={[styles.monthlyStatCard, styles.percentageCard]}>
              <Text style={[styles.monthlyStatNumber, styles.percentageNumber]}>
                {monthlyStats.averageRate}%
              </Text>
              <Text style={styles.monthlyStatLabel}>Taxa de Sucesso</Text>
            </View>
          </View>
        )}

        <View style={styles.weekDays}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendar}>
          {getDaysInMonth(currentMonth).map(renderCalendarDay)}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legenda de Progresso:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.lowCompletion]} />
              <Text style={styles.legendText}>0-33%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.mediumCompletion]} />
              <Text style={styles.legendText}>34-66%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.highCompletion]} />
              <Text style={styles.legendText}>67-100%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.today]} />
              <Text style={styles.legendText}>Hoje</Text>
            </View>
          </View>
        </View>

        <View style={styles.selectedDateSection}>
          <Text style={styles.selectedDateTitle}>
            {new Date(selectedDate).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          
          {selectedDateHabits.length > 0 ? (
            <View style={styles.habitsContainer}>
              <View style={styles.habitsSummaryCard}>
                <Text style={styles.habitsSummary}>
                  {selectedDateHabits.filter(habit => isHabitCompletedOnDate(habit, selectedDate)).length} de {selectedDateHabits.length} hábitos concluídos
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${getCompletionRate(selectedDate) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {Math.round(getCompletionRate(selectedDate) * 100)}%
                  </Text>
                </View>
              </View>
              
              {selectedDateHabits.map((habit) => {
                const isCompleted = isHabitCompletedOnDate(habit, selectedDate);
                return (
                  <View key={habit.id} style={styles.habitItem}>
                    <View style={[
                      styles.habitStatus, 
                      { backgroundColor: habit.color },
                      isCompleted && styles.habitCompleted
                    ]} />
                    <View style={styles.habitInfo}>
                      <Text style={[
                        styles.habitName, 
                        isCompleted && styles.habitNameCompleted
                      ]}>
                        {habit.name}
                      </Text>
                      {habit.category && (
                        <Text style={styles.habitCategory}>
                          {habit.category}
                        </Text>
                      )}
                      <Text style={styles.habitFrequency}>
                        Frequência: {habit.frequency}
                      </Text>
                    </View>
                    <View style={styles.habitStatusText}>
                      <Text style={[
                        styles.statusText,
                        isCompleted ? styles.completedText : styles.pendingText
                      ]}>
                        {isCompleted ? '✓ Concluído' : '○ Pendente'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noHabitsContainer}>
              <Text style={styles.noHabitsText}>
                Nenhum hábito programado para este dia
              </Text>
              <Text style={styles.noHabitsSubtext}>
                Os hábitos aparecem baseados na frequência configurada
              </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCenter: {
    alignItems: 'center',
  },
  navButton: {
    fontSize: 28,
    color: '#667eea',
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  monthSubtitle: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
    marginTop: 2,
  },
  monthlyStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  monthlyStatCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  percentageCard: {
    backgroundColor: '#F0FDF4',
  },
  monthlyStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  percentageNumber: {
    color: '#16A34A',
  },
  monthlyStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingTop: 10,
    backgroundColor: '#ffffff',
  },
  emptyDay: {
    width: (width - 30) / 7,
    height: 60,
    margin: 2,
  },
  calendarDay: {
    width: (width - 30) / 7,
    height: 60,
    margin: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectedDay: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  selectedDayText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  today: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  lowCompletion: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  mediumCompletion: {
    backgroundColor: '#FDE68A',
    borderColor: '#F59E0B',
  },
  highCompletion: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  completionIndicator: {
    position: 'absolute',
    bottom: 6,
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  completionBar: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  habitCount: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 8,
    color: '#6B7280',
    fontWeight: '600',
  },
  legend: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    marginTop: 1,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedDateSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    marginTop: 10,
  },
  selectedDateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  habitsSummaryCard: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  habitsSummary: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    minWidth: 40,
    textAlign: 'right',
  },
  habitsContainer: {
    gap: 12,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  habitStatus: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    opacity: 0.7,
  },
  habitCompleted: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 2,
  },
  habitNameCompleted: {
    color: '#10B981',
  },
  habitCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  habitFrequency: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  habitStatusText: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completedText: {
    color: '#10B981',
  },
  pendingText: {
    color: '#6B7280',
  },
  noHabitsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noHabitsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  noHabitsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CalendarScreen;
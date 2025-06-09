import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

const CalendarScreen: React.FC = () => {
  const { habits, getHabitsForDate } = useHabits();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const getCompletionRate = (dateStr: string) => {
    const habitsForDate = getHabitsForDate(dateStr);
    if (habitsForDate.length === 0) return 0;
    
    // Normalizar a data para comparação
    const targetDate = dateStr.split('T')[0];
    
    const completedCount = habitsForDate.filter(habit => {
      // Verificar se existe um record completado para esta data
      const hasCompletedRecord = habit.records?.some(record => {
        const recordDate = record.date.split('T')[0];
        return recordDate === targetDate && record.completed;
      });
      return hasCompletedRecord;
    }).length;
    
    return completedCount / habitsForDate.length;
  };

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

  const renderCalendarDay = (day: number | null, index: number) => {
    if (!day) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const dateStr = formatDateString(day);
    const completionRate = getCompletionRate(dateStr);
    const isSelected = dateStr === selectedDate;
    const todayCheck = isToday(day);

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
        {completionRate > 0 && (
          <View style={styles.completionIndicator}>
            <View 
              style={[
                styles.completionBar, 
                { width: `${completionRate * 100}%` }
              ]} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedDateHabits = getHabitsForDate(selectedDate);

  const isHabitCompletedOnDate = (habit: any, date: string) => {
    const targetDate = date.split('T')[0];
    const record = habit.records?.find((record: any) => {
      const recordDate = record.date.split('T')[0];
      return recordDate === targetDate;
    });
    return record?.completed || false;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <Text style={styles.navButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {formatMonthYear(currentMonth)}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <Text style={styles.navButton}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendar}>
          {getDaysInMonth(currentMonth).map(renderCalendarDay)}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legenda:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.lowCompletion]} />
              <Text style={styles.legendText}>Baixo (0-33%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.mediumCompletion]} />
              <Text style={styles.legendText}>Médio (34-66%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.highCompletion]} />
              <Text style={styles.legendText}>Alto (67-100%)</Text>
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
              <Text style={styles.habitsSummary}>
                {selectedDateHabits.filter(habit => isHabitCompletedOnDate(habit, selectedDate)).length} de {selectedDateHabits.length} hábitos concluídos
              </Text>
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
            <Text style={styles.noHabitsText}>
              Nenhum hábito programado para este dia
            </Text>
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
    height: 50,
    margin: 2,
  },
  calendarDay: {
    width: (width - 30) / 7,
    height: 50,
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
    bottom: 3,
    left: 3,
    right: 3,
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  completionBar: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
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
  habitsSummary: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
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
  noHabitsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 40,
    fontStyle: 'italic',
  },
});

export default CalendarScreen;
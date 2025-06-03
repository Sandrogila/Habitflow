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
    
    const completedCount = habitsForDate.filter(habit => 
      habit.completedDates.includes(dateStr)
    ).length;
    
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
              <Text style={styles.legendText}>Baixo</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.mediumCompletion]} />
              <Text style={styles.legendText}>Médio</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.highCompletion]} />
              <Text style={styles.legendText}>Alto</Text>
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
              {selectedDateHabits.map((habit) => {
                const isCompleted = habit.completedDates.includes(selectedDate);
                return (
                  <View key={habit.id} style={styles.habitItem}>
                    <View style={[styles.habitStatus, isCompleted && styles.habitCompleted]} />
                    <Text style={[styles.habitName, isCompleted && styles.habitNameCompleted]}>
                      {habit.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noHabitsText}>Nenhum hábito para este dia</Text>
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
    paddingVertical: 20,
  },
  navButton: {
    fontSize: 24,
    color: '#667eea',
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  emptyDay: {
    width: width / 7 - 6,
    height: 45,
    margin: 1,
  },
  calendarDay: {
    width: width / 7 - 6,
    height: 45,
    margin: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedDay: {
    backgroundColor: '#667eea',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  today: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  lowCompletion: {
    backgroundColor: '#FEF3C7',
  },
  mediumCompletion: {
    backgroundColor: '#FDE68A',
  },
  highCompletion: {
    backgroundColor: '#D1FAE5',
  },
  completionIndicator: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
  },
  completionBar: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 1,
  },
  legend: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedDateSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  habitsContainer: {
    gap: 8,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  habitStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  habitCompleted: {
    backgroundColor: '#10B981',
  },
  habitName: {
    fontSize: 16,
    color: '#374151',
  },
  habitNameCompleted: {
    color: '#10B981',
    textDecorationLine: 'line-through',
  },
  noHabitsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default CalendarScreen;
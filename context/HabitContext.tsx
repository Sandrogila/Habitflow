import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  frequency: 'daily' | 'weekdays' | 'custom';
  activeDays: number[]; // 0-6 (domingo-sábado)
  time: string;
  reminder?: boolean;
  completedDates: string[]; // formato YYYY-MM-DD
  streak: number;
  createdAt: string;
}

export const categories = [
  { id: 'Saúde', name: 'Saúde', color: '#7C3AED' },
  { id: 'Educação', name: 'Educação', color: '#16A34A' },
  { id: 'Exercício', name: 'Exercício', color: '#EA580C' },
  { id: 'Lazer', name: 'Lazer', color: '#0891B2' },
];

interface HabitContextType {
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  getHabitsForDate: (date: string) => Habit[];
  getHabitStats: () => {
    totalHabits: number;
    completedToday: number;
    totalCompletionsThisWeek: number;
    totalCompletionsThisMonth: number;
  };
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([
    {
      id: '1',
      name: 'Beber 2L de água',
      category: 'Saúde',
      frequency: 'daily',
      activeDays: [0, 1, 2, 3, 4, 5, 6],
      time: '08:00',
      reminder: true,
      completedDates: ['2025-06-04', '2025-06-03'],
      streak: 7,
      createdAt: '2025-05-28T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'Exercitar-se 30min',
      category: 'Exercício',
      frequency: 'weekdays',
      activeDays: [1, 2, 3, 4, 5],
      time: '07:00',
      reminder: true,
      completedDates: ['2025-06-03', '2025-06-02'],
      streak: 3,
      createdAt: '2025-05-30T00:00:00.000Z',
    },
  ]);

  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completedDates: [],
      streak: 0,
      reminder: habitData.reminder ?? true,
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(habit => 
      habit.id === id ? { ...habit, ...updates } : habit
    ));
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(habit => habit.id !== id));
  };

  const toggleHabitCompletion = (id: string, date: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const isCompleted = habit.completedDates.includes(date);
        const newCompletedDates = isCompleted
          ? habit.completedDates.filter(d => d !== date)
          : [...habit.completedDates, date];
        
        // Calcular streak - contar dias consecutivos até hoje
        const sortedDates = newCompletedDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        let streak = 0;
        const today = new Date();
        let checkDate = new Date(today);
        
        // Verificar quantos dias consecutivos foram completados até hoje
        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          const dayOfWeek = checkDate.getDay();
          
          // Verificar se este hábito deveria ser feito neste dia
          const shouldBeActive = habit.activeDays.includes(dayOfWeek);
          
          if (shouldBeActive) {
            if (sortedDates.includes(dateStr)) {
              streak++;
            } else {
              break; // Quebrou a sequência
            }
          }
          
          checkDate.setDate(checkDate.getDate() - 1);
          
          // Evitar loop infinito - máximo 100 dias
          if (streak > 100) break;
        }

        return {
          ...habit,
          completedDates: newCompletedDates,
          streak,
        };
      }
      return habit;
    }));
  };

  const getHabitsForDate = (date: string) => {
    const dayOfWeek = new Date(date).getDay();
    
    return habits.filter(habit => {
      return habit.activeDays.includes(dayOfWeek);
    });
  };

  const getHabitStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    const todayHabits = getHabitsForDate(today);
    const completedToday = todayHabits.filter(habit => 
      habit.completedDates.includes(today)
    ).length;

    let totalCompletionsThisWeek = 0;
    let totalCompletionsThisMonth = 0;

    habits.forEach(habit => {
      habit.completedDates.forEach(date => {
        if (date >= startOfWeekStr) {
          totalCompletionsThisWeek++;
        }
        if (date >= startOfMonthStr) {
          totalCompletionsThisMonth++;
        }
      });
    });

    return {
      totalHabits: habits.length,
      completedToday,
      totalCompletionsThisWeek,
      totalCompletionsThisMonth,
    };
  };

  return (
    <HabitContext.Provider value={{
      habits,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleHabitCompletion,
      getHabitsForDate,
      getHabitStats,
    }}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
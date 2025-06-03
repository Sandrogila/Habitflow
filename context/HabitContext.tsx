import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Habit {
  id: string;
  name: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[]; // 0-6 (domingo-sábado)
  time?: string;
  reminder: boolean;
  completedDates: string[]; // formato YYYY-MM-DD
  streak: number;
  createdAt: string;
}

export const categories = [
  'Saúde',
  'Exercício',
  'Estudos',
  'Trabalho',
  'Mindfulness',
  'Relacionamentos',
  'Hobbies',
  'Outros'
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
      time: '08:00',
      reminder: true,
      completedDates: ['2025-05-31', '2025-05-30'],
      streak: 7,
      createdAt: '2025-05-24',
    },
    {
      id: '2',
      name: 'Exercitar-se 30min',
      category: 'Exercício',
      frequency: 'daily',
      time: '07:00',
      reminder: true,
      completedDates: ['2025-05-30', '2025-05-29'],
      streak: 3,
      createdAt: '2025-05-28',
    },
  ]);

  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      completedDates: [],
      streak: 0,
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
        
        // Calcular streak
        const sortedDates = newCompletedDates.sort();
        let streak = 0;
        const today = new Date();
        let currentDate = new Date(today);
        
        while (sortedDates.includes(currentDate.toISOString().split('T')[0])) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
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
      if (habit.frequency === 'daily') return true;
      if (habit.frequency === 'weekly') return dayOfWeek === 1; // Segunda-feira
      if (habit.frequency === 'custom' && habit.customDays) {
        return habit.customDays.includes(dayOfWeek);
      }
      return false;
    });
  };

  const getHabitStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const todayHabits = getHabitsForDate(today);
    const completedToday = todayHabits.filter(habit => 
      habit.completedDates.includes(today)
    ).length;

    let totalCompletionsThisWeek = 0;
    let totalCompletionsThisMonth = 0;

    habits.forEach(habit => {
      habit.completedDates.forEach(date => {
        const completionDate = new Date(date);
        if (completionDate >= startOfWeek) {
          totalCompletionsThisWeek++;
        }
        if (completionDate >= startOfMonth) {
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

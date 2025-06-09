import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HabitService, CategoryService, HabitDto, CategoryDto, CreateHabitDto, MarkHabitAsDoneDto, MarkHabitAsNotDoneDto } from '../services/api';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category?: string;
  categoryId?: string;
  frequency: string;
  target?: string;
  color: string;
  createdAt: string;
  records?: HabitRecord[];
}

export interface HabitRecord {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  note?: string;
  achievedValue?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface HabitContextType {
  habits: Habit[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  loadHabits: () => Promise<void>;
  loadCategories: () => Promise<void>;
  addHabit: (habit: CreateHabitDto) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitCompletion: (id: string, date: string) => Promise<void>;
  getHabitsForDate: (date: string) => Habit[];
  getHabitStats: () => {
    totalHabits: number;
    completedToday: number;
    totalCompletionsThisWeek: number;
    totalCompletionsThisMonth: number;
  };
  refreshHabits: () => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transformar dados da API para o formato local
  const transformHabitFromApi = (apiHabit: HabitDto): Habit => {
    return {
      id: apiHabit.id,
      name: apiHabit.name,
      description: apiHabit.description,
      category: apiHabit.category?.name,
      categoryId: apiHabit.categoryId,
      frequency: apiHabit.frequency,
      target: apiHabit.target,
      color: apiHabit.color,
      createdAt: apiHabit.createdAt,
      records: apiHabit.records?.map(record => ({
        id: record.id,
        habitId: record.habitId,
        date: record.date,
        completed: record.completed,
        note: record.note,
        achievedValue: record.achievedValue,
        createdAt: record.createdAt,
      })),
    };
  };

  // Transformar dados da API para categorias
  const transformCategoryFromApi = (apiCategory: CategoryDto): Category => {
    return {
      id: apiCategory.id,
      name: apiCategory.name,
      description: apiCategory.description,
      color: apiCategory.color,
    };
  };

  const loadHabits = async () => {
    try {
      setLoading(true);
      setError(null);
      const habitsData = await HabitService.getHabits();
      const transformedHabits = habitsData.map(transformHabitFromApi);
      setHabits(transformedHabits);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar hábitos');
      console.error('Erro ao carregar hábitos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setError(null);
      const categoriesData = await CategoryService.getCategories();
      const transformedCategories = categoriesData.map(transformCategoryFromApi);
      setCategories(transformedCategories);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar categorias');
      console.error('Erro ao carregar categorias:', err);
    }
  };

  const addHabit = async (habitData: CreateHabitDto) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar e limpar dados antes de enviar
      const cleanedHabitData: CreateHabitDto = {
        name: habitData.name.trim(),
        description: habitData.description && habitData.description.trim() ? habitData.description.trim() : undefined,
        categoryId: habitData.categoryId || undefined,
        frequency: habitData.frequency,
        target: habitData.target || undefined,
        color: habitData.color,
      };

      // Remover campos undefined para evitar envio de valores nulos
      Object.keys(cleanedHabitData).forEach(key => {
        if (cleanedHabitData[key as keyof CreateHabitDto] === undefined) {
          delete cleanedHabitData[key as keyof CreateHabitDto];
        }
      });

      console.log('Dados limpos a serem enviados:', cleanedHabitData);
      
      const newHabit = await HabitService.createHabit(cleanedHabitData);
      const transformedHabit = transformHabitFromApi(newHabit);
      setHabits(prev => [...prev, transformedHabit]);
    } catch (err: any) {
      console.error('Erro detalhado ao criar hábito:', err);
      setError(err.message || 'Erro ao criar hábito');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    try {
      setLoading(true);
      setError(null);
      
      const updateData = {
        name: updates.name?.trim() || '',
        description: updates.description?.trim() || undefined,
        categoryId: updates.categoryId || undefined,
        frequency: updates.frequency || '',
        target: updates.target || undefined,
        color: updates.color || '',
      };
      
      // Remover campos undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });
      
      const updatedHabit = await HabitService.updateHabit(id, updateData);
      const transformedHabit = transformHabitFromApi(updatedHabit);
      
      setHabits(prev => prev.map(habit => 
        habit.id === id ? transformedHabit : habit
      ));
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar hábito');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await HabitService.deleteHabit(id);
      setHabits(prev => prev.filter(habit => habit.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar hábito');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleHabitCompletion = async (id: string, date: string) => {
    try {
      setError(null);
      const habit = habits.find(h => h.id === id);
      if (!habit) {
        console.error('Hábito não encontrado:', id);
        return;
      }

      // Verificar se já existe um registro para esta data
      const existingRecord = habit.records?.find(record => {
        // Comparar apenas a data (YYYY-MM-DD) ignorando o horário
        const recordDate = record.date.split('T')[0];
        const targetDate = date.split('T')[0];
        return recordDate === targetDate;
      });
      
      const isCurrentlyCompleted = existingRecord?.completed || false;

      console.log('Estado atual do hábito:', {
        habitId: id,
        date,
        isCurrentlyCompleted,
        existingRecord
      });

      // Criar um DateTime completo para a data (meio-dia UTC para evitar problemas de timezone)
      const dateTime = new Date(date + 'T12:00:00.000Z').toISOString();

      // Preparar dados para envio
      const requestData = {
        date: dateTime,
        note: isCurrentlyCompleted ? "desmarcado" : "feito",
        achievedValue: 1
      };

      console.log('Dados a serem enviados:', requestData);

      if (isCurrentlyCompleted) {
        // Marcar como não feito
        console.log('Marcando hábito como não feito');
        await HabitService.markHabitAsNotDone(id, requestData);
      } else {
        // Marcar como feito
        console.log('Marcando hábito como feito');
        await HabitService.markHabitAsDone(id, requestData);
      }

      // Recarregar hábitos para obter os dados atualizados
      await loadHabits();
      
      console.log('Hábito atualizado com sucesso');
    } catch (err: any) {
      console.error('Erro detalhado ao atualizar status do hábito:', err);
      console.error('Response:', err.response?.data);
      
      // Melhor tratamento de erros
      let errorMessage = 'Erro ao atualizar status do hábito';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = 'Dados inválidos - verifique o formato da data e campos obrigatórios';
      } else if (err.response?.status === 404) {
        errorMessage = 'Hábito não encontrado';
      } else if (err.response?.status === 401) {
        errorMessage = 'Não autorizado - faça login novamente';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getHabitsForDate = (date: string): Habit[] => {
    // Normalizar a data para comparação (apenas YYYY-MM-DD)
    const targetDate = date.split('T')[0];
    
    return habits.filter(habit => {
      // Filtrar baseado na frequência do hábito
      if (habit.frequency === 'daily') {
        return true; // Hábitos diários sempre aparecem
      }
      
      if (habit.frequency === 'weekdays') {
        const dayOfWeek = new Date(targetDate).getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Segunda a sexta (1-5)
      }
      
      if (habit.frequency === 'weekends') {
        const dayOfWeek = new Date(targetDate).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Domingo (0) e sábado (6)
      }
      
      if (habit.frequency === 'weekly') {
        // Para hábitos semanais, pode aparecer qualquer dia
        // Você pode implementar lógica específica aqui se necessário
        return true;
      }
      
      // Para outras frequências, sempre retorna true por padrão
      return true;
    });
  };

  const getHabitStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayHabits = getHabitsForDate(today);
    
    // Contar hábitos completados hoje
    const completedToday = todayHabits.filter(habit => {
      const todayRecord = habit.records?.find(record => {
        const recordDate = record.date.split('T')[0];
        return recordDate === today;
      });
      return todayRecord?.completed || false;
    }).length;

    // Calcular estatísticas da semana (domingo a sábado)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Voltar para domingo
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    
    // Calcular estatísticas do mês
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    let totalCompletionsThisWeek = 0;
    let totalCompletionsThisMonth = 0;

    habits.forEach(habit => {
      habit.records?.forEach(record => {
        if (record.completed) {
          const recordDate = record.date.split('T')[0];
          
          if (recordDate >= startOfWeekStr) {
            totalCompletionsThisWeek++;
          }
          if (recordDate >= startOfMonthStr) {
            totalCompletionsThisMonth++;
          }
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

  // Função para recarregar hábitos (alias para loadHabits)
  const refreshHabits = async () => {
    await loadHabits();
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadHabits();
    loadCategories();
  }, []);

  return (
    <HabitContext.Provider value={{
      habits,
      categories,
      loading,
      error,
      loadHabits,
      loadCategories,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleHabitCompletion,
      getHabitsForDate,
      getHabitStats,
      refreshHabits,
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
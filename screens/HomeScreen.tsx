import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useHabits } from '../context/HabitContext';
import { AuthService, UserDto, HabitService } from '../services/api';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { habits, toggleHabitCompletion, getHabitsForDate, categories, loading, refreshHabits } = useHabits();
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [updatingHabits, setUpdatingHabits] = useState<Set<string>>(new Set());
  const [deletingHabits, setDeletingHabits] = useState<Set<string>>(new Set());
  
  const today = new Date().toISOString().split('T')[0];

  // Memoizar cálculos para otimizar performance
  const todayHabits = useMemo(() => getHabitsForDate(today), [habits, today]);

  // Carregar dados do usuário logado
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };

    loadUserData();
  }, []);

  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return '#6B7280';
    
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || '#6B7280';
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Sem categoria';
    
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  // Função melhorada para verificar se o hábito foi completado hoje
  const isHabitCompletedToday = (habit: any) => {
    if (!habit.records || habit.records.length === 0) return false;
    
    const todayRecord = habit.records.find((record: any) => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === today;
    });
    
    return todayRecord?.completed || false;
  };

  // Função corrigida para calcular sequência de dias consecutivos
  const getHabitStreak = (habit: any) => {
    if (!habit.records || habit.records.length === 0) return 0;
    
    // Ordenar registros por data (mais recente primeiro)
    const sortedRecords = habit.records
      .filter((record: any) => record.completed)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedRecords.length === 0) return 0;
    
    let streak = 0;
    const currentDate = new Date();
    
    // Começar verificando de hoje para trás
    for (let i = 0; i >= 0; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      const hasRecord = sortedRecords.find((record: { date: string | number | Date; }) => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === checkDateStr;
      });
      
      if (hasRecord) {
        streak++;
      } else {
        // Se não há registro para este dia, parar a contagem
        // mas só se não for o primeiro dia (hoje)
        if (i > 0) break;
      }
      
      // Evitar loop infinito
      if (i > 365) break;
    }
    
    return streak;
  };

  // Estatísticas calculadas dinamicamente
  const stats = useMemo(() => {
    const totalHabits = habits.length;
    const completedToday = todayHabits.filter(habit => isHabitCompletedToday(habit)).length;
    
    // Calcular completions desta semana
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    let totalCompletionsThisWeek = 0;
    habits.forEach(habit => {
      if (habit.records) {
        habit.records.forEach((record: any) => {
          const recordDate = new Date(record.date);
          if (record.completed && recordDate >= startOfWeek) {
            totalCompletionsThisWeek++;
          }
        });
      }
    });
    
    // Calcular completions deste mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    let totalCompletionsThisMonth = 0;
    habits.forEach(habit => {
      if (habit.records) {
        habit.records.forEach((record: any) => {
          const recordDate = new Date(record.date);
          if (record.completed && recordDate >= startOfMonth) {
            totalCompletionsThisMonth++;
          }
        });
      }
    });
    
    return {
      totalHabits,
      completedToday,
      totalCompletionsThisWeek,
      totalCompletionsThisMonth
    };
  }, [habits, todayHabits, today]);

  // Taxa de sucesso calculada dinamicamente
  const calculateSuccessRate = useMemo(() => {
    if (habits.length === 0) return 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let totalDaysWithHabits = 0;
    let completedDays = 0;
    
    habits.forEach(habit => {
      if (!habit.records) return;
      
      habit.records.forEach((record: any) => {
        const recordDate = new Date(record.date);
        if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
          totalDaysWithHabits++;
          if (record.completed) {
            completedDays++;
          }
        }
      });
    });
    
    return totalDaysWithHabits > 0 ? Math.round((completedDays / totalDaysWithHabits) * 100) : 0;
  }, [habits]);

  // Sequência atual calculada dinamicamente
  const getCurrentStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    
    let streak = 0;
    const currentDate = new Date();
    
    // Verificar cada dia consecutivo
    for (let i = 0; i < 365; i++) { // Limite para evitar loop infinito
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const habitsForDate = getHabitsForDate(dateStr);
      let hasCompletedHabit = false;
      
      for (const habit of habitsForDate) {
        const habitRecord = habit.records?.find((record: any) => {
          const recordDate = new Date(record.date).toISOString().split('T')[0];
          return recordDate === dateStr && record.completed;
        });
        
        if (habitRecord) {
          hasCompletedHabit = true;
          break;
        }
      }
      
      if (hasCompletedHabit) {
        streak++;
      } else {
        // Se não completou nenhum hábito neste dia, parar
        // mas só se não for hoje (primeiro dia)
        if (i > 0) break;
      }
    }
    
    return streak;
  }, [habits, getHabitsForDate]);

  // Função para lidar com a conclusão do hábito
  const handleCompleteHabit = async (habitId: string, habitName: string) => {
    if (updatingHabits.has(habitId)) return;

    setUpdatingHabits(prev => new Set(prev).add(habitId));
    
    try {
      await toggleHabitCompletion(habitId, today);
      // Remover do conjunto após sucesso
      setUpdatingHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
    } catch (error: any) {
      console.error('Erro ao atualizar hábito:', error);
      setUpdatingHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
      
      Alert.alert(
        'Erro', 
        `Não foi possível atualizar o hábito "${habitName}". ${error.message || 'Tente novamente.'}`,
        [{ text: 'OK' }]
      );
    }
  };

  // Função para editar hábito
  const handleEditHabit = (habitId: string) => {
    navigation.navigate('EditHabit', { habitId });
  };

  // Função para apagar hábito com confirmação
  const handleDeleteHabit = async (habitId: string, habitName: string) => {
    if (deletingHabits.has(habitId)) return;

    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o hábito "${habitName}"?\n\nEsta ação não pode ser desfeita e todos os registros serão perdidos.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeletingHabits(prev => new Set(prev).add(habitId));
            
            try {
              await HabitService.deleteHabit(habitId);
              await refreshHabits();
              
              Alert.alert(
                'Sucesso', 
                `Hábito "${habitName}" foi excluído com sucesso.`,
                [{ text: 'OK' }]
              );
              
            } catch (error: any) {
              console.error('Erro ao deletar hábito:', error);
              Alert.alert(
                'Erro',
                `Não foi possível excluir o hábito "${habitName}".\n\n${error.message || 'Tente novamente mais tarde.'}`,
                [{ text: 'OK' }]
              );
            } finally {
              setDeletingHabits(prev => {
                const newSet = new Set(prev);
                newSet.delete(habitId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const HabitCard = ({ habit }: { habit: any }) => {
    const isCompleted = isHabitCompletedToday(habit);
    const categoryColor = getCategoryColor(habit.categoryId);
    const categoryName = getCategoryName(habit.categoryId);
    const streak = getHabitStreak(habit);
    const isUpdating = updatingHabits.has(habit.id);
    const isDeleting = deletingHabits.has(habit.id);
    
    return (
      <View
        style={[
          styles.habitCard,
          isCompleted && styles.habitCardCompleted,
          (isUpdating || isDeleting) && styles.habitCardUpdating
        ]}
      >
        {/* Overlay de conclusão melhorado */}
        {isCompleted && (
          <View style={styles.completedOverlay}>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ CONCLUÍDO</Text>
            </View>
          </View>
        )}
        
        <View style={styles.habitCardHeader}>
          {/* Indicador de categoria melhorado */}
          <View style={[
            styles.categoryIndicator,
            { backgroundColor: categoryColor },
            isCompleted && styles.categoryIndicatorCompleted
          ]}>
            <View style={[
              styles.categoryDot, 
              { backgroundColor: isCompleted ? '#FFFFFF' : categoryColor }
            ]} />
          </View>
          
          {/* Informações do hábito */}
          <View style={styles.habitInfo}>
            <Text style={[
              styles.habitName,
              isCompleted && styles.habitNameCompleted
            ]}>
              {habit.name}
            </Text>
            <Text style={[
              styles.habitCategory, 
              { color: isCompleted ? '#16A34A' : categoryColor }
            ]}>
              {categoryName}
            </Text>
            {habit.description && (
              <Text style={[
                styles.habitDescription,
                isCompleted && styles.habitDescriptionCompleted
              ]}>
                {habit.description}
              </Text>
            )}
          </View>
          
          {/* Status de conclusão melhorado */}
          <View style={styles.habitStatus}>
            <View style={[
              styles.statusIndicator,
              isCompleted && styles.statusIndicatorCompleted
            ]}>
              {isCompleted ? (
                <Text style={styles.checkIcon}>✓</Text>
              ) : (
                <View style={styles.emptyCircle} />
              )}
            </View>
            <Text style={[
              styles.streakText,
              isCompleted && styles.streakTextCompleted
            ]}>
              🔥 {streak} dias
            </Text>
          </View>
        </View>
        
        {/* Botões de Ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.completeButton,
              isCompleted && styles.completeButtonCompleted,
              isUpdating && styles.buttonDisabled
            ]}
            onPress={() => handleCompleteHabit(habit.id, habit.name)}
            disabled={loading || isUpdating || isDeleting}
          >
            <Text style={[
              styles.completeButtonIcon,
              isCompleted && styles.completeButtonIconCompleted
            ]}>
              {isUpdating ? '⟳' : (isCompleted ? '✓' : '○')}
            </Text>
            <Text style={[
              styles.actionButtonLabel,
              styles.completeButtonLabel,
              isCompleted && styles.completeButtonLabelCompleted
            ]}>
              {isUpdating ? 'Atualizando...' : (isCompleted ? 'Concluído' : 'Concluir')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.editButton,
              (isUpdating || isDeleting) && styles.buttonDisabled
            ]}
            onPress={() => handleEditHabit(habit.id)}
            disabled={loading || isUpdating || isDeleting}
          >
            <Text style={styles.editButtonIcon}>✏️</Text>
            <Text style={[styles.actionButtonLabel, styles.editButtonLabel]}>
              Editar
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.deleteButton,
              isDeleting && styles.buttonDisabled
            ]}
            onPress={() => handleDeleteHabit(habit.id, habit.name)}
            disabled={loading || isUpdating || isDeleting}
          >
            <Text style={styles.deleteButtonIcon}>
              {isDeleting ? '⟳' : '🗑️'}
            </Text>
            <Text style={[styles.actionButtonLabel, styles.deleteButtonLabel]}>
              {isDeleting ? 'Excluindo...' : 'Apagar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Extrair o primeiro nome do usuário
  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return 'Usuário';
    return fullName.split(' ')[0];
  };

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
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateHabit')}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.greeting}>
            Olá, {getFirstName(currentUser?.name)}!
          </Text>
          <Text style={styles.subtitle}>Continue construindo seus hábitos</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sequência Atual</Text>
            <Text style={styles.statNumber}>{getCurrentStreak} dias</Text>
            <Text style={styles.statIcon}>🔥</Text>
          </View>
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={styles.successLabel}>Taxa de Sucesso</Text>
            <Text style={styles.successNumber}>{calculateSuccessRate}%</Text>
            <View style={styles.targetIcon}>
              <Text style={styles.targetText}>🎯</Text>
            </View>
          </View>
        </View>

        {/* Daily Stats */}
        <View style={styles.dailyStats}>
          <Text style={styles.dailyStatsTitle}>Estatísticas</Text>
          <View style={styles.dailyStatsGrid}>
            <View style={styles.dailyStatItem}>
              <Text style={styles.dailyStatNumber}>{stats.totalHabits}</Text>
              <Text style={styles.dailyStatLabel}>Total de Hábitos</Text>
            </View>
            <View style={[styles.dailyStatItem, styles.completedStatItem]}>
              <Text style={[styles.dailyStatNumber, styles.completedStatNumber]}>
                {stats.completedToday}
              </Text>
              <Text style={styles.dailyStatLabel}>Completados Hoje</Text>
            </View>
            <View style={styles.dailyStatItem}>
              <Text style={styles.dailyStatNumber}>{stats.totalCompletionsThisWeek}</Text>
              <Text style={styles.dailyStatLabel}>Esta Semana</Text>
            </View>
            <View style={styles.dailyStatItem}>
              <Text style={styles.dailyStatNumber}>{stats.totalCompletionsThisMonth}</Text>
              <Text style={styles.dailyStatLabel}>Este Mês</Text>
            </View>
          </View>
        </View>

        {/* Habits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Hábitos de Hoje ({stats.completedToday}/{todayHabits.length})
          </Text>
          
          {todayHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Nenhum hábito para hoje.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('CreateHabit')}
              >
                <Text style={styles.emptyStateButtonText}>
                  Criar meu primeiro hábito
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.habitsContainer}>
              {todayHabits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} />
              ))}
            </View>
          )}
        </View>

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando...</Text>
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
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  successCard: {
    backgroundColor: '#16A34A',
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  successLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  successNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statIcon: {
    fontSize: 16,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  targetIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  targetText: {
    fontSize: 20,
  },
  dailyStats: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dailyStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  dailyStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dailyStatItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  completedStatItem: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  dailyStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  completedStatNumber: {
    color: '#16A34A',
  },
  dailyStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  habitsContainer: {
    gap: 16,
  },
  habitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  habitCardCompleted: {
    backgroundColor: '#F8FDF9',
    borderColor: '#22C55E',
    transform: [{ scale: 0.98 }],
  },
  habitCardUpdating: {
    opacity: 0.7,
  },
  completedOverlay: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    zIndex: 1,
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  habitCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    zIndex: 2,
  },
  categoryIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  categoryIndicatorCompleted: {
    borderColor: '#16A34A',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  habitNameCompleted: {
    color: '#16A34A',
  },
  habitCategory: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  habitDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  habitDescriptionCompleted: {
    color: '#059669',
  },
  habitStatus: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
  },
  statusIndicatorCompleted: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  streakText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  streakTextCompleted: {
    color: '#16A34A',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    zIndex: 2,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
  },
  completeButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  completeButtonCompleted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  editButton: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  completeButtonIcon: {
    fontSize: 16,
    marginRight: 6,
    color: '#3B82F6',
  },
  completeButtonIconCompleted: {
    color: '#16A34A',
  },
  editButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  deleteButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  completeButtonLabel: {
    color: '#3B82F6',
  },
  completeButtonLabelCompleted: {
    color: '#16A34A',
  },
  editButtonLabel: {
    color: '#F59E0B',
  },
  deleteButtonLabel: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default HomeScreen;
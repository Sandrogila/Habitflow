import React, { useState, useEffect } from 'react';
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
  const { habits, toggleHabitCompletion, getHabitsForDate, getHabitStats, categories, loading, refreshHabits } = useHabits();
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [updatingHabits, setUpdatingHabits] = useState<Set<string>>(new Set());
  const [deletingHabits, setDeletingHabits] = useState<Set<string>>(new Set());
  
  const today = new Date().toISOString().split('T')[0];
  const todayHabits = getHabitsForDate(today);
  const stats = getHabitStats();

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

  const getHabitStreak = (habit: any) => {
    if (!habit.records || habit.records.length === 0) return 0;
    
    // Calcular sequência atual
    let streak = 0;
    const sortedRecords = habit.records
      .filter((record: any) => record.completed)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedRecords.length === 0) return 0;
    
    const today = new Date();
    let currentDate = new Date(today);
    
    for (let i = 0; i < sortedRecords.length; i++) {
      const recordDate = new Date(sortedRecords[i].date);
      const currentDateStr = currentDate.toISOString().split('T')[0];
      const recordDateStr = recordDate.toISOString().split('T')[0];
      
      if (currentDateStr === recordDateStr) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const isHabitCompletedToday = (habit: any) => {
    if (!habit.records) return false;
    
    const todayRecord = habit.records.find((record: any) => {
      const recordDate = record.date.split('T')[0];
      const todayDate = today.split('T')[0];
      return recordDate === todayDate;
    });
    return todayRecord?.completed || false;
  };

  const calculateSuccessRate = () => {
    if (habits.length === 0) return 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let totalDaysWithHabits = 0;
    let completedDays = 0;
    
    habits.forEach(habit => {
      if (!habit.records) return;
      
      habit.records.forEach(record => {
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
  };

  const getCurrentStreak = () => {
    if (habits.length === 0) return 0;
    
    // Calcular a sequência de dias consecutivos com pelo menos 1 hábito completado
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const habitsForDate = getHabitsForDate(dateStr);
      
      let hasCompletedHabit = false;
      for (const habit of habitsForDate) {
        if (isHabitCompletedToday(habit)) {
          hasCompletedHabit = true;
          break;
        }
      }
      
      if (hasCompletedHabit) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Função para lidar com a conclusão do hábito
  const handleCompleteHabit = async (habitId: string, habitName: string) => {
    // Verificar se o hábito já está sendo atualizado
    if (updatingHabits.has(habitId)) {
      return;
    }

    // Adicionar o hábito ao conjunto de hábitos sendo atualizados
    setUpdatingHabits(prev => new Set(prev).add(habitId));
    
    try {
      await toggleHabitCompletion(habitId, today);
      
      // Feedback visual por um momento
      setTimeout(() => {
        setUpdatingHabits(prev => {
          const newSet = new Set(prev);
          newSet.delete(habitId);
          return newSet;
        });
      }, 500);
      
    } catch (error: any) {
      console.error('Erro ao atualizar hábito:', error);
      
      // Remover do conjunto em caso de erro
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
    // Verificar se o hábito já está sendo deletado
    if (deletingHabits.has(habitId)) {
      return;
    }

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
            // Adicionar ao conjunto de hábitos sendo deletados
            setDeletingHabits(prev => new Set(prev).add(habitId));
            
            try {
              // Chamar o serviço para deletar o hábito
              await HabitService.deleteHabit(habitId);
              
              // Recarregar a lista de hábitos
              await refreshHabits();
              
              // Mostrar mensagem de sucesso
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
              // Remover do conjunto de hábitos sendo deletados
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
        <View style={styles.habitCardHeader}>
          {/* Indicador de categoria */}
          <View style={[
            styles.categoryDot, 
            { backgroundColor: categoryColor },
            isCompleted && styles.categoryDotCompleted
          ]} />
          
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
              { color: isCompleted ? '#6B7280' : categoryColor }
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
          
          {/* Status de conclusão */}
          <View style={styles.habitStatus}>
            <View style={[
              styles.statusIndicator,
              isCompleted && styles.statusIndicatorCompleted
            ]}>
              {isCompleted && <Text style={styles.checkIcon}>✓</Text>}
            </View>
            <Text style={[
              styles.streakText,
              isCompleted && styles.streakTextCompleted
            ]}>
              {streak} dias
            </Text>
          </View>
        </View>
        
        {/* Botões de Ação */}
        <View style={styles.actionButtons}>
          {/* Botão de Concluir/Desmarcar */}
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
          
          {/* Botão de Editar */}
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
          
          {/* Botão de Apagar */}
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
        
        {/* Linha de risco quando completado */}
        {isCompleted && <View style={styles.strikethrough} />}
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
            <Text style={styles.statNumber}>{getCurrentStreak()} dias</Text>
          </View>
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={styles.successLabel}>Taxa de Sucesso</Text>
            <Text style={styles.successNumber}>{calculateSuccessRate()}%</Text>
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
            <View style={styles.dailyStatItem}>
              <Text style={styles.dailyStatNumber}>{stats.completedToday}</Text>
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
  },
  successCard: {
    backgroundColor: '#16A34A',
    position: 'relative',
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
  },
  successNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  },
  dailyStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  habitCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  habitCardUpdating: {
    opacity: 0.7,
  },
  habitCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  categoryDotCompleted: {
    opacity: 0.7,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  habitNameCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  habitCategory: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  habitDescriptionCompleted: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  habitStatus: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  statusIndicatorCompleted: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  streakText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  streakTextCompleted: {
    color: '#16A34A',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  completeButton: {
    backgroundColor: '#F0F9FF',
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
    opacity: 0.5,
  },
  completeButtonIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#3B82F6',
  },
  completeButtonIconCompleted: {
    color: '#16A34A',
  },
  editButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  deleteButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  actionButtonLabel: {
    fontSize: 12,
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
  strikethrough: {
    position: 'absolute',
    top: '40%',
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: '#16A34A',
    opacity: 0.4,
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
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default HomeScreen;
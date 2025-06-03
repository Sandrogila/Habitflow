import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useHabits } from '../context/HabitContext';

type CreateHabitScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateHabit'>;
};

const categories = [
  { id: 'health', name: 'Saúde', icon: '💪' },
  { id: 'productivity', name: 'Produtividade', icon: '⚡' },
  { id: 'learning', name: 'Aprendizado', icon: '📚' },
  { id: 'fitness', name: 'Exercícios', icon: '🏃' },
  { id: 'mindfulness', name: 'Bem-estar', icon: '🧘' },
  { id: 'social', name: 'Social', icon: '👥' },
  { id: 'creativity', name: 'Criatividade', icon: '🎨' },
  { id: 'other', name: 'Outros', icon: '📝' },
];

const frequencies = [
  { id: 'daily', name: 'Diário', description: 'Todos os dias' },
  { id: 'weekdays', name: 'Dias úteis', description: 'Segunda a sexta' },
  { id: 'weekends', name: 'Fins de semana', description: 'Sábado e domingo' },
  { id: 'custom', name: 'Personalizado', description: 'Escolher dias' },
];

const CreateHabitScreen: React.FC<CreateHabitScreenProps> = ({ navigation }) => {
  const { addHabit } = useHabits();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [time, setTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = [
    { id: 0, name: 'Dom', fullName: 'Domingo' },
    { id: 1, name: 'Seg', fullName: 'Segunda' },
    { id: 2, name: 'Ter', fullName: 'Terça' },
    { id: 3, name: 'Qua', fullName: 'Quarta' },
    { id: 4, name: 'Qui', fullName: 'Quinta' },
    { id: 5, name: 'Sex', fullName: 'Sexta' },
    { id: 6, name: 'Sáb', fullName: 'Sábado' },
  ];

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const handleCreateHabit = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do hábito');
      return;
    }

    if (!category) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }

    if (frequency === 'custom' && selectedDays.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um dia da semana');
      return;
    }

    setLoading(true);

    try {
      let activeDays: number[] = [];
      
      switch (frequency) {
        case 'daily':
          activeDays = [0, 1, 2, 3, 4, 5, 6];
          break;
        case 'weekdays':
          activeDays = [1, 2, 3, 4, 5];
          break;
        case 'weekends':
          activeDays = [0, 6];
          break;
        case 'custom':
          activeDays = selectedDays;
          break;
      }

      const newHabit = {
        id: Date.now().toString(),
        name: name.trim(),
        description: description.trim(),
        category,
        frequency,
        time: time.trim(),
        activeDays,
        streak: 0,
        completedDates: [],
        createdAt: new Date().toISOString(),
      };

      addHabit(newHabit);
      
      Alert.alert('Sucesso', 'Hábito criado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o hábito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Criar Novo Hábito</Text>
              <Text style={styles.subtitle}>
                Defina um hábito que transformará sua rotina
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do hábito *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Beber 2L de água"
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Adicione detalhes sobre seu hábito..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Categoria *</Text>
                <View style={styles.categoriesGrid}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryCard,
                        category === cat.id && styles.categoryCardSelected
                      ]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text style={[
                        styles.categoryName,
                        category === cat.id && styles.categoryNameSelected
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Frequência</Text>
                <View style={styles.frequencyContainer}>
                  {frequencies.map((freq) => (
                    <TouchableOpacity
                      key={freq.id}
                      style={[
                        styles.frequencyCard,
                        frequency === freq.id && styles.frequencyCardSelected
                      ]}
                      onPress={() => setFrequency(freq.id)}
                    >
                      <Text style={[
                        styles.frequencyName,
                        frequency === freq.id && styles.frequencyNameSelected
                      ]}>
                        {freq.name}
                      </Text>
                      <Text style={[
                        styles.frequencyDescription,
                        frequency === freq.id && styles.frequencyDescriptionSelected
                      ]}>
                        {freq.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {frequency === 'custom' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Dias da semana</Text>
                  <View style={styles.daysContainer}>
                    {weekDays.map((day) => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayButton,
                          selectedDays.includes(day.id) && styles.dayButtonSelected
                        ]}
                        onPress={() => toggleDay(day.id)}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          selectedDays.includes(day.id) && styles.dayButtonTextSelected
                        ]}>
                          {day.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Horário (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 08:00, Manhã, Após o almoço..."
                  value={time}
                  onChangeText={setTime}
                  maxLength={30}
                />
              </View>

              <TouchableOpacity
                style={[styles.createButton, loading && styles.createButtonDisabled]}
                onPress={handleCreateHabit}
                disabled={loading}
              >
                <Text style={styles.createButtonText}>
                  {loading ? 'Criando...' : 'Criar Hábito'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#F0F9FF',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  frequencyContainer: {
    gap: 12,
  },
  frequencyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  frequencyCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#F0F9FF',
  },
  frequencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  frequencyNameSelected: {
    color: '#667eea',
  },
  frequencyDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  frequencyDescriptionSelected: {
    color: '#667eea',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default CreateHabitScreen;
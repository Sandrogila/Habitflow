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
  { id: 'Saúde', name: 'Saúde', color: '#7C3AED' },
  { id: 'Educação', name: 'Educação', color: '#16A34A' },
  { id: 'Exercício', name: 'Exercício', color: '#EA580C' },
  { id: 'Lazer', name: 'Lazer', color: '#0891B2' },
];

const CreateHabitScreen: React.FC<CreateHabitScreenProps> = ({ navigation }) => {
  const { addHabit } = useHabits();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [time, setTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = [
    { id: 1, name: 'S', fullName: 'Segunda' },
    { id: 2, name: 'T', fullName: 'Terça' },
    { id: 3, name: 'Q', fullName: 'Quarta' },
    { id: 4, name: 'Q', fullName: 'Quinta' },
    { id: 5, name: 'S', fullName: 'Sexta' },
    { id: 6, name: 'S', fullName: 'Sábado' },
    { id: 0, name: 'D', fullName: 'Domingo' },
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
        case 'custom':
          activeDays = selectedDays;
          break;
      }

      const newHabit = {
        id: Date.now().toString(),
        name: name.trim(),
        description: '',
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
              <Text style={styles.greeting}>Olá, Délcio!</Text>
              <Text style={styles.subtitle}>Continue construindo seus hábitos</Text>
            </View>

            <Text style={styles.title}>Adicionar Novo Hábito</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Hábito</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Beber 2L de água"
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Categoria</Text>
                <View style={styles.categoriesContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryButton,
                        category === cat.id && { backgroundColor: cat.color }
                      ]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Text style={[
                        styles.categoryText,
                        category === cat.id && styles.categoryTextSelected
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
                  <TouchableOpacity
                    style={[
                      styles.frequencyOption,
                      frequency === 'daily' && styles.frequencyOptionSelected
                    ]}
                    onPress={() => setFrequency('daily')}
                  >
                    <View style={[
                      styles.radioButton,
                      frequency === 'daily' && styles.radioButtonSelected
                    ]}>
                      {frequency === 'daily' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.frequencyText}>Todos os dias</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.frequencyOption,
                      frequency === 'weekdays' && styles.frequencyOptionSelected
                    ]}
                    onPress={() => setFrequency('weekdays')}
                  >
                    <View style={[
                      styles.radioButton,
                      frequency === 'weekdays' && styles.radioButtonSelected
                    ]}>
                      {frequency === 'weekdays' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.frequencyText}>Dias úteis</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.frequencyOption,
                      frequency === 'custom' && styles.frequencyOptionSelected
                    ]}
                    onPress={() => setFrequency('custom')}
                  >
                    <View style={[
                      styles.radioButton,
                      frequency === 'custom' && styles.radioButtonSelected
                    ]}>
                      {frequency === 'custom' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.frequencyText}>Personalizado</Text>
                  </TouchableOpacity>
                </View>

                {frequency === 'custom' && (
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
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Frequência</Text>
                <TextInput
                  style={styles.timeInput}
                  value={time}
                  onChangeText={setTime}
                  placeholder="08:00"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleCreateHabit}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Salvando...' : 'Salvar Hábito'}
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
    backgroundColor: '#FFFFFF',
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
    marginBottom: 24,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    width: 100,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  frequencyContainer: {
    gap: 12,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  frequencyOptionSelected: {
    // Add any selected styling if needed
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#7C3AED',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C3AED',
  },
  frequencyText: {
    fontSize: 16,
    color: '#1F2937',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 4,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  dayButtonSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CreateHabitScreen;
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
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useHabits, categories } from '../context/HabitContext';

type CreateHabitScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateHabit'>;
};

const CreateHabitScreen: React.FC<CreateHabitScreenProps> = ({ navigation }) => {
  const { addHabit } = useHabits();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [time, setTime] = useState('08:00');
  const [reminder, setReminder] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = [
    { id: 1, name: 'S', fullName: 'Segunda' },
    { id: 2, name: 'T', fullName: 'Terça' },
    { id: 3, name: 'Q', fullName: 'Quarta' },
    { id: 4, name: 'Qu', fullName: 'Quinta' },
    { id: 5, name: 'Se', fullName: 'Sexta' },
    { id: 6, name: 'Sá', fullName: 'Sábado' },
    { id: 0, name: 'D', fullName: 'Domingo' },
  ];

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const validateTimeFormat = (timeStr: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  };

  const handleCreateHabit = async () => {
    // Validações
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

    if (!validateTimeFormat(time)) {
      Alert.alert('Erro', 'Digite um horário válido (formato HH:MM)');
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
        default:
          activeDays = [0, 1, 2, 3, 4, 5, 6];
      }

      const newHabit = {
        name: name.trim(),
        description: description.trim(),
        category,
        frequency: frequency as 'daily' | 'weekdays' | 'custom',
        time: time.trim(),
        activeDays,
        reminder,
      };

      addHabit(newHabit);
      
      Alert.alert('Sucesso', 'Hábito criado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erro ao criar hábito:', error);
      Alert.alert('Erro', 'Não foi possível criar o hábito. Tente novamente.');
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
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
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição (Opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva seu hábito..."
                  value={description}
                  onChangeText={setDescription}
                  maxLength={200}
                  multiline
                  numberOfLines={3}
                  returnKeyType="next"
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
                      activeOpacity={0.7}
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
                    activeOpacity={0.7}
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
                    activeOpacity={0.7}
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
                    activeOpacity={0.7}
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
                        activeOpacity={0.7}
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
                <Text style={styles.label}>Horário</Text>
                <TextInput
                  style={styles.timeInput}
                  value={time}
                  onChangeText={setTime}
                  placeholder="08:00"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Lembrete</Text>
                  <Switch
                    value={reminder}
                    onValueChange={setReminder}
                    trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
                    thumbColor={reminder ? '#7C3AED' : '#9CA3AF'}
                  />
                </View>
                <Text style={styles.switchDescription}>
                  Receba notificações no horário definido
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleCreateHabit}
                disabled={loading}
                activeOpacity={0.8}
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: -8,
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
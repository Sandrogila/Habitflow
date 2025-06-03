import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useHabits, categories } from '../context/HabitContext';

type EditHabitScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditHabit'>;
  route: RouteProp<RootStackParamList, 'EditHabit'>;
};

const EditHabitScreen: React.FC<EditHabitScreenProps> = ({ navigation, route }) => {
  const { habits, updateHabit, deleteHabit } = useHabits();
  const habit = habits.find(h => h.id === route.params.habitId);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [time, setTime] = useState('');
  const [reminder, setReminder] = useState(false);

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setCategory(habit.category);
      setFrequency(habit.frequency);
      setCustomDays(habit.customDays || []);
      setTime(habit.time || '');
      setReminder(habit.reminder);
    }
  }, [habit]);

  if (!habit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Hábito não encontrado</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleCustomDay = (day: number) => {
    setCustomDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do hábito');
      return;
    }

    if (frequency === 'custom' && customDays.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um dia da semana');
      return;
    }

    updateHabit(habit.id, {
      name: name.trim(),
      category,
      frequency,
      customDays: frequency === 'custom' ? customDays : undefined,
      time: time || undefined,
      reminder,
    });

    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Hábito',
      'Tem certeza que deseja excluir este hábito? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            deleteHabit(habit.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Nome do Hábito</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Beber 2L de água"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipSelected,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Frequência</Text>
          <View style={styles.frequencyContainer}>
            {[
              { value: 'daily', label: 'Diário' },
              { value: 'weekly', label: 'Semanal' },
              { value: 'custom', label: 'Personalizado' },
            ].map((freq) => (
              <TouchableOpacity
                key={freq.value}
                style={[
                  styles.frequencyOption,
                  frequency === freq.value && styles.frequencyOptionSelected,
                ]}
                onPress={() => setFrequency(freq.value as any)}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    frequency === freq.value && styles.frequencyTextSelected,
                  ]}
                >
                  {freq.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {frequency === 'custom' && (
          <View style={styles.section}>
            <Text style={styles.label}>Dias da Semana</Text>
            <View style={styles.daysContainer}>
              {dayNames.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayChip,
                    customDays.includes(index) && styles.dayChipSelected,
                  ]}
                  onPress={() => toggleCustomDay(index)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      customDays.includes(index) && styles.dayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Horário (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 08:00"
            value={time}
            onChangeText={setTime}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.reminderContainer}>
            <Text style={styles.label}>Lembrete</Text>
            <Switch
              value={reminder}
              onValueChange={setReminder}
              trackColor={{ false: '#E5E7EB', true: '#667eea' }}
              thumbColor={reminder ? '#ffffff' : '#9CA3AF'}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Excluir Hábito</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#22223b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#22223b',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#667eea',
  },
  categoryText: {
    color: '#22223b',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  frequencyOptionSelected: {
    backgroundColor: '#667eea',
  },
  frequencyText: {
    color: '#22223b',
    fontWeight: '500',
  },
  frequencyTextSelected: {
    color: '#fff',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
    marginBottom: 8,
  },
  dayChipSelected: {
    backgroundColor: '#667eea',
  },
  dayText: {
    color: '#22223b',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#fff',
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: {
    backgroundColor: '#f87171',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#22223b',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#f87171',
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EditHabitScreen;
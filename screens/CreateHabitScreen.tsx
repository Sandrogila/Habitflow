// CreateHabitScreen.tsx - Versão corrigida
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
import { CreateHabitDto } from '@/services/api';

type CreateHabitScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateHabit'>;
};

const CreateHabitScreen: React.FC<CreateHabitScreenProps> = ({ navigation }) => {
  const { addHabit, categories, loading: contextLoading } = useHabits();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [target, setTarget] = useState('');
  const [color, setColor] = useState('#7C3AED');
  const [loading, setLoading] = useState(false);

  // Cores predefinidas para os hábitos
  const predefinedColors = [
    '#7C3AED', // Purple
    '#2563EB', // Blue
    '#16A34A', // Green
    '#DC2626', // Red
    '#EA580C', // Orange
    '#CA8A04', // Yellow
    '#7C2D12', // Brown
    '#1F2937', // Gray
  ];

  // Opções de frequência válidas
  const frequencyOptions = [
    { value: 'daily', label: 'Todos os dias' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'weekdays', label: 'Dias úteis' },
    { value: 'weekends', label: 'Fins de semana' },
  ];

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome do hábito');
      return false;
    }

    if (name.trim().length < 3) {
      Alert.alert('Erro', 'O nome do hábito deve ter pelo menos 3 caracteres');
      return false;
    }

    if (!frequency) {
      Alert.alert('Erro', 'Selecione uma frequência');
      return false;
    }

    // Validar se a categoria existe se foi selecionada
    if (categoryId && !categories.find(cat => cat.id === categoryId)) {
      Alert.alert('Erro', 'Categoria selecionada não é válida');
      return false;
    }

    return true;
  };

  const handleCreateHabit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Preparar dados do hábito com validações
      const habitData = {
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        frequency: frequency,
        target: target.trim() || undefined,
        color: color,
      };

      // Log para debug
      console.log('=== DADOS SENDO ENVIADOS ===');
      console.log('Dados originais:', habitData);
      
      // Remover campos undefined para evitar problemas na API
     const cleanedData = Object.fromEntries(
       Object.entries(habitData).filter(([_, value]) => value !== undefined)
     ) as unknown as CreateHabitDto;

      
      console.log('Dados limpos:', cleanedData);
      console.log('Categorias disponíveis:', categories.map(c => ({ id: c.id, name: c.name })));
      console.log('================================');

      await addHabit(cleanedData);
      
      Alert.alert('Sucesso', 'Hábito criado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('=== ERRO AO CRIAR HÁBITO ===');
      console.error('Erro completo:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      }
      console.error('===============================');
      
      let errorMessage = 'Não foi possível criar o hábito. Tente novamente.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        if (Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join(', ');
        } else {
          errorMessage = JSON.stringify(error.response.data.errors);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const ColorPicker = () => (
    <View style={styles.colorPickerContainer}>
      {predefinedColors.map((colorOption) => (
        <TouchableOpacity
          key={colorOption}
          style={[
            styles.colorOption,
            { backgroundColor: colorOption },
            color === colorOption && styles.colorOptionSelected
          ]}
          onPress={() => setColor(colorOption)}
          activeOpacity={0.7}
        >
          {color === colorOption && (
            <Text style={styles.colorSelectedText}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

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
              <Text style={styles.greeting}>Olá, Seja bem vindo ao painel criar habitos</Text>
              <Text style={styles.subtitle}>Continue construindo seus hábitos</Text>
            </View>

            <Text style={styles.title}>Adicionar Novo Hábito</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Hábito *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Beber 2L de água"
                  value={name}
                  onChangeText={setName}
                  maxLength={100}
                  returnKeyType="next"
                />
                <Text style={styles.helperText}>Mínimo 3 caracteres</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva detalhes sobre seu hábito..."
                  value={description}
                  onChangeText={setDescription}
                  maxLength={500}
                  multiline
                  numberOfLines={3}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Meta/Objetivo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 30 minutos, 2 litros, 10 páginas"
                  value={target}
                  onChangeText={setTarget}
                  maxLength={100}
                  returnKeyType="next"
                />
                <Text style={styles.helperText}>Defina uma meta específica para seu hábito</Text>
              </View>

              {categories.length > 0 && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Categoria (Opcional)</Text>
                  <View style={styles.categoriesContainer}>
                    <TouchableOpacity
                      style={[
                        styles.categoryButton,
                        !categoryId && styles.categoryButtonSelected
                      ]}
                      onPress={() => setCategoryId('')}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.categoryText,
                        !categoryId && styles.categoryTextSelected
                      ]}>
                        Nenhuma
                      </Text>
                    </TouchableOpacity>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryButton,
                          categoryId === cat.id && { 
                            backgroundColor: cat.color,
                            borderColor: cat.color
                          }
                        ]}
                        onPress={() => setCategoryId(cat.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.categoryText,
                          categoryId === cat.id && styles.categoryTextSelected
                        ]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Frequência *</Text>
                <View style={styles.frequencyContainer}>
                  {frequencyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.frequencyOption,
                        frequency === option.value && styles.frequencyOptionSelected
                      ]}
                      onPress={() => setFrequency(option.value)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.radioButton,
                        frequency === option.value && styles.radioButtonSelected
                      ]}>
                        {frequency === option.value && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.frequencyText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cor do Hábito</Text>
                <ColorPicker />
              </View>

              {/* Debug info - remover em produção */}
          

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: color },
                  (loading || contextLoading) && styles.saveButtonDisabled
                ]}
                onPress={handleCreateHabit}
                disabled={loading || contextLoading}
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
    gap: 8,
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
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
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
  categoryButtonSelected: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
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
  colorPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#1F2937',
    borderWidth: 3,
  },
  colorSelectedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  // Debug styles - remover em produção
  debugContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default CreateHabitScreen;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useHabits } from '../context/HabitContext';

type EditHabitScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditHabit'>;
  route: RouteProp<RootStackParamList, 'EditHabit'>;
};

const EditHabitScreen: React.FC<EditHabitScreenProps> = ({ navigation, route }) => {
  const { habitId } = route.params;
  const { habits, categories, updateHabit, loading } = useHabits();
  
  // Estados do formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedFrequency, setSelectedFrequency] = useState('daily');
  const [target, setTarget] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Encontrar o hábito a ser editado
  const habit = habits.find(h => h.id === habitId);

  // Cores disponíveis
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  // Frequências disponíveis
  const frequencies = [
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekdays', label: 'Dias úteis' },
    { value: 'weekends', label: 'Fins de semana' },
    { value: 'weekly', label: 'Semanalmente' },
  ];

  // Carregar dados do hábito quando a tela é aberta
  useEffect(() => {
    if (habit) {
      setName(habit.name || '');
      setDescription(habit.description || '');
      setSelectedCategoryId(habit.categoryId || '');
      setSelectedFrequency(habit.frequency || 'daily');
      setTarget(habit.target || '');
      setSelectedColor(habit.color || '#3B82F6');
    }
  }, [habit]);

  // Se o hábito não foi encontrado
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

  const handleSubmit = async () => {
    // Validações
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome do hábito é obrigatório.');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('Erro', 'O nome do hábito deve ter pelo menos 2 caracteres.');
      return;
    }

    if (name.trim().length > 100) {
      Alert.alert('Erro', 'O nome do hábito deve ter no máximo 100 caracteres.');
      return;
    }

    if (description.trim().length > 500) {
      Alert.alert('Erro', 'A descrição deve ter no máximo 500 caracteres.');
      return;
    }

    if (target.trim().length > 50) {
      Alert.alert('Erro', 'A meta deve ter no máximo 50 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Preparar dados para atualização
      const updateData = {
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: selectedCategoryId || undefined,
        frequency: selectedFrequency,
        target: target.trim() || undefined,
        color: selectedColor,
      };

      console.log('Atualizando hábito:', habitId, updateData);

      await updateHabit(habitId, updateData);

      Alert.alert(
        'Sucesso',
        'Hábito atualizado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao atualizar hábito:', error);
      Alert.alert(
        'Erro',
        `Não foi possível atualizar o hábito.\n\n${error.message || 'Tente novamente mais tarde.'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Categoria não encontrada';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Editar Hábito</Text>
            <Text style={styles.subtitle}>
              Atualize as informações do seu hábito
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            {/* Nome do Hábito */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do Hábito *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Beber água, Exercitar-se"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
                editable={!isSubmitting}
              />
              <Text style={styles.charCount}>{name.length}/100</Text>
            </View>

            {/* Descrição */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descreva seu hábito (opcional)"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={500}
                editable={!isSubmitting}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>

            {/* Categoria */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoria</Text>
              <View style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    !selectedCategoryId && styles.categoryOptionSelected
                  ]}
                  onPress={() => setSelectedCategoryId('')}
                  disabled={isSubmitting}
                >
                  <View style={[styles.categoryDot, { backgroundColor: '#6B7280' }]} />
                  <Text style={[
                    styles.categoryText,
                    !selectedCategoryId && styles.categoryTextSelected
                  ]}>
                    Sem categoria
                  </Text>
                </TouchableOpacity>

                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategoryId === category.id && styles.categoryOptionSelected
                    ]}
                    onPress={() => setSelectedCategoryId(category.id)}
                    disabled={isSubmitting}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                    <Text style={[
                      styles.categoryText,
                      selectedCategoryId === category.id && styles.categoryTextSelected
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Frequência */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequência *</Text>
              <View style={styles.frequencyContainer}>
                {frequencies.map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.frequencyOption,
                      selectedFrequency === freq.value && styles.frequencyOptionSelected
                    ]}
                    onPress={() => setSelectedFrequency(freq.value)}
                    disabled={isSubmitting}
                  >
                    <Text style={[
                      styles.frequencyText,
                      selectedFrequency === freq.value && styles.frequencyTextSelected
                    ]}>
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Meta */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meta</Text>
              <TextInput
                style={styles.input}
                value={target}
                onChangeText={setTarget}
                placeholder="Ex: 8 copos, 30 minutos"
                placeholderTextColor="#9CA3AF"
                maxLength={50}
                editable={!isSubmitting}
              />
              <Text style={styles.charCount}>{target.length}/50</Text>
            </View>

            {/* Cor */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cor do Hábito</Text>
              <View style={styles.colorContainer}>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setSelectedColor(color)}
                    disabled={isSubmitting}
                  >
                    {selectedColor === color && (
                      <Text style={styles.colorCheckIcon}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Prévia do Hábito</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={[styles.previewDot, { backgroundColor: selectedColor }]} />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName}>
                      {name.trim() || 'Nome do hábito'}
                    </Text>
                    <Text style={styles.previewCategory}>
                      {selectedCategoryId ? getCategoryName(selectedCategoryId) : 'Sem categoria'}
                    </Text>
                    {description.trim() && (
                      <Text style={styles.previewDescription}>
                        {description.trim()}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.previewFrequency}>
                  {frequencies.find(f => f.value === selectedFrequency)?.label}
                </Text>
                {target.trim() && (
                  <Text style={styles.previewTarget}>Meta: {target.trim()}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botões de Ação */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  categoryOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3B82F6',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  frequencyContainer: {
    gap: 12,
  },
  frequencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  frequencyOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3B82F6',
  },
  frequencyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  frequencyTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  colorContainer: {
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
  },
  colorCheckIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    marginTop: 12,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  previewCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  previewFrequency: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  previewTarget: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditHabitScreen;
// CreateCategoryScreen.tsx
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
import { useCategoryContext } from '../context/CategoryContext';
import { CreateCategoryDto } from '../services/api';

type CreateCategoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateCategory'>;
};

const CreateCategoryScreen: React.FC<CreateCategoryScreenProps> = ({ navigation }) => {
  const { createCategory, loading: contextLoading } = useCategoryContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#7C3AED');
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(false);

  // Cores predefinidas para as categorias
  const predefinedColors = [
    '#7C3AED', // Purple
    '#2563EB', // Blue
    '#16A34A', // Green
    '#DC2626', // Red
    '#EA580C', // Orange
    '#CA8A04', // Yellow
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#6366F1', // Indigo
    '#84CC16', // Lime
    '#F97316', // Orange
    '#1F2937', // Gray
  ];

  // Ícones sugeridos para categorias
  const suggestedIcons = [
    '💪', '🏃', '📚', '🧘', '💧', '🍎', '💤', '🎯',
    '🎨', '🎵', '💻', '🏠', '💰', '🌱', '🏆', '❤️'
  ];

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite o nome da categoria');
      return false;
    }

    if (name.trim().length < 2) {
      Alert.alert('Erro', 'O nome da categoria deve ter pelo menos 2 caracteres');
      return false;
    }

    if (name.trim().length > 50) {
      Alert.alert('Erro', 'O nome da categoria deve ter no máximo 50 caracteres');
      return false;
    }

    return true;
  };

  const handleCreateCategory = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Preparar dados da categoria
      const categoryData: CreateCategoryDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        color: color,
      };

      // Log para debug
      console.log('=== DADOS DA CATEGORIA SENDO ENVIADOS ===');
      console.log('Dados:', categoryData);
      console.log('========================================');

      await createCategory(categoryData);
      
      Alert.alert('Sucesso', 'Categoria criada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('=== ERRO AO CRIAR CATEGORIA ===');
      console.error('Erro completo:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      console.error('===============================');
      
      let errorMessage = 'Não foi possível criar a categoria. Tente novamente.';
      
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

  const IconPicker = () => (
    <View style={styles.iconPickerContainer}>
      <TouchableOpacity
        style={[
          styles.iconOption,
          !icon && styles.iconOptionSelected
        ]}
        onPress={() => setIcon('')}
        activeOpacity={0.7}
      >
        <Text style={styles.iconOptionText}>Sem ícone</Text>
      </TouchableOpacity>
      {suggestedIcons.map((iconOption) => (
        <TouchableOpacity
          key={iconOption}
          style={[
            styles.iconOption,
            icon === iconOption && styles.iconOptionSelected
          ]}
          onPress={() => setIcon(iconOption)}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>{iconOption}</Text>
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
              <Text style={styles.greeting}>Organize seus hábitos</Text>
              <Text style={styles.subtitle}>Crie categorias para agrupar melhor seus hábitos</Text>
            </View>

            <Text style={styles.title}>Nova Categoria</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome da Categoria *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Saúde, Estudos, Fitness..."
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                  returnKeyType="next"
                />
                <Text style={styles.helperText}>Mínimo 2 caracteres, máximo 50</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva o que essa categoria representa..."
                  value={description}
                  onChangeText={setDescription}
                  maxLength={200}
                  multiline
                  numberOfLines={3}
                  returnKeyType="next"
                />
                <Text style={styles.helperText}>Opcional - máximo 200 caracteres</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ícone da Categoria</Text>
                <IconPicker />
                <Text style={styles.helperText}>Escolha um emoji para representar sua categoria</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cor da Categoria</Text>
                <ColorPicker />
                <Text style={styles.helperText}>Esta cor será usada para destacar hábitos desta categoria</Text>
              </View>

              {/* Preview da categoria */}
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Pré-visualização:</Text>
                <View style={[styles.previewCard, { borderColor: color }]}>
                  <View style={styles.previewHeader}>
                    {icon ? (
                      <Text style={styles.previewIcon}>{icon}</Text>
                    ) : (
                      <View style={[styles.previewIconPlaceholder, { backgroundColor: color }]} />
                    )}
                    <Text style={[styles.previewName, { color: color }]}>
                      {name || 'Nome da categoria'}
                    </Text>
                  </View>
                  {description && (
                    <Text style={styles.previewDescription}>{description}</Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: color },
                  (loading || contextLoading) && styles.saveButtonDisabled
                ]}
                onPress={handleCreateCategory}
                disabled={loading || contextLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Salvando...' : 'Criar Categoria'}
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
  iconPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
  iconOptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  iconText: {
    fontSize: 20,
  },
  previewContainer: {
    marginTop: 8,
    gap: 12,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  previewIcon: {
    fontSize: 24,
  },
  previewIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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

export default CreateCategoryScreen;
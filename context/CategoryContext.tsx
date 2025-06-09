// contexts/CategoryContext.tsx
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto, CategoryService } from '../services/api';

// Tipos para o estado das categorias
interface CategoryState {
  categories: CategoryDto[];
  loading: boolean;
  error: string | null;
  selectedCategory: CategoryDto | null;
}

// Tipos para as ações do reducer
type CategoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CATEGORIES'; payload: CategoryDto[] }
  | { type: 'ADD_CATEGORY'; payload: CategoryDto }
  | { type: 'UPDATE_CATEGORY'; payload: CategoryDto }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORY'; payload: CategoryDto | null }
  | { type: 'CLEAR_STATE' };

// Tipos para o contexto
interface CategoryContextType {
  // Estado
  categories: CategoryDto[];
  loading: boolean;
  error: string | null;
  selectedCategory: CategoryDto | null;
  
  // Ações
  loadCategories: () => Promise<void>;
  createCategory: (categoryData: CreateCategoryDto) => Promise<CategoryDto>;
  updateCategory: (categoryId: string, categoryData: UpdateCategoryDto) => Promise<CategoryDto>;
  deleteCategory: (categoryId: string) => Promise<void>;
  selectCategory: (category: CategoryDto | null) => void;
  getCategoryById: (categoryId: string) => CategoryDto | undefined;
  clearError: () => void;
  clearState: () => void;
}

// Estado inicial
const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
  selectedCategory: null,
};

// Reducer para gerenciar o estado das categorias
const categoryReducer = (state: CategoryState, action: CategoryAction): CategoryState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
        loading: false,
        error: null,
      };

    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
        loading: false,
        error: null,
      };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        ),
        selectedCategory: state.selectedCategory?.id === action.payload.id 
          ? action.payload 
          : state.selectedCategory,
        loading: false,
        error: null,
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload),
        selectedCategory: state.selectedCategory?.id === action.payload 
          ? null 
          : state.selectedCategory,
        loading: false,
        error: null,
      };

    case 'SET_SELECTED_CATEGORY':
      return {
        ...state,
        selectedCategory: action.payload,
      };

    case 'CLEAR_STATE':
      return initialState;

    default:
      return state;
  }
};

// Criação do contexto
const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Props do provider
interface CategoryProviderProps {
  children: ReactNode;
}

// Provider do contexto
export const CategoryProvider: React.FC<CategoryProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(categoryReducer, initialState);

  // Carregar todas as categorias
  const loadCategories = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const categories = await CategoryService.getCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar categorias';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Erro ao carregar categorias:', error);
    }
  }, []);

  // Criar nova categoria
  const createCategory = useCallback(async (categoryData: CreateCategoryDto): Promise<CategoryDto> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const newCategory = await CategoryService.createCategory(categoryData);
      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
      
      return newCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar categoria';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  }, []);

  // Atualizar categoria existente
  const updateCategory = useCallback(async (categoryId: string, categoryData: UpdateCategoryDto): Promise<CategoryDto> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const updatedCategory = await CategoryService.updateCategory(categoryId, categoryData);
      dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
      
      return updatedCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar categoria';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  }, []);

  // Deletar categoria
  const deleteCategory = useCallback(async (categoryId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await CategoryService.deleteCategory(categoryId);
      dispatch({ type: 'DELETE_CATEGORY', payload: categoryId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar categoria';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Erro ao deletar categoria:', error);
      throw error;
    }
  }, []);

  // Selecionar categoria
  const selectCategory = useCallback((category: CategoryDto | null): void => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
  }, []);

  // Buscar categoria por ID
  const getCategoryById = useCallback((categoryId: string): CategoryDto | undefined => {
    return state.categories.find(category => category.id === categoryId);
  }, [state.categories]);

  // Limpar erro
  const clearError = useCallback((): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Limpar estado completo
  const clearState = useCallback((): void => {
    dispatch({ type: 'CLEAR_STATE' });
  }, []);

  // Valor do contexto
  const contextValue: CategoryContextType = {
    // Estado
    categories: state.categories,
    loading: state.loading,
    error: state.error,
    selectedCategory: state.selectedCategory,
    
    // Ações
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    selectCategory,
    getCategoryById,
    clearError,
    clearState,
  };

  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
};

// Hook para usar o contexto
export const useCategoryContext = (): CategoryContextType => {
  const context = useContext(CategoryContext);
  
  if (context === undefined) {
    throw new Error('useCategoryContext deve ser usado dentro de um CategoryProvider');
  }
  
  return context;
};

// Hook personalizado para operações específicas de categorias
export const useCategories = () => {
  const context = useCategoryContext();
  
  return {
    // Estado básico
    categories: context.categories,
    loading: context.loading,
    error: context.error,
    
    // Operações CRUD
    loadCategories: context.loadCategories,
    createCategory: context.createCategory,
    updateCategory: context.updateCategory,
    deleteCategory: context.deleteCategory,
    
    // Utilitários
    getCategoryById: context.getCategoryById,
    clearError: context.clearError,
  };
};

// Hook personalizado para seleção de categoria
export const useCategorySelection = () => {
  const context = useCategoryContext();
  
  return {
    selectedCategory: context.selectedCategory,
    selectCategory: context.selectCategory,
    categories: context.categories,
  };
};

export default CategoryContext;
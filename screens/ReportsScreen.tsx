import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type ReportsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartData = [
    { day: 'D', height: 60, completed: 3 },
    { day: 'S', height: 40, completed: 2 },
    { day: 'T', height: 20, completed: 1 },
    { day: 'Q', height: 80, completed: 4 },
    { day: 'Q', height: 60, completed: 3 },
    { day: 'S', height: 100, completed: 5 },
    { day: 'S', height: 80, completed: 4 },
  ];

  const categories = [
    { name: 'Saúde', color: '#2563EB', count: 1 },
    { name: 'Educação', color: '#16A34A', count: 1 },
    { name: 'Exercício', color: '#EA580C', count: 1 },
  ];

  const ChartBar = ({ day, height, completed }: { day: string; height: number; completed: number }) => (
    <View style={styles.chartBarContainer}>
      <View style={[styles.chartBar, { height: height * 0.8 }]} />
      <Text style={styles.chartDay}>{day}</Text>
    </View>
  );

  const CategoryItem = ({ name, color, count }: { name: string; color: string; count: number }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryLeft}>
        <View style={[styles.categoryDot, { backgroundColor: color }]} />
        <Text style={styles.categoryName}>{name}</Text>
      </View>
      <Text style={styles.categoryCount}>{count} hábito</Text>
    </View>
  );

  const TabButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estatísticas</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TabButton title="Início" isActive={false} onPress={() => navigation.navigate('MainTabs')} />
          <TabButton title="Estatísticas" isActive={true} onPress={() => {}} />
          <TabButton title="Conquistas" isActive={false} onPress={() => navigation.navigate('Conquistas')} />
        </View>

        {/* Progress Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progresso dos Últimos 7 Dias</Text>
          
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {chartData.map((item, index) => (
                <ChartBar 
                  key={index} 
                  day={item.day} 
                  height={item.height} 
                  completed={item.completed} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hábitos por Categoria</Text>
          
          <View style={styles.categoriesContainer}>
            {categories.map((category, index) => (
              <CategoryItem
                key={index}
                name={category.name}
                color={category.color}
                count={category.count}
              />
            ))}
          </View>
        </View>

        {/* Weekly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas da Semana</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>21</Text>
              <Text style={styles.statLabel}>Hábitos Completados</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>86%</Text>
              <Text style={styles.statLabel}>Taxa de Sucesso</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Sequência Atual</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Hábitos Ativos</Text>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeTabButton: {
    backgroundColor: '#7C3AED',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    marginBottom: 8,
  },
  chartDay: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoriesContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ReportsScreen;
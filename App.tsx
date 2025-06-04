import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HabitFlow from './screens/HabitFlow';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import CreateHabitScreen from './screens/CreateHabitScreen';
import EditHabitScreen from './screens/EditHabitScreen';
import ReportsScreen from './screens/ReportsScreen';
import ProfileScreen from './screens/ProfileScreen';
import ConquistasScreen from './screens/ConquistasScreen';
import { HabitProvider } from './context/HabitContext';
import { View, Text } from 'react-native';

// Ícones para tabs
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <View style={{
    width: 24,
    height: 24,
    backgroundColor: focused ? '#7C3AED' : '#9CA3AF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
      {name}
    </Text>
  </View>
);

export type RootStackParamList = {
  HabitFlow: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  CreateHabit: undefined;
  EditHabit: { habitId: string };
  Reports: undefined;
  Profile: undefined;
  Conquistas: undefined;
};

export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Reports: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendário',
          tabBarIcon: ({ focused }) => <TabIcon name="📅" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Estatísticas',
          tabBarIcon: ({ focused }) => <TabIcon name="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const App: React.FC = () => {
  return (
    <HabitProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="HabitFlow"
          screenOptions={{
            headerShown: false,
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#1F2937',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        >
          <Stack.Screen name="HabitFlow" component={HabitFlow} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="CreateHabit" 
            component={CreateHabitScreen}
            options={{
              headerShown: true,
              title: 'Novo Hábito',
              headerBackTitle: 'Voltar',
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="EditHabit" 
            component={EditHabitScreen}
            options={{
              headerShown: true,
              title: 'Editar Hábito',
              headerBackTitle: 'Voltar',
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="Reports" 
            component={ReportsScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Conquistas" 
            component={ConquistasScreen}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </HabitProvider>
  );
};

export default App;
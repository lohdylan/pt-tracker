import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Text } from "react-native";
import { colors } from "./src/theme";

import ClientListScreen from "./src/screens/clients/ClientListScreen";
import ClientDetailScreen from "./src/screens/clients/ClientDetailScreen";
import ClientFormScreen from "./src/screens/clients/ClientFormScreen";
import MeasurementFormScreen from "./src/screens/clients/MeasurementFormScreen";
import ProgressChartScreen from "./src/screens/clients/ProgressChartScreen";

import CalendarScreen from "./src/screens/calendar/CalendarScreen";
import SessionDetailScreen from "./src/screens/calendar/SessionDetailScreen";
import SessionFormScreen from "./src/screens/calendar/SessionFormScreen";

import TemplateListScreen from "./src/screens/workouts/TemplateListScreen";
import TemplateFormScreen from "./src/screens/workouts/TemplateFormScreen";
import WorkoutLogScreen from "./src/screens/workouts/WorkoutLogScreen";

import DashboardScreen from "./src/screens/dashboard/DashboardScreen";

const queryClient = new QueryClient();

type HomeStackParams = {
  Dashboard: undefined;
  SessionDetail: { sessionId: number };
  SessionForm: { sessionId?: number; date?: string; clientId?: number };
  ClientForm: { clientId?: number };
};

type ClientsStackParams = {
  ClientList: undefined;
  ClientDetail: { clientId: number };
  ClientForm: { clientId?: number };
  MeasurementForm: { clientId: number; measurementId?: number };
  ProgressChart: { clientId: number };
  SessionDetail: { sessionId: number };
  WorkoutLog: { sessionId: number };
};

type CalendarStackParams = {
  Calendar: undefined;
  SessionDetail: { sessionId: number };
  SessionForm: { sessionId?: number; date?: string; clientId?: number };
  WorkoutLog: { sessionId: number };
};

type WorkoutsStackParams = {
  TemplateList: undefined;
  TemplateForm: { templateId?: number };
  WorkoutLog: { sessionId: number };
};

const HomeStack = createNativeStackNavigator<HomeStackParams>();
const ClientsStack = createNativeStackNavigator<ClientsStackParams>();
const CalendarStack = createNativeStackNavigator<CalendarStackParams>();
const WorkoutsStack = createNativeStackNavigator<WorkoutsStackParams>();
const Tab = createBottomTabNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Dashboard" }} />
      <HomeStack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: "Session" }} />
      <HomeStack.Screen name="SessionForm" component={SessionFormScreen} options={{ title: "Book Session" }} />
      <HomeStack.Screen name="ClientForm" component={ClientFormScreen} options={{ title: "New Client" }} />
    </HomeStack.Navigator>
  );
}

function ClientsNavigator() {
  return (
    <ClientsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <ClientsStack.Screen name="ClientList" component={ClientListScreen} options={{ title: "Clients" }} />
      <ClientsStack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: "Client" }} />
      <ClientsStack.Screen name="ClientForm" component={ClientFormScreen} options={{ title: "Client" }} />
      <ClientsStack.Screen name="MeasurementForm" component={MeasurementFormScreen} options={{ title: "Measurement" }} />
      <ClientsStack.Screen name="ProgressChart" component={ProgressChartScreen} options={{ title: "Progress" }} />
      <ClientsStack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: "Session" }} />
      <ClientsStack.Screen name="WorkoutLog" component={WorkoutLogScreen} options={{ title: "Log Workout" }} />
    </ClientsStack.Navigator>
  );
}

function CalendarNavigator() {
  return (
    <CalendarStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <CalendarStack.Screen name="Calendar" component={CalendarScreen} options={{ title: "Calendar" }} />
      <CalendarStack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: "Session" }} />
      <CalendarStack.Screen name="SessionForm" component={SessionFormScreen} options={{ title: "Book Session" }} />
      <CalendarStack.Screen name="WorkoutLog" component={WorkoutLogScreen} options={{ title: "Log Workout" }} />
    </CalendarStack.Navigator>
  );
}

function WorkoutsNavigator() {
  return (
    <WorkoutsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <WorkoutsStack.Screen name="TemplateList" component={TemplateListScreen} options={{ title: "Templates" }} />
      <WorkoutsStack.Screen name="TemplateForm" component={TemplateFormScreen} options={{ title: "Template" }} />
      <WorkoutsStack.Screen name="WorkoutLog" component={WorkoutLogScreen} options={{ title: "Log Workout" }} />
    </WorkoutsStack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: "🏠", Clients: "👥", Calendar: "📅", Workouts: "💪" };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || "•"}
    </Text>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.secondary,
          })}
        >
          <Tab.Screen name="Home" component={HomeNavigator} />
          <Tab.Screen name="Clients" component={ClientsNavigator} />
          <Tab.Screen name="Calendar" component={CalendarNavigator} />
          <Tab.Screen name="Workouts" component={WorkoutsNavigator} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </QueryClientProvider>
  );
}

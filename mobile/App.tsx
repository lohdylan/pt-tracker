import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "./src/theme";
import { AuthProvider, useAuth } from "./src/AuthContext";
import LogoutButton from "./src/components/LogoutButton";
import UnreadBadge from "./src/components/UnreadBadge";
import { useUnreadCount } from "./src/hooks/useMessages";
import { requestNotificationPermission, addNotificationResponseListener } from "./src/services/notifications";
import { useRegisterPushToken, useUnregisterPushToken } from "./src/hooks/useNotifications";

// Trainer screens
import ClientListScreen from "./src/screens/clients/ClientListScreen";
import ClientDetailScreen from "./src/screens/clients/ClientDetailScreen";
import ClientFormScreen from "./src/screens/clients/ClientFormScreen";
import MeasurementFormScreen from "./src/screens/clients/MeasurementFormScreen";
import ProgressChartScreen from "./src/screens/clients/ProgressChartScreen";
import ProgressPhotosScreen from "./src/screens/clients/ProgressPhotosScreen";
import PhotoComparisonScreen from "./src/screens/clients/PhotoComparisonScreen";
import CalendarScreen from "./src/screens/calendar/CalendarScreen";
import SessionDetailScreen from "./src/screens/calendar/SessionDetailScreen";
import SessionFormScreen from "./src/screens/calendar/SessionFormScreen";
import TemplateListScreen from "./src/screens/workouts/TemplateListScreen";
import TemplateFormScreen from "./src/screens/workouts/TemplateFormScreen";
import WorkoutLogScreen from "./src/screens/workouts/WorkoutLogScreen";
import DashboardScreen from "./src/screens/dashboard/DashboardScreen";

// Exercise screens (shared)
import ExerciseListScreen from "./src/screens/exercises/ExerciseListScreen";
import ExerciseDetailScreen from "./src/screens/exercises/ExerciseDetailScreen";
import ExerciseFormScreen from "./src/screens/exercises/ExerciseFormScreen";

// Client portal screens
import MySessionsScreen from "./src/screens/portal/MySessionsScreen";
import ClientSessionDetailScreen from "./src/screens/portal/ClientSessionDetailScreen";
import MyProgressScreen from "./src/screens/portal/MyProgressScreen";
import MyWorkoutLogScreen from "./src/screens/portal/MyWorkoutLogScreen";
import MyPhotosScreen from "./src/screens/portal/MyPhotosScreen";

// Messaging screens
import ConversationListScreen from "./src/screens/messages/ConversationListScreen";
import ChatScreen from "./src/screens/messages/ChatScreen";
import ClientChatScreen from "./src/screens/messages/ClientChatScreen";

// Settings screens
import NotificationSettingsScreen from "./src/screens/settings/NotificationSettingsScreen";

// Auth
import LoginScreen from "./src/screens/auth/LoginScreen";

const queryClient = new QueryClient();

// ── Trainer stack params ──
type HomeStackParams = {
  Dashboard: undefined;
  SessionDetail: { sessionId: number };
  SessionForm: { sessionId?: number; date?: string; clientId?: number };
  ClientForm: { clientId?: number };
  NotificationSettings: undefined;
};

type ClientsStackParams = {
  ClientList: undefined;
  ClientDetail: { clientId: number };
  ClientForm: { clientId?: number };
  MeasurementForm: { clientId: number; measurementId?: number };
  ProgressChart: { clientId: number };
  ProgressPhotos: { clientId: number };
  PhotoComparison: { clientId: number };
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

type ExercisesStackParams = {
  ExerciseList: undefined;
  ExerciseDetail: { exerciseId: number };
  ExerciseForm: { exerciseId?: number };
};

type MessagesStackParams = {
  ConversationList: undefined;
  Chat: { clientId: number; name: string };
};

// ── Client stack params ──
type ClientSessionsStackParams = {
  MySessions: undefined;
  ClientSessionDetail: { sessionId: number };
};

type ClientProgressStackParams = {
  MyProgress: undefined;
  MyPhotos: undefined;
};

type ClientExercisesStackParams = {
  ExerciseList: undefined;
  ExerciseDetail: { exerciseId: number };
};

type ClientLogsStackParams = {
  MyWorkoutLog: undefined;
  ClientSessionDetail: { sessionId: number };
};

type ClientMessagesStackParams = {
  ClientChat: undefined;
};

// ── Navigators ──
const HomeStack = createNativeStackNavigator<HomeStackParams>();
const ClientsStack = createNativeStackNavigator<ClientsStackParams>();
const CalendarStack = createNativeStackNavigator<CalendarStackParams>();
const WorkoutsStack = createNativeStackNavigator<WorkoutsStackParams>();
const ExercisesStack = createNativeStackNavigator<ExercisesStackParams>();
const MessagesStack = createNativeStackNavigator<MessagesStackParams>();

const ClientSessionsStack = createNativeStackNavigator<ClientSessionsStackParams>();
const ClientProgressStack = createNativeStackNavigator<ClientProgressStackParams>();
const ClientExercisesStack = createNativeStackNavigator<ClientExercisesStackParams>();
const ClientLogsStack = createNativeStackNavigator<ClientLogsStackParams>();
const ClientMessagesStack = createNativeStackNavigator<ClientMessagesStackParams>();

const Tab = createBottomTabNavigator();

const headerStyle = { backgroundColor: colors.primary };
const headerTintColor = "#fff";
const headerTitleStyle = { fontWeight: "600" as const };
const screenOptions = { headerStyle, headerTintColor, headerTitleStyle };

function headerRight() {
  return <LogoutButton />;
}

// ── Trainer navigators ──
function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Dashboard", headerRight }} />
      <HomeStack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: "Session" }} />
      <HomeStack.Screen name="SessionForm" component={SessionFormScreen} options={{ title: "Book Session" }} />
      <HomeStack.Screen name="ClientForm" component={ClientFormScreen} options={{ title: "New Client" }} />
      <HomeStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: "Notifications" }} />
    </HomeStack.Navigator>
  );
}

function ClientsNavigator() {
  return (
    <ClientsStack.Navigator screenOptions={screenOptions}>
      <ClientsStack.Screen name="ClientList" component={ClientListScreen} options={{ title: "Clients" }} />
      <ClientsStack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: "Client" }} />
      <ClientsStack.Screen name="ClientForm" component={ClientFormScreen} options={{ title: "Client" }} />
      <ClientsStack.Screen name="MeasurementForm" component={MeasurementFormScreen} options={{ title: "Measurement" }} />
      <ClientsStack.Screen name="ProgressChart" component={ProgressChartScreen} options={{ title: "Progress" }} />
      <ClientsStack.Screen name="ProgressPhotos" component={ProgressPhotosScreen} options={{ title: "Progress Photos" }} />
      <ClientsStack.Screen name="PhotoComparison" component={PhotoComparisonScreen} options={{ title: "Compare" }} />
      <ClientsStack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: "Session" }} />
      <ClientsStack.Screen name="WorkoutLog" component={WorkoutLogScreen} options={{ title: "Log Workout" }} />
    </ClientsStack.Navigator>
  );
}

function CalendarNavigator() {
  return (
    <CalendarStack.Navigator screenOptions={screenOptions}>
      <CalendarStack.Screen name="Calendar" component={CalendarScreen} options={{ title: "Calendar" }} />
      <CalendarStack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: "Session" }} />
      <CalendarStack.Screen name="SessionForm" component={SessionFormScreen} options={{ title: "Book Session" }} />
      <CalendarStack.Screen name="WorkoutLog" component={WorkoutLogScreen} options={{ title: "Log Workout" }} />
    </CalendarStack.Navigator>
  );
}

function WorkoutsNavigator() {
  return (
    <WorkoutsStack.Navigator screenOptions={screenOptions}>
      <WorkoutsStack.Screen name="TemplateList" component={TemplateListScreen} options={{ title: "Templates" }} />
      <WorkoutsStack.Screen name="TemplateForm" component={TemplateFormScreen} options={{ title: "Template" }} />
      <WorkoutsStack.Screen name="WorkoutLog" component={WorkoutLogScreen} options={{ title: "Log Workout" }} />
    </WorkoutsStack.Navigator>
  );
}

function ExercisesNavigator() {
  return (
    <ExercisesStack.Navigator screenOptions={screenOptions}>
      <ExercisesStack.Screen name="ExerciseList" component={ExerciseListScreen} options={{ title: "Exercises" }} />
      <ExercisesStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: "Exercise" }} />
      <ExercisesStack.Screen name="ExerciseForm" component={ExerciseFormScreen} options={{ title: "Exercise" }} />
    </ExercisesStack.Navigator>
  );
}

function TrainerMessagesNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={screenOptions}>
      <MessagesStack.Screen name="ConversationList" component={ConversationListScreen} options={{ title: "Messages" }} />
      <MessagesStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }: any) => ({ title: route.params?.name || "Chat" })}
      />
    </MessagesStack.Navigator>
  );
}

// ── Client navigators ──
function ClientSessionsNavigator() {
  return (
    <ClientSessionsStack.Navigator screenOptions={screenOptions}>
      <ClientSessionsStack.Screen name="MySessions" component={MySessionsScreen} options={{ title: "My Sessions", headerRight }} />
      <ClientSessionsStack.Screen name="ClientSessionDetail" component={ClientSessionDetailScreen} options={{ title: "Session" }} />
    </ClientSessionsStack.Navigator>
  );
}

function ClientProgressNavigator() {
  return (
    <ClientProgressStack.Navigator screenOptions={screenOptions}>
      <ClientProgressStack.Screen name="MyProgress" component={MyProgressScreen} options={{ title: "My Progress" }} />
      <ClientProgressStack.Screen name="MyPhotos" component={MyPhotosScreen} options={{ title: "Progress Photos" }} />
    </ClientProgressStack.Navigator>
  );
}

function ClientExercisesNavigator() {
  return (
    <ClientExercisesStack.Navigator screenOptions={screenOptions}>
      <ClientExercisesStack.Screen name="ExerciseList" component={ExerciseListScreen} options={{ title: "Exercises" }} />
      <ClientExercisesStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: "Exercise" }} />
    </ClientExercisesStack.Navigator>
  );
}

function ClientLogsNavigator() {
  return (
    <ClientLogsStack.Navigator screenOptions={screenOptions}>
      <ClientLogsStack.Screen name="MyWorkoutLog" component={MyWorkoutLogScreen} options={{ title: "Workout Logs" }} />
      <ClientLogsStack.Screen name="ClientSessionDetail" component={ClientSessionDetailScreen} options={{ title: "Session" }} />
    </ClientLogsStack.Navigator>
  );
}

function ClientMessagesNavigator() {
  return (
    <ClientMessagesStack.Navigator screenOptions={screenOptions}>
      <ClientMessagesStack.Screen name="ClientChat" component={ClientChatScreen} options={{ title: "Messages" }} />
    </ClientMessagesStack.Navigator>
  );
}

// ── Tab icons ──
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: "🏠",
    Clients: "👥",
    Calendar: "📅",
    Workouts: "💪",
    Exercises: "📖",
    Messages: "💬",
    Sessions: "📅",
    Progress: "📈",
    Logs: "📋",
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || "•"}
    </Text>
  );
}

// ── Messages tab icon with unread badge ──
function MessagesTabIcon({ focused }: { focused: boolean }) {
  const { data } = useUnreadCount();
  const count = data?.count || 0;
  return (
    <View>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>💬</Text>
      <UnreadBadge count={count} />
    </View>
  );
}

// ── Tab navigators ──
function TrainerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) =>
          route.name === "Messages"
            ? <MessagesTabIcon focused={focused} />
            : <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Clients" component={ClientsNavigator} />
      <Tab.Screen name="Calendar" component={CalendarNavigator} />
      <Tab.Screen name="Workouts" component={WorkoutsNavigator} />
      <Tab.Screen name="Exercises" component={ExercisesNavigator} />
      <Tab.Screen name="Messages" component={TrainerMessagesNavigator} />
    </Tab.Navigator>
  );
}

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) =>
          route.name === "Messages"
            ? <MessagesTabIcon focused={focused} />
            : <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
      })}
    >
      <Tab.Screen name="Sessions" component={ClientSessionsNavigator} />
      <Tab.Screen name="Progress" component={ClientProgressNavigator} />
      <Tab.Screen name="Exercises" component={ClientExercisesNavigator} />
      <Tab.Screen name="Logs" component={ClientLogsNavigator} />
      <Tab.Screen name="Messages" component={ClientMessagesNavigator} />
    </Tab.Navigator>
  );
}

// ── App content with notifications ──
function AppContent() {
  const { user, isLoading } = useAuth();
  const navigationRef = useNavigationContainerRef();
  const registerToken = useRegisterPushToken();
  const pushTokenRef = useRef<string | null>(null);

  // Register for push notifications after auth
  useEffect(() => {
    if (!user) return;
    (async () => {
      const token = await requestNotificationPermission();
      if (token) {
        pushTokenRef.current = token;
        registerToken.mutate({ expo_push_token: token });
      }
    })();
  }, [user?.role, user?.clientId]);

  // Handle notification taps — navigate to relevant screen
  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (!navigationRef.current) return;

      if (data?.type === "message") {
        (navigationRef.current as any).navigate("Messages");
      } else if (data?.type === "session_reminder" || data?.type === "session_scheduled") {
        if (user?.role === "client") {
          (navigationRef.current as any).navigate("Sessions");
        } else {
          (navigationRef.current as any).navigate("Calendar");
        }
      } else if (data?.type === "measurement_recorded") {
        if (user?.role === "client") {
          (navigationRef.current as any).navigate("Progress");
        }
      }
    });
    return () => sub.remove();
  }, [user]);

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user.role === "trainer" ? <TrainerTabs /> : <ClientTabs />}
    </NavigationContainer>
  );
}

const loadingStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <StatusBar style="light" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

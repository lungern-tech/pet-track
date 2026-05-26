import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppProviders } from './src/providers/AppProviders';
import { useAuthStore } from './src/store/authStore';
import {
  HomeScreen,
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  MapScreen,
  HealthScreen,
  SettingsScreen,
  NotificationListScreen,
  NotificationSettingsScreen,
  DeviceManagementScreen,
  HelpFeedbackScreen,
  FeedbackFormScreen,
  PetInfoEntryScreen,
  DeviceMatchScreen,
  DeviceMatchSuccessScreen,
  ProfileScreen,
  AboutPrivacyScreen,
  TermsOfServiceScreen,
  PrivacyPolicyScreen,
  BleSearchScreen,
  FenceCreateScreen,
} from './src/screens';
import { MainTabRoute, RootStackRoute } from './src/navigation/types';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const TAB_COLORS = {
  active: '#3D8A5A',
  inactive: '#A8A7A5',
};

function MainTabs() {
  return (
    <Tab.Navigator
      lazy
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: TAB_COLORS.active,
        tabBarInactiveTintColor: TAB_COLORS.inactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name={MainTabRoute.Home}
        component={HomeScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={MainTabRoute.Map}
        component={MapScreen}
        options={{
          tabBarLabel: '地图',
          tabBarIcon: ({ color, size }) => (
            <Feather name="map" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={MainTabRoute.Health}
        component={HealthScreen}
        options={{
          tabBarLabel: '健康',
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={MainTabRoute.Settings}
        component={SettingsScreen}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthGate() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!hydrated) {
    return (
      <View style={styles.bootSplash}>
        <ActivityIndicator size="large" color={TAB_COLORS.active} />
      </View>
    );
  }

  const isAuthed = !!accessToken;

  return (
    <RootStack.Navigator
      key={isAuthed ? 'authed' : 'guest'}
      screenOptions={{ headerShown: false }}
      initialRouteName={isAuthed ? RootStackRoute.MainTabs : RootStackRoute.Login}
    >
      {isAuthed ? (
        <>
          <RootStack.Screen
            name={RootStackRoute.MainTabs}
            component={MainTabs}
          />
          <RootStack.Screen
            name={RootStackRoute.Notifications}
            component={NotificationListScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.NotificationSettings}
            component={NotificationSettingsScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.DeviceManagement}
            component={DeviceManagementScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.HelpFeedback}
            component={HelpFeedbackScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.FeedbackForm}
            component={FeedbackFormScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.Profile}
            component={ProfileScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.AboutPrivacy}
            component={AboutPrivacyScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.PrivacyPolicy}
            component={PrivacyPolicyScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.TermsOfService}
            component={TermsOfServiceScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.BleSearch}
            component={BleSearchScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.PetInfoEntry}
            component={PetInfoEntryScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.DeviceMatch}
            component={DeviceMatchScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.DeviceMatchSuccess}
            component={DeviceMatchSuccessScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.FenceCreate}
            component={FenceCreateScreen}
          />
        </>
      ) : (
        <>
          <RootStack.Screen name={RootStackRoute.Login} component={LoginScreen} />
          <RootStack.Screen
            name={RootStackRoute.PrivacyPolicy}
            component={PrivacyPolicyScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.TermsOfService}
            component={TermsOfServiceScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.Register}
            component={RegisterScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.ForgotPassword}
            component={ForgotPasswordScreen}
          />
          <RootStack.Screen
            name={RootStackRoute.ResetPassword}
            component={ResetPasswordScreen}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <AppProviders>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AuthGate />
      </NavigationContainer>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  bootSplash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 28,
    height: 72,
    shadowColor: '#1A1918',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -1 },
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  tabItem: {
    paddingVertical: 4,
  },
});

import type { NavigatorScreenParams } from '@react-navigation/native';

export enum RootStackRoute {
  MainTabs = 'MainTabs',
  Login = 'Login',
  Register = 'Register',
  ForgotPassword = 'ForgotPassword',
  ResetPassword = 'ResetPassword',
  Notifications = 'Notifications',
  NotificationSettings = 'NotificationSettings',
  DeviceManagement = 'DeviceManagement',
  HelpFeedback = 'HelpFeedback',
  FeedbackForm = 'FeedbackForm',
  PetInfoEntry = 'PetInfoEntry',
  DeviceMatch = 'DeviceMatch',
  DeviceMatchSuccess = 'DeviceMatchSuccess',
  Profile = 'Profile',
  AboutPrivacy = 'AboutPrivacy',
  TermsOfService = 'TermsOfService',
  PrivacyPolicy = 'PrivacyPolicy',
  BleSearch = 'BleSearch',
}

export type RootStackParamList = {
  [RootStackRoute.MainTabs]: NavigatorScreenParams<MainTabParamList> | undefined;
  [RootStackRoute.Login]: undefined;
  [RootStackRoute.Register]: undefined;
  [RootStackRoute.ForgotPassword]: undefined;
  [RootStackRoute.ResetPassword]: undefined;
  [RootStackRoute.Notifications]: undefined;
  [RootStackRoute.NotificationSettings]: undefined;
  [RootStackRoute.DeviceManagement]: undefined;
  [RootStackRoute.HelpFeedback]: undefined;
  [RootStackRoute.FeedbackForm]: undefined;
  [RootStackRoute.PetInfoEntry]: undefined;
  [RootStackRoute.DeviceMatch]: undefined;
  [RootStackRoute.DeviceMatchSuccess]: {
    deviceId?: string;
    petName?: string;
  } | undefined;
  [RootStackRoute.Profile]: undefined;
  [RootStackRoute.AboutPrivacy]: undefined;
  [RootStackRoute.TermsOfService]: undefined;
  [RootStackRoute.PrivacyPolicy]: undefined;
  [RootStackRoute.BleSearch]:
    | {
        autoStart?: boolean;
      }
    | undefined;
};

export enum MainTabRoute {
  Home = 'Home',
  Map = 'Map',
  Health = 'Health',
  Settings = 'Settings', // kept for type compatibility, now used as “我的”
}

export type MainTabParamList = {
  [MainTabRoute.Home]: undefined;
  [MainTabRoute.Map]: undefined;
  [MainTabRoute.Health]: undefined;
  [MainTabRoute.Settings]: undefined;
};


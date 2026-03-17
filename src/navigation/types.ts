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
  DeviceMatch = 'DeviceMatch',
  DeviceMatchSuccess = 'DeviceMatchSuccess',
  Profile = 'Profile',
  AboutPrivacy = 'AboutPrivacy',
  BleSearch = 'BleSearch',
}

export type RootStackParamList = {
  [RootStackRoute.MainTabs]: undefined;
  [RootStackRoute.Login]: undefined;
  [RootStackRoute.Register]: undefined;
  [RootStackRoute.ForgotPassword]: undefined;
  [RootStackRoute.ResetPassword]: undefined;
  [RootStackRoute.Notifications]: undefined;
  [RootStackRoute.NotificationSettings]: undefined;
  [RootStackRoute.DeviceManagement]: undefined;
  [RootStackRoute.HelpFeedback]: undefined;
  [RootStackRoute.FeedbackForm]: undefined;
  [RootStackRoute.DeviceMatch]: undefined;
  [RootStackRoute.DeviceMatchSuccess]: undefined;
  [RootStackRoute.Profile]: undefined;
  [RootStackRoute.AboutPrivacy]: undefined;
  [RootStackRoute.BleSearch]: undefined;
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


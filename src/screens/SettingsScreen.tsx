import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import type { RootStackParamList } from '../navigation/types';
import { RootStackRoute } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

type SettingsScreenNav = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  text: '#1A1918',
  textMuted: '#9C9B99',
  divider: '#E5E4E1',
};

const shadowCard = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

type SettingItemProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress?: () => void;
};

function SettingItem({ icon, label, onPress }: SettingItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
      onPress={onPress}
    >
      <Feather name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.settingLabel}>{label}</Text>
      <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNav>();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const displayName = useAuthStore((s) => s.displayName);
  const email = useAuthStore((s) => s.email);

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => {
          logout();
          queryClient.clear();
          useSettingsStore.getState().setDevicesFromServer([]);
          useSettingsStore.getState().setDeviceAvatarUrl(null);
          useSettingsStore.getState().setPetOnboardingDraft(null);
          useSettingsStore.getState().setPrimaryPet(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>我的</Text>

          <View style={styles.profileCard}>
            <Pressable
              style={styles.profileRow}
              onPress={() => navigation.navigate(RootStackRoute.Profile)}
            >
              <View style={styles.avatar}>
                <Feather name="user" size={26} color={COLORS.surface} />
              </View>
              <View style={styles.profileTextCol}>
                <Text style={styles.profileName}>
                  {displayName?.trim() ? displayName : '—'}
                </Text>
                <Text style={styles.profileSubtitle}>
                  {email?.trim() ? email : '—'}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
            </Pressable>

            <View style={styles.petRow}>
              <View style={styles.petInfoLeft}>
                <View style={styles.petAvatar}>
                  <Feather name="smile" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.petTextCol}>
                  <Text style={styles.petName}>小白</Text>
                  <Text style={styles.petSubtitle}>项圈在线 · 电量 98%</Text>
                </View>
              </View>
              <Pressable style={styles.petSwitchButton}>
                <Text style={styles.petSwitchText}>切换</Text>
              </Pressable>
            </View>

            <View style={styles.profileStatsRow}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>2</Text>
                <Text style={styles.profileStatLabel}>宠物</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>3</Text>
                <Text style={styles.profileStatLabel}>设备</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>2</Text>
                <Text style={styles.profileStatLabel}>围栏</Text>
              </View>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>18</Text>
                <Text style={styles.profileStatLabel}>天使用</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>宠物与设备</Text>
          <View style={styles.card}>
            <SettingItem
              icon="file-text"
              label="宠物档案"
              onPress={() => navigation.navigate(RootStackRoute.HelpFeedback)}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="smartphone"
              label="设备管理"
              onPress={() => navigation.navigate(RootStackRoute.DeviceManagement)}
            />
          </View>

          <Text style={styles.sectionTitle}>通知与安全</Text>
          <View style={styles.card}>
            <View style={styles.divider} />
            <SettingItem
              icon="bell"
              label="通知设置"
              onPress={() => navigation.navigate(RootStackRoute.NotificationSettings)}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="shield"
              label="围栏列表"
              onPress={() => navigation.navigate(RootStackRoute.DeviceManagement)}
            />
          </View>

          <Text style={styles.sectionTitle}>支持与关于</Text>
          <View style={styles.card}>
            <SettingItem
              icon="help-circle"
              label="帮助与反馈"
              onPress={() => navigation.navigate(RootStackRoute.HelpFeedback)}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="info"
              label="关于与隐私"
              onPress={() => navigation.navigate(RootStackRoute.AboutPrivacy)}
            />
          </View>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>退出登录  [→]</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.text,
  },
  logoutButton: {
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#F4C9C2',
    marginTop: 16,
    flexDirection: 'row',
    gap: 6,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#D95A4A',
  },
  profileCard: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 18,
    gap: 16,
    ...shadowCard,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextCol: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  profileEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  profileEditText: {
    fontSize: 12,
    color: COLORS.text,
  },
  profileStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  profileStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  profileStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.divider,
    marginHorizontal: 12,
  },
  petRow: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F5F4F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  petAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petTextCol: {
    gap: 2,
  },
  petName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  petSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  petSwitchButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  petSwitchText: {
    fontSize: 11,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  card: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    ...shadowCard,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
  },
  settingRowPressed: {
    opacity: 0.7,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'normal',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
});

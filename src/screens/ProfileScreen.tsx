import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';

type ProfileNav = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  primarySoft: '#C8F0D8',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
  textLight: '#C8C7C5',
  divider: '#F0EFED',
  warning: '#E8A040',
  danger: '#E05252',
  toggleOff: '#C8C7C5',
};

const shadowCard = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.03,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 12,
  elevation: 2,
} as const;

type InfoRowProps = {
  label: string;
  value: string;
  valueColor?: string;
  onPress?: () => void;
};

function InfoRow({ label, value, valueColor, onPress }: InfoRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.infoRow, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoRight}>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>
          {value}
        </Text>
        <Feather name="chevron-right" size={16} color={COLORS.textLight} />
      </View>
    </Pressable>
  );
}

type ActionRowProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  iconColor?: string;
  labelColor?: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

function ActionRow({ icon, label, iconColor, labelColor, right, onPress }: ActionRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.actionLeft}>
        <Feather name={icon} size={18} color={iconColor ?? COLORS.primary} />
        <Text style={[styles.actionLabel, labelColor ? { color: labelColor } : undefined]}>
          {label}
        </Text>
      </View>
      {right ?? <Feather name="chevron-right" size={16} color={COLORS.textLight} />}
    </Pressable>
  );
}

type PrefRowProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  onPress?: () => void;
};

function PrefRow({ icon, label, value, onPress }: PrefRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.actionLeft}>
        <Feather name={icon} size={18} color={COLORS.primary} />
        <Text style={styles.actionLabel}>{label}</Text>
      </View>
      <View style={styles.prefRight}>
        <Text style={styles.prefValue}>{value}</Text>
        <Feather name="chevron-right" size={16} color={COLORS.textLight} />
      </View>
    </Pressable>
  );
}

function Divider() {
  return (
    <View style={styles.dividerWrapper}>
      <View style={styles.divider} />
    </View>
  );
}

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <Pressable
      style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}
      onPress={onToggle}
    >
      <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
    </Pressable>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const displayName = useAuthStore((s) => s.displayName);
  const email = useAuthStore((s) => s.email);
  const [twoFactor, setTwoFactor] = useState(false);

  const nicknameLabel = displayName?.trim() ? displayName : '—';
  const emailLabel = email?.trim() ? email : '—';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>个人资料</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Feather name="user" size={36} color={COLORS.primary} />
            </View>
            <Pressable style={styles.avatarButton}>
              <Feather name="camera" size={14} color={COLORS.primary} />
              <Text style={styles.avatarButtonText}>更换头像</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本信息</Text>
            <View style={styles.card}>
              <InfoRow label="昵称" value={nicknameLabel} />
              <Divider />
              <InfoRow label="邮箱" value={emailLabel} />
              <Divider />
              <InfoRow label="手机号" value="未绑定" valueColor={COLORS.warning} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>账号与安全</Text>
            <View style={styles.card}>
              <ActionRow icon="lock" label="修改密码" />
              <Divider />
              <ActionRow icon="smartphone" label="绑定手机号" />
              <Divider />
              <ActionRow icon="link" label="第三方账号" />
              <Divider />
              <ActionRow
                icon="shield"
                label="两步验证"
                right={<Toggle value={twoFactor} onToggle={() => setTwoFactor((v) => !v)} />}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>偏好设置</Text>
            <View style={styles.card}>
              <PrefRow icon="globe" label="语言" value="简体中文" />
              <Divider />
              <PrefRow icon="bar-chart-2" label="距离单位" value="公里" />
              <Divider />
              <PrefRow icon="thermometer" label="温度单位" value="℃" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>账号操作</Text>
            <View style={styles.card}>
              <ActionRow icon="download" label="导出数据" />
              <Divider />
              <ActionRow
                icon="trash-2"
                label="注销账号"
                iconColor={COLORS.danger}
                labelColor={COLORS.danger}
              />
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerRight: {
    width: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 24,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 100,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: COLORS.surface,
    shadowColor: '#1A1918',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 8,
    elevation: 1,
  },
  avatarButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  card: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    ...shadowCard,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  infoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  prefRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prefValue: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  rowPressed: {
    opacity: 0.7,
  },
  dividerWrapper: {
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 100,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: COLORS.primary,
  },
  toggleOff: {
    backgroundColor: COLORS.toggleOff,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 100,
    backgroundColor: COLORS.surface,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
  },
});

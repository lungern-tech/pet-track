import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type AboutPrivacyNav = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#4CAF7D',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
  textLight: '#C4C2BF',
  divider: '#F0EFED',
};

const shadowCard = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.03,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 12,
  elevation: 2,
} as const;

type ActionRowProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

function ActionRow({ icon, label, right, onPress }: ActionRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.actionLeft}>
        <Feather name={icon} size={20} color={COLORS.primary} />
        <Text style={styles.actionLabel}>{label}</Text>
      </View>
      {right ?? <Feather name="chevron-right" size={18} color={COLORS.textLight} />}
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

export function AboutPrivacyScreen() {
  const navigation = useNavigation<AboutPrivacyNav>();

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
          <Text style={styles.headerTitle}>关于与隐私</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Feather name="heart" size={36} color={COLORS.surface} />
            </View>
            <Text style={styles.appName}>PetTrack</Text>
            <Text style={styles.appVersion}>版本 1.0.0 (Build 2024.03)</Text>
            <Text style={styles.appSlogan}>智能宠物追踪与健康管理</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>关于</Text>
            <View style={styles.card}>
              <ActionRow icon="info" label="版本信息" />
              <Divider />
              <ActionRow icon="file-text" label="更新日志" />
              <Divider />
              <ActionRow icon="star" label="评价应用" />
              <Divider />
              <ActionRow icon="share-2" label="分享应用" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>隐私与法律</Text>
            <View style={styles.card}>
              <ActionRow icon="shield" label="隐私政策" />
              <Divider />
              <ActionRow icon="book-open" label="用户协议" />
              <Divider />
              <ActionRow icon="database" label="数据使用说明" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>数据管理</Text>
            <View style={styles.card}>
              <ActionRow icon="download" label="数据导出" />
              <Divider />
              <ActionRow
                icon="trash-2"
                label="清除缓存"
                right={
                  <View style={styles.cacheRight}>
                    <Text style={styles.cacheSize}>23.5 MB</Text>
                    <Feather name="chevron-right" size={18} color={COLORS.textLight} />
                  </View>
                }
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2024 PetTrack. All rights reserved.</Text>
            <Text style={styles.footerText}>为宠物爱好者用心打造 ❤️</Text>
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
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  logoSection: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 24,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  appVersion: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  appSlogan: {
    fontSize: 13,
    color: COLORS.textMuted,
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
    gap: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
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
  cacheRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cacheSize: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textLight,
  },
});

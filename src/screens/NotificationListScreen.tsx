import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { RootStackRoute } from '../navigation/types';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  primarySoft: '#C8F0D8',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
};

type NotificationScreenNav = NativeStackNavigationProp<
  RootStackParamList,
  RootStackRoute.Notifications
>;

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  tone: 'success' | 'warning' | 'info';
  unread?: boolean;
};

const ITEMS: NotificationItem[] = [
  {
    id: '1',
    title: 'Coco 已连接',
    message: '项圈已连接，开始实时定位与活动记录。',
    time: '刚刚',
    tone: 'success',
    unread: true,
  },
  {
    id: '2',
    title: '活动目标达成',
    message: '今日步数已超过 8,000 步，继续保持！',
    time: '2 小时前',
    tone: 'warning',
  },
  {
    id: '3',
    title: '电量充足',
    message: '设备电量 98%，可安心外出散步。',
    time: '昨天',
    tone: 'info',
  },
];

export function NotificationListScreen() {
  const navigation = useNavigation<NotificationScreenNav>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Feather
            name="chevron-left"
            size={24}
            color={COLORS.primary}
            onPress={() => navigation.goBack()}
          />

          <Text style={styles.headerTitle}>通知</Text>

          <Feather name="more-vertical" size={24} color={COLORS.text} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {ITEMS.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={[styles.iconWrapper, iconToneStyle[item.tone]]}>
                {item.tone === 'success' && (
                  <Feather name="check" size={20} color={COLORS.primary} />
                )}
                {item.tone === 'warning' && (
                  <Feather name="alert-circle" size={20} color="#D89575" />
                )}
                {item.tone === 'info' && (
                  <Feather name="info" size={20} color="#3B82F6" />
                )}
              </View>

              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMessage}>{item.message}</Text>
                <Text style={styles.itemTime}>{item.time}</Text>
              </View>

              {item.unread && <View style={styles.unreadDot} />}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const iconToneStyle = StyleSheet.create({
  success: {
    backgroundColor: COLORS.primarySoft,
  },
  warning: {
    backgroundColor: '#FFE5D9',
  },
  info: {
    backgroundColor: '#E5F0FF',
  },
});

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
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E4E1',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  itemTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
});


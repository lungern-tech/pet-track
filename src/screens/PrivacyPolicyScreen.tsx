import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  primary: '#3D8A5A',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
};

const CONTENT = [
  {
    title: '一、我们收集的信息',
    body: '为提供设备连接、定位与健康功能，我们可能收集账号信息、设备标识、蓝牙连接信息、定位数据与使用日志。具体以你授权为准。',
  },
  {
    title: '二、信息的使用与共享',
    body: '我们仅为实现产品功能、改进体验与保障安全而使用信息。除非法律法规要求或获得你的明确授权，我们不会向无关第三方出售或共享你的个人信息。',
  },
  {
    title: '三、你的权利',
    body: '你可以在应用内访问、更正或删除部分信息，并管理权限授权。若你希望注销账号或获取更多帮助，请通过“帮助与反馈”联系我们。',
  },
] as const;

export function PrivacyPolicyScreen() {
  const navigation = useNavigation<Nav>();

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
          <Text style={styles.headerTitle}>隐私政策</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.updateDate}>更新日期：2026-03-17</Text>

          {CONTENT.map((s) => (
            <View key={s.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Text style={styles.sectionBody}>{s.body}</Text>
            </View>
          ))}
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
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  updateDate: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },
});


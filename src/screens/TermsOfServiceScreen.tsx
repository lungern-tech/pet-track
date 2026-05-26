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
    title: '一、协议概述',
    body: '欢迎使用 PetTrack。使用本应用即表示你同意本协议条款。请在注册或使用前仔细阅读，如不同意请停止使用。',
  },
  {
    title: '二、账户与安全',
    body: '你应妥善保管账号信息并对账号下的活动负责。若发现未经授权的使用，请及时通过应用内渠道联系我们。',
  },
  {
    title: '三、服务与免责声明',
    body: '定位与健康数据可能受设备、电量、网络与环境影响，仅供参考。我们会持续改进服务，但不对因不可抗力或第三方原因导致的中断承担责任。',
  },
] as const;

export function TermsOfServiceScreen() {
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
          <Text style={styles.headerTitle}>用户协议</Text>
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


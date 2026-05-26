import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Linking,
} from 'react-native';
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
  text: '#1A1918',
  textMuted: '#9C9B99',
  divider: '#E5E4E1',
  iconGreen: '#C8F0D8',
  iconOrange: '#FFE5D9',
  iconBlue: '#E5F0FF',
};

const shadowCard = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.03,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

type HelpFeedbackNav = NativeStackNavigationProp<RootStackParamList>;

const HELP_ITEMS = [
  '如何连接设备？',
  '设备无法连接怎么办？',
  '如何查看健康数据？',
  '如何设置安全区域？',
];

const FEEDBACK_ITEMS: {
  label: string;
  iconBg: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
}[] = [
  {
    label: '联系客服',
    iconBg: COLORS.iconGreen,
    icon: 'phone',
    onPress: () => Linking.openURL('mailto:support@example.com'),
  },
  { label: '意见反馈', iconBg: COLORS.iconOrange, icon: 'message-circle' },
  {
    label: '评价应用',
    iconBg: COLORS.iconBlue,
    icon: 'star',
    onPress: () => Linking.openURL('https://apps.apple.com'),
  },
];

export function HelpFeedbackScreen() {
  const navigation = useNavigation<HelpFeedbackNav>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={12}
          >
            <Feather name="chevron-left" size={24} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>帮助与反馈</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 常见问题 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>常见问题</Text>
            <View style={styles.card}>
              {HELP_ITEMS.map((label, index) => (
                <React.Fragment key={label}>
                  {index > 0 && <View style={styles.divider} />}
                  <Pressable
                    style={({ pressed }) => [styles.helpRow, pressed && styles.rowPressed]}
                    onPress={() => {}}
                  >
                    <Text style={styles.helpRowLabel}>{label}</Text>
                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* 反馈 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>反馈</Text>
            <View style={styles.card}>
              {FEEDBACK_ITEMS.map((item, index) => (
                <React.Fragment key={item.label}>
                  {index > 0 && <View style={styles.divider} />}
                  <Pressable
                    style={({ pressed }) => [styles.feedbackRow, pressed && styles.rowPressed]}
                    onPress={
                      item.label === '意见反馈'
                        ? () => navigation.navigate(RootStackRoute.FeedbackForm)
                        : item.onPress
                    }
                  >
                    <View style={styles.feedbackRowLeft}>
                      <View style={[styles.feedbackIconBox, { backgroundColor: item.iconBg }]}>
                        <Feather name={item.icon} size={20} color={COLORS.primary} />
                      </View>
                      <Text style={styles.feedbackRowLabel}>{item.label}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                  </Pressable>
                </React.Fragment>
              ))}
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 24,
    height: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 32,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  card: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    ...shadowCard,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  helpRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  feedbackRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackRowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  rowPressed: {
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginLeft: 20,
  },
});

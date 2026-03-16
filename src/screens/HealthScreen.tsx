import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-gifted-charts';

const COLORS = {
  background: '#F5F4F1',
  surface: '#FFFFFF',
  surfaceMuted: '#EDECEA',
  primary: '#3D8A5A',
  primarySoft: '#C8F0D8',
  text: '#1A1918',
  textSecondary: '#6D6C6A',
  textMuted: '#9C9B99',
  accent: '#D89575',
};

const shadowCard = {
  shadowColor: '#1A1918',
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  elevation: 2,
} as const;

type Segment = 'day' | 'week' | 'month';

export function HealthScreen() {
  const [segment, setSegment] = useState<Segment>('day');

  const heartRateData = useMemo(() => {
    if (segment === 'day') {
      return [
        { value: 68, label: '6:00' },
        { value: 72, label: '9:00' },
        { value: 78, label: '12:00' },
        { value: 75, label: '15:00' },
        { value: 70, label: '18:00' },
        { value: 66, label: '21:00' },
      ];
    }

    if (segment === 'week') {
      return [
        { value: 70, label: '一' },
        { value: 73, label: '二' },
        { value: 71, label: '三' },
        { value: 74, label: '四' },
        { value: 72, label: '五' },
        { value: 69, label: '六' },
        { value: 68, label: '日' },
      ];
    }

    return [
      { value: 71, label: '1' },
      { value: 72, label: '5' },
      { value: 73, label: '10' },
      { value: 72, label: '15' },
      { value: 71, label: '20' },
      { value: 72, label: '25' },
      { value: 73, label: '30' },
    ];
  }, [segment]);

  const temperatureData = useMemo(() => {
    if (segment === 'day') {
      return [
        { value: 37.8, label: '6:00' },
        { value: 38.1, label: '9:00' },
        { value: 38.4, label: '12:00' },
        { value: 38.3, label: '15:00' },
        { value: 38.0, label: '18:00' },
        { value: 37.9, label: '21:00' },
      ];
    }

    if (segment === 'week') {
      return [
        { value: 38.0, label: '一' },
        { value: 38.1, label: '二' },
        { value: 38.2, label: '三' },
        { value: 38.3, label: '四' },
        { value: 38.1, label: '五' },
        { value: 38.0, label: '六' },
        { value: 38.0, label: '日' },
      ];
    }

    return [
      { value: 38.1, label: '1' },
      { value: 38.2, label: '5' },
      { value: 38.3, label: '10' },
      { value: 38.2, label: '15' },
      { value: 38.1, label: '20' },
      { value: 38.1, label: '25' },
      { value: 38.2, label: '30' },
    ];
  }, [segment]);

  const sleepData = useMemo(() => {
    if (segment === 'day') {
      // 按小时分布的睡眠质量
      return [
        { value: 40, label: '0' },
        { value: 70, label: '2' },
        { value: 90, label: '4' },
        { value: 80, label: '6' },
        { value: 60, label: '8' },
      ];
    }

    if (segment === 'week') {
      return [
        { value: 7.5, label: '一' },
        { value: 8.0, label: '二' },
        { value: 8.2, label: '三' },
        { value: 7.8, label: '四' },
        { value: 8.5, label: '五' },
        { value: 8.8, label: '六' },
        { value: 7.9, label: '日' },
      ];
    }

    return [
      { value: 8.0, label: '1' },
      { value: 8.3, label: '5' },
      { value: 8.4, label: '10' },
      { value: 8.2, label: '15' },
      { value: 8.6, label: '20' },
      { value: 8.7, label: '25' },
      { value: 8.5, label: '30' },
    ];
  }, [segment]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>健康数据</Text>

          <View style={styles.segmentRow}>
            <Pressable
              style={[styles.segmentItem, segment === 'day' && styles.segmentActive]}
              onPress={() => setSegment('day')}
            >
              <Text
                style={[
                  styles.segmentText,
                  segment === 'day' && styles.segmentTextActive,
                ]}
              >
                天
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentItem, segment === 'week' && styles.segmentActive]}
              onPress={() => setSegment('week')}
            >
              <Text
                style={[
                  styles.segmentText,
                  segment === 'week' && styles.segmentTextActive,
                ]}
              >
                周
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentItem, segment === 'month' && styles.segmentActive]}
              onPress={() => setSegment('month')}
            >
              <Text
                style={[
                  styles.segmentText,
                  segment === 'month' && styles.segmentTextActive,
                ]}
              >
                月
              </Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>实时数据</Text>

            <View style={styles.realtimeRow}>
              <View style={styles.realtimeMetric}>
                <Feather name="heart" size={24} color={COLORS.primary} />
                <Text style={styles.realtimeValue}>72</Text>
                <Text style={styles.realtimeUnit}>bpm</Text>
              </View>

              <View style={styles.realtimeMetric}>
                <Feather name="thermometer" size={24} color={COLORS.accent} />
                <Text style={styles.realtimeValue}>38.2</Text>
                <Text style={styles.realtimeUnit}>°C</Text>
              </View>

              <View style={styles.realtimeMetric}>
                <Feather name="moon" size={24} color={COLORS.primary} />
                <Text style={styles.realtimeValue}>8.5</Text>
                <Text style={styles.realtimeUnit}>小时</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>数据趋势</Text>

          <View style={styles.card}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartLabel}>心率</Text>
              <Text style={styles.chartAvg}>平均 72 bpm</Text>
            </View>
            <View style={styles.chartContainer}>
              <LineChart
                areaChart
                curved
                data={heartRateData}
                thickness={3}
                hideDataPoints={false}
                color={COLORS.primary}
                startFillColor={COLORS.primarySoft}
                endFillColor={COLORS.primarySoft}
                startOpacity={0.7}
                endOpacity={0.1}
                yAxisColor="transparent"
                xAxisColor="transparent"
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                hideYAxisText={segment === 'day'}
                hideRules
                initialSpacing={10}
                spacing={32}
                hideAxesAndRules={false}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartLabel}>体温</Text>
              <Text style={styles.chartAvg}>平均 38.2°C</Text>
            </View>
            <View style={styles.chartContainer}>
              <LineChart
                curved
                data={temperatureData}
                thickness={3}
                hideDataPoints={false}
                color={COLORS.accent}
                yAxisColor="transparent"
                xAxisColor="transparent"
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                hideYAxisText={segment === 'day'}
                hideRules
                initialSpacing={10}
                spacing={32}
                hideAxesAndRules={false}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartLabel}>睡眠时长</Text>
              <Text style={styles.chartAvg}>平均 8.5 小时</Text>
            </View>
            <View style={styles.chartContainer}>
              <BarChart
                data={sleepData}
                barWidth={18}
                barBorderRadius={6}
                frontColor={COLORS.primary}
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                xAxisColor="transparent"
                yAxisColor="transparent"
                noOfSections={segment === 'day' ? 4 : 5}
                maxValue={segment === 'day' ? 100 : 10}
                yAxisLabelTexts={
                  segment === 'day' ? undefined : ['0', '2', '4', '6', '8', '10']
                }
                hideRules
                spacing={28}
                initialSpacing={10}
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
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: COLORS.surface,
    ...shadowCard,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    fontWeight: '600',
    color: COLORS.text,
  },
  card: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    padding: 20,
    ...shadowCard,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  realtimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  realtimeMetric: {
    alignItems: 'center',
    gap: 4,
  },
  realtimeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  realtimeUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  chartAvg: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chartPlaceholder: {
    height: 120,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  chartContainer: {
    height: 160,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 4,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  axisText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  sleepBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    gap: 8,
  },
  sleepBar: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});

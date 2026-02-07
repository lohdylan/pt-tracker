import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { useMeasurements } from '../../hooks/useMeasurements';
import { colors, spacing, fontSize } from '../../theme';
import type { Measurement } from '../../types';

type ParamList = {
  ProgressChart: { clientId: number };
};

type ProgressChartRouteProp = RouteProp<ParamList, 'ProgressChart'>;

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.primaryDark,
  },
  propsForBackgroundLines: {
    stroke: colors.border,
  },
};

const bodyChartConfig = {
  ...chartConfig,
  color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.success,
  },
};

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day}`;
}

interface ChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

function buildChartData(
  measurements: Measurement[],
  field: keyof Measurement,
): ChartData | null {
  const filtered = measurements
    .filter((m) => m[field] != null && typeof m[field] === 'number')
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );

  if (filtered.length === 0) return null;

  // Limit labels to avoid overcrowding
  const maxLabels = 8;
  const step = Math.max(1, Math.floor(filtered.length / maxLabels));

  const labels = filtered.map((m, i) =>
    i % step === 0 || i === filtered.length - 1
      ? formatShortDate(m.recorded_at)
      : '',
  );

  const data = filtered.map((m) => Number(m[field]));

  return {
    labels,
    datasets: [{ data }],
  };
}

function buildMultiLineChartData(
  measurements: Measurement[],
  fields: { key: keyof Measurement; label: string; color: string }[],
): { data: ChartData; legend: string[] } | null {
  const sorted = [...measurements].sort(
    (a, b) =>
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );

  // Only include fields that have at least one data point
  const validFields = fields.filter((f) =>
    sorted.some((m) => m[f.key] != null && typeof m[f.key] === 'number'),
  );

  if (validFields.length === 0 || sorted.length === 0) return null;

  const maxLabels = 8;
  const step = Math.max(1, Math.floor(sorted.length / maxLabels));

  const labels = sorted.map((m, i) =>
    i % step === 0 || i === sorted.length - 1
      ? formatShortDate(m.recorded_at)
      : '',
  );

  const datasets = validFields.map((f) => ({
    data: sorted.map((m) => {
      const val = m[f.key];
      return typeof val === 'number' ? val : 0;
    }),
    color: (opacity = 1) => f.color.replace('1)', `${opacity})`),
    strokeWidth: 2,
  }));

  return {
    data: { labels, datasets },
    legend: validFields.map((f) => f.label),
  };
}

function ProgressChartScreen() {
  const route = useRoute<ProgressChartRouteProp>();
  const { clientId } = route.params;
  const { data: measurements, isLoading, isError } = useMeasurements(clientId);

  const weightData = useMemo(
    () => (measurements ? buildChartData(measurements, 'weight_lbs') : null),
    [measurements],
  );

  const bodyFatData = useMemo(
    () => (measurements ? buildChartData(measurements, 'body_fat_pct') : null),
    [measurements],
  );

  const bodyMeasurementsData = useMemo(() => {
    if (!measurements) return null;
    return buildMultiLineChartData(measurements, [
      { key: 'chest_in', label: 'Chest', color: 'rgba(37, 99, 235, 1)' },
      { key: 'waist_in', label: 'Waist', color: 'rgba(220, 38, 38, 1)' },
      { key: 'hips_in', label: 'Hips', color: 'rgba(22, 163, 74, 1)' },
      { key: 'arm_in', label: 'Arm', color: 'rgba(245, 158, 11, 1)' },
      { key: 'thigh_in', label: 'Thigh', color: 'rgba(100, 116, 139, 1)' },
    ]);
  }, [measurements]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load measurements.</Text>
      </View>
    );
  }

  if (!measurements || measurements.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No measurements recorded yet</Text>
        <Text style={styles.emptySubtitle}>
          Add measurements to see progress charts.
        </Text>
      </View>
    );
  }

  const chartWidth = screenWidth - spacing.md * 2;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.heading}>Progress Charts</Text>

      {/* Weight Chart */}
      {weightData ? (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weight (lbs)</Text>
          <LineChart
            data={weightData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            yAxisSuffix=""
            yAxisLabel=""
          />
        </View>
      ) : (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weight (lbs)</Text>
          <Text style={styles.noDataText}>No weight data available.</Text>
        </View>
      )}

      {/* Body Fat Chart */}
      {bodyFatData ? (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Body Fat (%)</Text>
          <LineChart
            data={bodyFatData}
            width={chartWidth}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.warning,
              },
            }}
            bezier
            style={styles.chart}
            yAxisSuffix="%"
            yAxisLabel=""
          />
        </View>
      ) : null}

      {/* Body Measurements Chart */}
      {bodyMeasurementsData ? (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Body Measurements (in)</Text>
          <LineChart
            data={bodyMeasurementsData.data}
            width={chartWidth}
            height={260}
            chartConfig={bodyChartConfig}
            bezier
            style={styles.chart}
            yAxisSuffix=""
            yAxisLabel=""
          />
          <View style={styles.legendContainer}>
            {bodyMeasurementsData.legend.map((label, idx) => {
              const fieldColors = [
                colors.primary,
                colors.danger,
                colors.success,
                colors.warning,
                colors.secondary,
              ];
              return (
                <View key={label} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: fieldColors[idx] ?? colors.primary },
                    ]}
                  />
                  <Text style={styles.legendLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.danger,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  heading: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: 8,
  },
  noDataText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  legendLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});

export default ProgressChartScreen;

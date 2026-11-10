import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MovementRecord } from '../api/fileTrackerApi';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';

interface MovementTimelineProps {
  records: MovementRecord[];
}

export function MovementTimeline({ records }: MovementTimelineProps) {
  const { colors } = useTheme();

  if (records.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No movement history found for this code.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Table Header */}
      <View style={[styles.headerRow, { backgroundColor: colors.tableHeader }]}>
        <Text style={[styles.headerCell, styles.cellDate, { color: colors.headerText }]}>Date</Text>
        <Text style={[styles.headerCell, styles.cellUser, { color: colors.headerText }]}>Inward</Text>
        <Text style={[styles.headerCell, styles.cellEmployee, { color: colors.headerText }]}>Marked To</Text>
      </View>

      {/* Table Body */}
      <FlatList
        data={records}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => {
          const isEven = index % 2 === 0;
          return (
            <View
              style={[
                styles.dataRow,
                {
                  backgroundColor: isEven ? colors.tableRowEven : colors.tableRowOdd,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.dataCell, styles.cellDate, { color: colors.text }]}>
                {item.dt}
              </Text>
              <Text style={[styles.dataCell, styles.cellUser, { color: colors.textSecondary }]}>
                {item.username}
              </Text>
              <Text style={[styles.dataCell, styles.cellEmployee, styles.bold, { color: colors.primary }]}>
                {item.employee}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  headerCell: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  dataCell: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
  },
  cellDate: {
    flex: 1.2,
  },
  cellUser: {
    flex: 1,
  },
  cellEmployee: {
    flex: 1.2,
  },
  bold: {
    fontFamily: fontFamilies.semiBold,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
  },
});

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { AppText } from '../common/AppText';

interface RecentSearchesProps {
  terms: string[];
  onSelect: (term: string) => void;
  onClear: () => void;
}

export function RecentSearches({ terms, onSelect, onClear }: RecentSearchesProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Clock size={15} color={colors.textSecondary} />
          <AppText style={[styles.title, { color: colors.textSecondary }]}>Recent Searches</AppText>
        </View>
        <TouchableOpacity
          onPress={onClear}
          style={styles.clearBtn}
          accessibilityRole="button"
          accessibilityLabel="Clear recent searches"
        >
          <AppText style={[styles.clearText, { color: colors.textMuted }]}>Clear</AppText>
        </TouchableOpacity>
      </View>
      <View style={styles.chips}>
        {terms.map((term) => (
          <TouchableOpacity
            key={term}
            style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onSelect(term)}
            accessibilityRole="button"
            accessibilityHint="Searches again"
          >
            <AppText style={styles.chipText}>{term}</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
});

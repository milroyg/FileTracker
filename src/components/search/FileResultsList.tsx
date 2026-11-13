import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { FileText, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { AppText } from '../common/AppText';
import type { FileSearchResult } from '../../api/fileTrackerApi';

interface FileResultsListProps {
  files: FileSearchResult[];
  onSelect: (file: FileSearchResult) => void;
}

/** Files whose subject matched a text search; tapping one shows its movements. */
export function FileResultsList({ files, onSelect }: FileResultsListProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.flex}>
      {files.length > 0 && (
        <View style={[styles.summaryBar, { borderBottomColor: colors.border }]}>
          <AppText style={[styles.summaryText, { color: colors.textSecondary }]}>
            Found {files.length} matching file{files.length === 1 ? '' : 's'}
          </AppText>
        </View>
      )}
      <FlatList
        data={files}
        keyExtractor={(item, index) => `${item.code}_${index}`}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText style={styles.emptyTitle}>No matching files found</AppText>
            <AppText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Please check your spelling or search directly by file code.
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => onSelect(item)}
            accessibilityRole="button"
            accessibilityHint="Shows this file's movement history"
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.badgeBackground }]}>
                <FileText size={20} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <AppText style={styles.fileName}>{item.filename}</AppText>
                <AppText style={[styles.fileCode, { color: colors.textSecondary }]}>
                  Code: <AppText style={styles.bold}>{item.code}</AppText>
                </AppText>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  summaryBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    marginBottom: 4,
  },
  fileCode: {
    fontSize: 13,
  },
  bold: {
    fontFamily: fontFamilies.bold,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});

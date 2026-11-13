import React from 'react';
import { View, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { AppText } from '../common/AppText';
import { MovementTimeline } from '../MovementTimeline';
import type { MovementRecord } from '../../api/fileTrackerApi';
import { logger } from '../../utils/logger';

interface MovementResultsProps {
  code: string;
  filename?: string;
  records: MovementRecord[];
}

export function buildShareMessage(code: string, records: MovementRecord[], filename?: string) {
  const divider = '---------------------------------';
  return [
    'WRD FileTracker Movement History',
    `File Code: ${code}${filename ? ` (${filename})` : ''}`,
    `Total Movements: ${records.length}`,
    divider,
    ...records.map(
      (r, i) => `${i + 1}. Date: ${r.dt} | Inward: ${r.username} | Marked To: ${r.employee}`,
    ),
    divider,
    'Goa Water Resources Department',
  ].join('\n');
}

/** Movement history of one file code, with a share action. */
export function MovementResults({ code, filename, records }: MovementResultsProps) {
  const { colors } = useTheme();

  const share = async () => {
    try {
      await Share.share({ message: buildShareMessage(code, records, filename) });
    } catch (error) {
      logger.debug('[MovementResults] Share cancelled/failed:', error);
    }
  };

  return (
    <View style={styles.flex}>
      {records.length > 0 && (
        <View style={[styles.summaryBar, { borderBottomColor: colors.border }]}>
          <AppText style={[styles.summaryText, { color: colors.textSecondary }]}>
            {records.length} movement{records.length === 1 ? '' : 's'} recorded
          </AppText>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.badgeBackground }]}
            onPress={share}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Share movement history"
          >
            <Share2 size={14} color={colors.primary} />
            <AppText style={[styles.shareBtnText, { color: colors.primary }]}>Share</AppText>
          </TouchableOpacity>
        </View>
      )}
      <MovementTimeline records={records} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  shareBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
  },
});

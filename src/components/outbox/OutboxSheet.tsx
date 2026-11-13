import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, FilePlus, ArrowRightLeft, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { AppText } from '../common/AppText';
import { CustomButton } from '../common/CustomButton';
import { CustomDialog } from '../common/CustomDialog';
import { useDialog } from '../../hooks/useDialog';
import { useOutbox } from '../../hooks/useOutbox';
import { OutboxService, type OutboxItem, type OutboxStatus } from '../../services/outboxService';
import { formatRelativeTime } from '../../utils/dateUtils';

interface OutboxSheetProps {
  onClose: () => void;
  /** User chose to register a file code that the server didn't recognise. */
  onRegisterFile: (code: string) => void;
}

const STATUS_LABEL: Record<OutboxStatus, string> = {
  pending: 'Waiting to sync',
  needs_registration: 'File not registered',
  failed: 'Needs attention',
};

/** Lists actions saved offline and lets the user resolve the ones that are stuck. */
export function OutboxSheet({ onClose, onRegisterFile }: OutboxSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, isSyncing } = useOutbox();
  const { showDialog, dialogProps } = useDialog();

  const statusColor = (status: OutboxStatus) =>
    status === 'pending'
      ? colors.textSecondary
      : status === 'failed'
        ? colors.error
        : colors.warning;

  const confirmDiscard = (item: OutboxItem) =>
    showDialog({
      title: 'Discard Action?',
      message:
        item.type === 'MARK_EMPLOYEE'
          ? `The movement of file ${item.code} to ${item.employee} will NOT be recorded.`
          : `File ${item.code} will NOT be registered.`,
      type: 'confirm',
      buttons: [
        { text: 'Keep', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => OutboxService.discard(item.id) },
      ],
    });

  const renderItem = ({ item }: { item: OutboxItem }) => {
    const isMovement = item.type === 'MARK_EMPLOYEE';
    return (
      <View style={[styles.item, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.itemHeader}>
          {isMovement ? (
            <ArrowRightLeft size={16} color={colors.primary} />
          ) : (
            <FilePlus size={16} color={colors.primary} />
          )}
          <AppText style={styles.itemTitle} numberOfLines={1}>
            {isMovement ? `File ${item.code} → ${item.employee}` : `Register file ${item.code}`}
          </AppText>
        </View>
        {!isMovement && item.filename ? (
          <AppText style={[styles.itemDetail, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.filename}
          </AppText>
        ) : null}
        <AppText style={[styles.itemMeta, { color: statusColor(item.status) }]}>
          {STATUS_LABEL[item.status]} • saved {formatRelativeTime(item.createdAt)}
        </AppText>
        {item.lastError ? (
          <AppText style={[styles.itemDetail, { color: colors.textSecondary }]} numberOfLines={3}>
            {item.lastError}
          </AppText>
        ) : null}

        <View style={styles.itemActions}>
          {item.status === 'needs_registration' && (
            <CustomButton
              title="Register File"
              onPress={() => onRegisterFile(item.code)}
              style={styles.actionBtn}
            />
          )}
          {item.status === 'failed' && (
            <CustomButton
              title="Retry"
              onPress={async () => {
                await OutboxService.retry(item.id);
                void OutboxService.sync();
              }}
              style={styles.actionBtn}
            />
          )}
          <CustomButton
            title="Discard"
            variant="outline"
            onPress={() => confirmDiscard(item)}
            style={styles.actionBtn}
          />
        </View>
      </View>
    );
  };

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Close saved actions"
        />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.header}>
            <AppText style={styles.title} accessibilityRole="header">
              Saved Offline Actions
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <AppText style={[styles.empty, { color: colors.textSecondary }]}>
                Everything is synced.
              </AppText>
            }
          />

          {items.some((item) => item.status === 'pending') && (
            <CustomButton
              title={isSyncing ? 'Syncing…' : 'Sync Now'}
              loading={isSyncing}
              icon={<RefreshCw size={16} color={colors.white} />}
              onPress={() => void OutboxService.sync()}
            />
          )}
        </View>
      </View>
      <CustomDialog {...dialogProps} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 16,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 24,
  },
  item: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
  },
  itemMeta: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  itemDetail: {
    fontSize: 13,
    lineHeight: 18,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    height: 40,
  },
});

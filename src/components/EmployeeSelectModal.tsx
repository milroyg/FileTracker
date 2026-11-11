import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { QrCode, User, Users, Check, X, UserPlus, Sparkles } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { CustomButton } from './common/CustomButton';
import { CustomInput } from './common/CustomInput';
import { CustomDialog, DialogType } from './common/CustomDialog';
import { FileTrackerApi, isScanSuccessResponse, isFileNotInSystemResponse } from '../api/fileTrackerApi';
import { FrequentEmployeeService } from '../services/frequentEmployeeService';
import { OfflineSyncService } from '../services/offlineSyncService';

interface EmployeeSelectModalProps {
  visible: boolean;
  code: string;
  username: string;
  division: string;
  employeeList: string[];
  onClose: () => void;
  onSuccess: () => void;
  onFileNotInSystem: (code: string) => void;
}

export function EmployeeSelectModal({
  visible,
  code,
  username,
  division,
  employeeList,
  onClose,
  onSuccess,
  onFileNotInSystem,
}: EmployeeSelectModalProps) {
  const { colors } = useTheme();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [frequentEmployees, setFrequentEmployees] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: DialogType;
    onCloseAction?: () => void;
  }>({ visible: false, title: '' });

  // Load frequently marked colleagues for this division
  useEffect(() => {
    if (visible && division) {
      FrequentEmployeeService.getFrequentEmployees(division).then(setFrequentEmployees);
    }
  }, [visible, division]);

  const filteredEmployees = employeeList.filter((emp) =>
    emp.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    const targetEmployee = selectedEmployee.trim();
    if (!targetEmployee) {
      setDialog({
        visible: true,
        title: 'Employee Required',
        message: 'Please select or enter an employee name to mark this file to.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Check network connectivity: Queue in offline outbox if disconnected
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        await OfflineSyncService.queueMarkEmployee(code, username, targetEmployee);
        await FrequentEmployeeService.recordEmployeeUsage(division, targetEmployee);
        setDialog({
          visible: true,
          title: 'Offline Action Saved',
          message: 'Device is offline. File movement has been saved to the outbox and will automatically sync when reconnected.',
          type: 'info',
          onCloseAction: onSuccess,
        });
        return;
      }

      // 2. Dispatch online API request
      const response = await FileTrackerApi.markFileToEmployee(
        code,
        username,
        targetEmployee
      );

      if (isScanSuccessResponse(response) || response === 'Ok') {
        await FrequentEmployeeService.recordEmployeeUsage(division, targetEmployee);
        setDialog({
          visible: true,
          title: 'Movement Recorded',
          message: 'File movement successfully recorded in WRD system.',
          type: 'success',
          onCloseAction: onSuccess,
        });
      } else if (isFileNotInSystemResponse(response) || response === 'File not in System') {
        // DO NOT call onClose() here: calling onClose triggers resumeScanning() which sets scannedCode to null!
        // Directly invoke onFileNotInSystem so ScannerScreen transitions to RegisterFileModal with intact state.
        onFileNotInSystem(code);
      } else {
        setDialog({
          visible: true,
          title: 'Server Notice',
          message: response || 'Unexpected response received from Goa WRD server.',
          type: 'warning',
          onCloseAction: onClose,
        });
      }
    } catch (error: any) {
      const responseData = String(error?.response?.data || '').trim();
      if (responseData && (isFileNotInSystemResponse(responseData) || responseData.toLowerCase().includes('not in system'))) {
        onFileNotInSystem(code);
        return;
      }

      // If network dropped mid-call, offer to queue locally
      setDialog({
        visible: true,
        title: 'Connection Dropped',
        message: 'Could not reach server. Queued in offline outbox to sync automatically.',
        type: 'warning',
        onCloseAction: async () => {
          await OfflineSyncService.queueMarkEmployee(code, username, targetEmployee);
          onSuccess();
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                borderWidth: 1,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.primary }]}>
                The file is marked to:
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Readonly Info Badges */}
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.infoBadge,
                  { backgroundColor: colors.badgeBackground },
                ]}
              >
                <QrCode size={16} color={colors.primary} />
                <Text style={[styles.infoBadgeText, { color: colors.primary }]} numberOfLines={1}>
                  Code: {code}
                </Text>
              </View>
              <View
                style={[
                  styles.infoBadge,
                  { backgroundColor: colors.badgeBackground },
                ]}
              >
                <User size={16} color={colors.primary} />
                <Text style={[styles.infoBadgeText, { color: colors.primary }]} numberOfLines={1}>
                  By: {username}
                </Text>
              </View>
            </View>

            <Text style={[styles.divisionLabel, { color: colors.textSecondary }]}>
              Department Division: <Text style={[styles.bold, { color: colors.text }]}>{division}</Text>
            </Text>

            {/* Frequent Colleagues Quick Chips */}
            {frequentEmployees.length > 0 && (
              <View style={styles.frequentSection}>
                <View style={styles.frequentHeader}>
                  <Sparkles size={13} color={colors.primary} />
                  <Text style={[styles.frequentLabel, { color: colors.textSecondary }]}>
                    Frequent Colleagues:
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.frequentList}
                >
                  {frequentEmployees.map((emp) => {
                    const isSelected = selectedEmployee === emp;
                    return (
                      <TouchableOpacity
                        key={emp}
                        style={[
                          styles.frequentChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setSelectedEmployee(emp)}
                      >
                        <Text
                          style={[
                            styles.frequentChipText,
                            { color: isSelected ? colors.white : colors.text },
                          ]}
                        >
                          {emp}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Employee Filter Input */}
            <CustomInput
              placeholder="Search employee in this division..."
              value={filterQuery}
              onChangeText={setFilterQuery}
              clearable
              onClear={() => setFilterQuery('')}
              leftIcon={<Users size={18} color={colors.textSecondary} />}
              style={{ height: 44 }}
            />

            {/* Employee List */}
            <View style={[styles.listContainer, { borderColor: colors.border }]}>
              <FlatList
                data={filteredEmployees}
                keyExtractor={(item) => item}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListEmptyComponent={
                  filterQuery.trim().length > 0 ? (
                    <TouchableOpacity
                      style={[
                        styles.unlistedEmployeeCard,
                        {
                          backgroundColor: colors.badgeBackground,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setSelectedEmployee(filterQuery.trim())}
                    >
                      <UserPlus size={18} color={colors.primary} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.unlistedTitle, { color: colors.primary }]}>
                          Mark to unlisted employee:
                        </Text>
                        <Text style={[styles.unlistedName, { color: colors.text }]}>
                          "{filterQuery.trim()}"
                        </Text>
                      </View>
                      <Check size={16} color={colors.primary} />
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      No employees found in {division}
                    </Text>
                  )
                }
                renderItem={({ item }) => {
                  const isSelected = selectedEmployee === item;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.employeeItem,
                        { borderBottomColor: colors.border },
                        isSelected && {
                          backgroundColor: colors.badgeBackground,
                        },
                      ]}
                      onPress={() => setSelectedEmployee(item)}
                    >
                      <Text
                        style={[
                          styles.employeeName,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontFamily: isSelected ? fontFamilies.bold : fontFamilies.regular,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                      {isSelected && <Check size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <CustomButton
                title="Cancel"
                variant="outline"
                style={styles.actionBtn}
                onPress={onClose}
              />
              <CustomButton
                title="Submit"
                loading={isSubmitting}
                style={styles.actionBtn}
                onPress={handleSubmit}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Themed Feedback Dialog */}
      <CustomDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onClose={() => {
          const action = dialog.onCloseAction;
          setDialog({ visible: false, title: '' });
          if (action) action();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  closeBtn: {
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  infoBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  infoBadgeText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  divisionLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    marginBottom: 8,
  },
  bold: {
    fontFamily: fontFamilies.bold,
  },
  frequentSection: {
    marginBottom: 10,
  },
  frequentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  frequentLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  frequentList: {
    gap: 8,
    paddingBottom: 4,
  },
  frequentChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  frequentChipText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
  unlistedEmployeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  unlistedTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  unlistedName: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
  },
  listContainer: {
    maxHeight: 180,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  employeeName: {
    fontSize: 15,
  },
  emptyText: {
    fontFamily: fontFamilies.regular,
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
  },
});

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { QrCode, User, Users, Check, X, UserPlus, Sparkles } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { AppText } from './common/AppText';
import { CustomButton } from './common/CustomButton';
import { CustomInput } from './common/CustomInput';
import { CustomDialog } from './common/CustomDialog';
import { useDialog } from '../hooks/useDialog';
import { useMarkFileMutation } from '../hooks/useFileTracker';
import { toApiError } from '../api/errors';
import { FrequentEmployeeService } from '../services/frequentEmployeeService';
import { OutboxService } from '../services/outboxService';
import { fetchIsOnline } from '../utils/network';

interface EmployeeSelectModalProps {
  code: string;
  username: string;
  division: string;
  employeeList: string[];
  onClose: () => void;
  /** Movement recorded (or queued offline) and the user dismissed the confirmation. */
  onSuccess: () => void;
  /** The server doesn't know this code yet — the caller should offer registration. */
  onFileNotInSystem: (code: string) => void;
}

/**
 * "The file is marked to:" — picks the employee a scanned file is handed to
 * and records the movement. Mount it only while it should be shown: each
 * mount starts with a clean selection.
 */
export function EmployeeSelectModal({
  code,
  username,
  division,
  employeeList,
  onClose,
  onSuccess,
  onFileNotInSystem,
}: EmployeeSelectModalProps) {
  const { colors } = useTheme();
  const { showDialog, dialogProps } = useDialog();
  const markMutation = useMarkFileMutation();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [frequentEmployees, setFrequentEmployees] = useState<string[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const isSubmitting = markMutation.isPending || isQueueing;

  // Track keyboard visibility to adapt modal density.
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Colleagues this user marks files to most often, for one-tap selection.
  useEffect(() => {
    if (division) FrequentEmployeeService.getFrequentEmployees(division).then(setFrequentEmployees);
  }, [division]);

  const normalizedFilter = filterQuery.toLowerCase();
  const filteredEmployees = employeeList.filter((emp) =>
    emp.toLowerCase().includes(normalizedFilter),
  );

  /** Saves to the outbox first; only then tells the user it was saved. */
  const queueOffline = async (employee: string, reason: string) => {
    setIsQueueing(true);
    try {
      await OutboxService.enqueueMarkEmployee(code, username, employee);
      await FrequentEmployeeService.recordEmployeeUsage(division, employee);
      showDialog({
        title: 'Saved Offline',
        message: `${reason} The file movement was saved and will be sent automatically when the connection returns.`,
        type: 'info',
        onDismiss: onSuccess,
      });
    } catch {
      showDialog({
        title: 'Could Not Save',
        message: 'The file movement could not be saved on this device. Please try again.',
        type: 'error',
      });
    } finally {
      setIsQueueing(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const employee = selectedEmployee.trim();
    if (!employee) {
      showDialog({
        title: 'Employee Required',
        message: 'Please select or enter an employee name to mark this file to.',
        type: 'warning',
      });
      return;
    }

    if (!(await fetchIsOnline())) {
      await queueOffline(employee, 'This device is offline.');
      return;
    }

    try {
      const outcome = await markMutation.mutateAsync({ code, username, employee });
      if (outcome.kind === 'ok') {
        await FrequentEmployeeService.recordEmployeeUsage(division, employee);
        showDialog({
          title: 'Movement Recorded',
          message: 'File movement successfully recorded in the WRD system.',
          type: 'success',
          onDismiss: onSuccess,
        });
      } else if (outcome.kind === 'not_registered') {
        onFileNotInSystem(code);
      } else {
        showDialog({ title: 'Server Notice', message: outcome.message, type: 'warning' });
      }
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.isNetworkError) {
        await queueOffline(employee, 'The WRD server could not be reached.');
        return;
      }
      // The server answered with an error: retrying the same request later
      // won't help, so don't queue it — tell the user it was NOT recorded.
      showDialog({
        title: 'Not Recorded',
        message: `${apiError.message} The movement was not recorded — please try again.`,
        type: 'error',
      });
    }
  };

  return (
    <>
      <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={Keyboard.dismiss}
            />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  borderWidth: 1,
                  shadowColor: colors.shadow,
                },
                isKeyboardVisible && styles.cardKeyboardActive,
              ]}
            >
              <View style={[styles.header, isKeyboardVisible && { marginBottom: 8 }]}>
                <AppText style={[styles.title, { color: colors.primary }]}>
                  The file is marked to:
                </AppText>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Readonly Info Badges */}
              <View style={[styles.infoRow, isKeyboardVisible && { marginBottom: 8 }]}>
                <View style={[styles.infoBadge, { backgroundColor: colors.badgeBackground }]}>
                  <QrCode size={16} color={colors.primary} />
                  <AppText
                    style={[styles.infoBadgeText, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    Code: {code}
                  </AppText>
                </View>
                <View style={[styles.infoBadge, { backgroundColor: colors.badgeBackground }]}>
                  <User size={16} color={colors.primary} />
                  <AppText
                    style={[styles.infoBadgeText, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    By: {username}
                  </AppText>
                </View>
              </View>

              {!isKeyboardVisible && (
                <AppText style={[styles.divisionLabel, { color: colors.textSecondary }]}>
                  Department Division:{' '}
                  <AppText style={[styles.bold, { color: colors.text }]}>{division}</AppText>
                </AppText>
              )}

              {/* Frequent Colleagues Quick Chips (collapsed while typing to preserve search visibility) */}
              {!isKeyboardVisible &&
                filterQuery.trim().length === 0 &&
                frequentEmployees.length > 0 && (
                  <View style={styles.frequentSection}>
                    <View style={styles.frequentHeader}>
                      <Sparkles size={13} color={colors.primary} />
                      <AppText style={[styles.frequentLabel, { color: colors.textSecondary }]}>
                        Frequent Colleagues:
                      </AppText>
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
                            <AppText
                              style={[
                                styles.frequentChipText,
                                { color: isSelected ? colors.white : colors.text },
                              ]}
                            >
                              {emp}
                            </AppText>
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
                style={{ height: 44, marginBottom: 8 }}
              />

              {/* Employee List */}
              <View
                style={[
                  styles.listContainer,
                  {
                    borderColor: colors.border,
                    maxHeight: isKeyboardVisible ? 130 : 180,
                  },
                ]}
              >
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
                        onPress={() => {
                          Keyboard.dismiss();
                          setSelectedEmployee(filterQuery.trim());
                        }}
                      >
                        <UserPlus size={18} color={colors.primary} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <AppText style={[styles.unlistedTitle, { color: colors.primary }]}>
                            Mark to unlisted employee:
                          </AppText>
                          <AppText style={[styles.unlistedName, { color: colors.text }]}>
                            &ldquo;{filterQuery.trim()}&rdquo;
                          </AppText>
                        </View>
                        <Check size={16} color={colors.primary} />
                      </TouchableOpacity>
                    ) : (
                      <AppText style={[styles.emptyText, { color: colors.textMuted }]}>
                        No employees found in {division}
                      </AppText>
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
                        onPress={() => {
                          Keyboard.dismiss();
                          setSelectedEmployee(item);
                        }}
                      >
                        <AppText
                          style={[
                            styles.employeeName,
                            {
                              color: isSelected ? colors.primary : colors.text,
                              fontFamily: isSelected ? fontFamilies.bold : fontFamilies.regular,
                            },
                          ]}
                        >
                          {item}
                        </AppText>
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
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Themed Feedback Dialog */}
      <CustomDialog {...dialogProps} />
    </>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  cardKeyboardActive: {
    padding: 14,
    paddingBottom: 16,
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

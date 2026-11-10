import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { QrCode, User, Users, Check, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { CustomButton } from './common/CustomButton';
import { CustomInput } from './common/CustomInput';
import { CustomDialog, DialogType } from './common/CustomDialog';
import { FileTrackerApi } from '../api/fileTrackerApi';

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
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: DialogType;
    onCloseAction?: () => void;
  }>({ visible: false, title: '' });

  const filteredEmployees = employeeList.filter((emp) =>
    emp.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      setDialog({
        visible: true,
        title: 'Employee Required',
        message: 'Please select an employee to mark this file to.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await FileTrackerApi.markFileToEmployee(
        code,
        username,
        selectedEmployee
      );

      if (response === 'Ok') {
        setDialog({
          visible: true,
          title: 'Movement Recorded',
          message: 'File movement successfully recorded in system.',
          type: 'success',
          onCloseAction: onSuccess,
        });
      } else if (response === 'File not in System') {
        onClose();
        onFileNotInSystem(code);
      } else {
        setDialog({
          visible: true,
          title: 'System Response',
          message: response || 'File marked successfully.',
          type: 'info',
          onCloseAction: onSuccess,
        });
      }
    } catch (error: any) {
      setDialog({
        visible: true,
        title: 'Submission Error',
        message: error.message || 'Failed to submit file movement.',
        type: 'error',
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
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
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

          {/* Employee Filter Input */}
          <CustomInput
            placeholder="Search employee in this division..."
            value={filterQuery}
            onChangeText={setFilterQuery}
            leftIcon={<Users size={18} color={colors.textSecondary} />}
            style={{ height: 44 }}
          />

          {/* Employee List */}
          <View style={[styles.listContainer, { borderColor: colors.border }]}>
            <FlatList
              data={filteredEmployees}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No employees found in {division}
                </Text>
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
      </View>
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
    marginBottom: 12,
  },
  bold: {
    fontFamily: fontFamilies.bold,
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

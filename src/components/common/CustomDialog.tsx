import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { CustomButton } from './CustomButton';

export type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: DialogType;
  buttons?: DialogButton[];
  onClose?: () => void;
}

export function CustomDialog({
  visible,
  title,
  message,
  type = 'info',
  buttons,
  onClose,
}: CustomDialogProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  const defaultButtons: DialogButton[] = [
    {
      text: 'OK',
      onPress: onClose,
      style: 'default',
    },
  ];

  const activeButtons = buttons && buttons.length > 0 ? buttons : defaultButtons;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return (
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.successBadge },
            ]}
          >
            <CheckCircle2 size={32} color={colors.success} />
          </View>
        );
      case 'error':
        return (
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.errorBadge },
            ]}
          >
            <AlertCircle size={32} color={colors.error} />
          </View>
        );
      case 'warning':
        return (
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.warningBadge },
            ]}
          >
            <AlertTriangle size={32} color={colors.warning} />
          </View>
        );
      case 'confirm':
        return (
          <View style={[styles.iconWrapper, { backgroundColor: colors.badgeBackground }]}>
            <HelpCircle size={32} color={colors.primary} />
          </View>
        );
      case 'info':
      default:
        return (
          <View style={[styles.iconWrapper, { backgroundColor: colors.badgeBackground }]}>
            <Info size={32} color={colors.primary} />
          </View>
        );
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.dialogCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                },
              ]}
            >
              {renderIcon()}

              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

              {message ? (
                <Text style={[styles.message, { color: colors.textSecondary }]}>
                  {message}
                </Text>
              ) : null}

              <View style={styles.buttonRow}>
                {activeButtons.map((btn, index) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';

                  return (
                    <CustomButton
                      key={index}
                      title={btn.text}
                      variant={isCancel ? 'outline' : isDestructive ? 'danger' : 'primary'}
                      style={[
                        styles.dialogButton,
                        activeButtons.length > 1 && { flex: 1 },
                      ]}
                      onPress={() => {
                        if (btn.onPress) {
                          btn.onPress();
                        } else if (onClose) {
                          onClose();
                        }
                      }}
                    />
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  dialogButton: {
    height: 48,
    borderRadius: 14,
  },
});

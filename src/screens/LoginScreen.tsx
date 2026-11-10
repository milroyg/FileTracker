import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { User, Building, Lock, ChevronDown, Check, X } from 'lucide-react-native';
import { LoginScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { CustomInput } from '../components/common/CustomInput';
import { CustomButton } from '../components/common/CustomButton';
import { CustomDialog, DialogType } from '../components/common/CustomDialog';
import { useDirectory } from '../hooks/useDirectory';
import { StorageService } from '../services/storageService';
import { SecurityConfig } from '../config/security';

export function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data: directory, isLoading: isDirLoading } = useDirectory();

  const [username, setUsername] = useState('');
  const [division, setDivision] = useState('');
  const [password, setPassword] = useState('');
  const [divisionModalVisible, setDivisionModalVisible] = useState(false);
  const [divisionSearch, setDivisionSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: DialogType;
  }>({ visible: false, title: '' });

  useEffect(() => {
    async function checkAutoLogin() {
      const session = await StorageService.getSession();
      if (session.isLoggedIn && session.username && session.division) {
        navigation.replace('Dashboard', {
          username: session.username,
          division: session.division,
        });
      }
    }
    checkAutoLogin();
  }, [navigation]);

  const divisionsList = directory?.divisions || [];
  const filteredDivisions = divisionsList.filter((d) =>
    d.toLowerCase().includes(divisionSearch.toLowerCase())
  );

  const handleLogin = async () => {
    const trimmedUser = username.trim();
    const trimmedDiv = division.trim();

    if (!trimmedUser || !trimmedDiv || !password) {
      setDialog({
        visible: true,
        title: 'Incomplete Fields',
        message: 'Please enter username, division, and password.',
        type: 'warning',
      });
      return;
    }

    if (password !== SecurityConfig.DEFAULT_ADMIN_PASSWORD) {
      setDialog({
        visible: true,
        title: 'Invalid Password',
        message: 'The credentials entered are incorrect.',
        type: 'error',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await StorageService.saveSession(trimmedUser, trimmedDiv);
      navigation.replace('Dashboard', {
        username: trimmedUser,
        division: trimmedDiv,
      });
    } catch (err: any) {
      setDialog({
        visible: true,
        title: 'Login Error',
        message: err.message || 'Unable to persist login session.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.primary,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <KeyboardAwareScrollView
        bottomOffset={20}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
          {/* Logo & Branding */}
          <View style={styles.branding}>
            <Text style={[styles.title, { color: colors.primary }]}>WRD FileTracker</Text>
          </View>

          {/* Username Input */}
          <CustomInput
            label="Username / Employee"
            placeholder="Enter your name"
            value={username}
            onChangeText={setUsername}
            leftIcon={<User size={18} color={colors.textSecondary} />}
          />

          {/* Division Selector */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Division</Text>
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => setDivisionModalVisible(true)}
          >
            <View style={styles.dropdownLeft}>
              <Building size={18} color={colors.textSecondary} />
              <Text
                style={[
                  styles.dropdownText,
                  { color: division ? colors.text : colors.textMuted },
                ]}
              >
                {division || (isDirLoading ? 'Loading divisions...' : 'Select Division')}
              </Text>
            </View>
            <ChevronDown size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Password Input */}
          <CustomInput
            label="Password"
            placeholder="Enter department password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
          />

          {/* Submit Button */}
          <CustomButton
            title="Login"
            onPress={handleLogin}
            loading={isSubmitting}
            style={styles.loginBtn}
          />
        </View>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          WRD FileTracker v2.0 • Government of Goa
        </Text>
      </KeyboardAwareScrollView>

      {/* Division Picker Modal */}
      <Modal
        visible={divisionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDivisionModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Division</Text>
              <TouchableOpacity onPress={() => setDivisionModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <CustomInput
              placeholder="Search division..."
              value={divisionSearch}
              onChangeText={setDivisionSearch}
              style={{ height: 42 }}
            />

            <FlatList
              data={filteredDivisions}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item === division;
                return (
                  <TouchableOpacity
                    style={[
                      styles.divisionItem,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: colors.badgeBackground },
                    ]}
                    onPress={() => {
                      setDivision(item);
                      setDivisionModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.divisionItemText,
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
        </View>
      </Modal>

      {/* Themed Feedback Dialog */}
      <CustomDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onClose={() => setDialog({ visible: false, title: '' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 10,
  },
  title: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 26,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  fieldLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    marginBottom: 6,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
  },
  loginBtn: {
    marginTop: 10,
  },
  versionText: {
    fontFamily: fontFamilies.semiBold,
    textAlign: 'center',
    fontSize: 13,
    marginTop: 24,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  divisionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  divisionItemText: {
    fontSize: 16,
  },
});

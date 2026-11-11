import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { User, Building, Lock, ChevronDown, Check, X, Eye, EyeOff, Search } from 'lucide-react-native';
import { LoginScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { CustomInput } from '../components/common/CustomInput';
import { CustomButton } from '../components/common/CustomButton';
import { CustomDialog, DialogType } from '../components/common/CustomDialog';
import { useDirectory } from '../hooks/useDirectory';
import { StorageService } from '../services/storageService';
import { SecurityConfig } from '../config/security';
import { APP_VERSION } from '../config/appInfo';

export function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data: directory, isLoading: isDirLoading } = useDirectory();

  const [username, setUsername] = useState('');
  const [division, setDivision] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    if (trimmedUser.length < 3) {
      setDialog({
        visible: true,
        title: 'Invalid Username',
        message: 'Username must be at least 3 characters long.',
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
        bottomOffset={80}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
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
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
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
            onPress={() => {
              Keyboard.dismiss();
              setDivisionSearch('');
              setDivisionModalVisible(true);
            }}
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
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            rightIcon={
              showPassword ? (
                <EyeOff size={18} color={colors.textSecondary} />
              ) : (
                <Eye size={18} color={colors.textSecondary} />
              )
            }
            onRightIconPress={() => setShowPassword((prev) => !prev)}
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
          WRD FileTracker v{APP_VERSION} • Government of Goa
        </Text>
      </KeyboardAwareScrollView>

      {/* Division Picker Modal */}
      <Modal
        visible={divisionModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          Keyboard.dismiss();
          setDivisionModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            style={[styles.modalBackdropDismiss, { backgroundColor: colors.overlay }]}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setDivisionModalVisible(false);
            }}
          />
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
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Division</Text>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setDivisionModalVisible(false);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <CustomInput
              placeholder="Search division..."
              value={divisionSearch}
              onChangeText={setDivisionSearch}
              leftIcon={<Search size={16} color={colors.textSecondary} />}
              clearable
              onClear={() => setDivisionSearch('')}
              returnKeyType="search"
              autoCorrect={false}
              style={{ height: 44 }}
            />

            <FlatList
              data={filteredDivisions}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              style={styles.divisionList}
              contentContainerStyle={styles.divisionListContent}
              ListEmptyComponent={
                <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontFamily: fontFamilies.medium,
                      fontSize: 14,
                    }}
                  >
                    No divisions found matching "{divisionSearch}"
                  </Text>
                </View>
              }
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
                      Keyboard.dismiss();
                      setDivision(item);
                      setDivisionModalVisible(false);
                      setDivisionSearch('');
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
        </KeyboardAvoidingView>
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
    paddingBottom: 40,
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
  modalBackdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  divisionList: {
    flexGrow: 0,
    flexShrink: 1,
    marginTop: 4,
  },
  divisionListContent: {
    paddingBottom: 8,
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

import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { User, Building, Lock, ChevronDown, Eye, EyeOff } from 'lucide-react-native';
import type { LoginScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { AppText } from '../components/common/AppText';
import { CustomInput } from '../components/common/CustomInput';
import { CustomButton } from '../components/common/CustomButton';
import { CustomDialog } from '../components/common/CustomDialog';
import { DivisionPickerModal } from '../components/DivisionPickerModal';
import { useDialog } from '../hooks/useDialog';
import { useDirectory } from '../hooks/useDirectory';
import { StorageService } from '../services/storageService';
import { verifyDepartmentPassword } from '../services/authService';
import { APP_VERSION } from '../config/appInfo';

const MIN_USERNAME_LENGTH = 3;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { directory, isLoading: isDirectoryLoading } = useDirectory();
  const { showDialog, dialogProps } = useDialog();

  const [username, setUsername] = useState('');
  const [division, setDivision] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (isSubmitting) return;
    const trimmedUser = username.trim();
    const trimmedDivision = division.trim();

    if (!trimmedUser || !trimmedDivision || !password) {
      showDialog({
        title: 'Incomplete Fields',
        message: 'Please enter username, division, and password.',
        type: 'warning',
      });
      return;
    }
    if (trimmedUser.length < MIN_USERNAME_LENGTH) {
      showDialog({
        title: 'Invalid Username',
        message: `Username must be at least ${MIN_USERNAME_LENGTH} characters long.`,
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const check = await verifyDepartmentPassword(password);
      if (check === 'not_configured') {
        showDialog({
          title: 'App Not Configured',
          message:
            'This build has no department password configured. Please contact the WRD IT administrator.',
          type: 'error',
        });
        return;
      }
      if (check === 'invalid') {
        showDialog({
          title: 'Invalid Password',
          message: 'The credentials entered are incorrect.',
          type: 'error',
        });
        return;
      }

      const session = { username: trimmedUser, division: trimmedDivision };
      await StorageService.saveSession(session);
      setPassword('');
      navigation.replace('Dashboard', session);
    } catch (error) {
      showDialog({
        title: 'Login Error',
        message: error instanceof Error ? error.message : 'Unable to save the login session.',
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
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.branding}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <AppText style={[styles.title, { color: colors.primary }]} accessibilityRole="header">
              WRD FileTracker
            </AppText>
          </View>

          <CustomInput
            label="Username / Employee"
            placeholder="Enter your name"
            value={username}
            onChangeText={setUsername}
            autoComplete="username"
            leftIcon={<User size={18} color={colors.textSecondary} />}
          />

          <AppText style={[styles.fieldLabel, { color: colors.textSecondary }]}>Division</AppText>
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              { backgroundColor: colors.inputBackground, borderColor: colors.border },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              Keyboard.dismiss();
              setIsPickerOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={division ? `Division: ${division}` : 'Select division'}
          >
            <View style={styles.dropdownLeft}>
              <Building size={18} color={colors.textSecondary} />
              <AppText
                style={[styles.dropdownText, { color: division ? colors.text : colors.textMuted }]}
                numberOfLines={1}
              >
                {division || (isDirectoryLoading ? 'Loading divisions...' : 'Select Division')}
              </AppText>
            </View>
            <ChevronDown size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <CustomInput
            label="Password"
            placeholder="Enter department password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
            returnKeyType="go"
            autoComplete="password"
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            rightIcon={
              showPassword ? (
                <EyeOff size={18} color={colors.textSecondary} />
              ) : (
                <Eye size={18} color={colors.textSecondary} />
              )
            }
            onRightIconPress={() => setShowPassword((prev) => !prev)}
            rightIconAccessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          />

          <CustomButton
            title="Login"
            onPress={handleLogin}
            loading={isSubmitting}
            style={styles.loginBtn}
          />
        </View>

        <AppText style={[styles.versionText, { color: colors.headerSubtext }]}>
          WRD FileTracker v{APP_VERSION} • Government of Goa
        </AppText>
      </KeyboardAwareScrollView>

      {isPickerOpen && (
        <DivisionPickerModal
          divisions={directory.divisions}
          selected={division}
          onSelect={(selected) => {
            setDivision(selected);
            setIsPickerOpen(false);
          }}
          onClose={() => setIsPickerOpen(false)}
        />
      )}

      <CustomDialog {...dialogProps} />
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
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: {
    flex: 1,
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
});

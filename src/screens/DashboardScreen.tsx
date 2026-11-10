import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Camera, LogOut } from 'lucide-react-native';
import { DashboardScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { StorageService } from '../services/storageService';
import { CustomDialog } from '../components/common/CustomDialog';

export function DashboardScreen({ route, navigation }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { username, division } = route.params;
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutDialogVisible(false);
    await StorageService.clearSession();
    navigation.replace('Login');
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Top Curved Header - Matches reference image */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: colors.primary,
            borderBottomColor: colors.headerBorder,
            borderBottomWidth: 1,
            shadowColor: colors.shadow,
          },
        ]}
      >
        {/* User Info Bar & Logout */}
        <View style={styles.topRow}>
          <View style={styles.userInfo}>
            <Text style={[styles.welcomeLabel, { color: colors.headerSubtext }]}>Welcome,</Text>
            <Text style={[styles.usernameText, { color: colors.headerText }]}>{username}</Text>
            <View
              style={[
                styles.divisionBadge,
                { backgroundColor: colors.headerButtonBackground },
              ]}
            >
              <Text
                style={[
                  styles.divisionBadgeText,
                  { color: colors.headerText },
                ]}
              >
                {division}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.logoutBtn,
              { backgroundColor: colors.headerButtonBackground },
            ]}
            onPress={handleLogout}
            accessibilityLabel="Logout"
          >
            <LogOut size={20} color={colors.headerText} />
          </TouchableOpacity>
        </View>

        {/* Centered Logo & WRD FileTracker Title */}
        <View style={styles.centerBranding}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.brandTitle, { color: colors.headerText }]}>
            WRD FileTracker
          </Text>
        </View>
      </View>

      {/* Main Action Hub - Centered Pill Buttons */}
      <View style={styles.actionContainer}>
        {/* Search Pill Button */}
        <TouchableOpacity
          style={[
            styles.pillButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Search')}
        >
          <Search size={26} color={colors.primary} />
          <Text style={[styles.pillButtonText, { color: colors.text }]}>Search</Text>
        </TouchableOpacity>

        {/* Scan Pill Button */}
        <TouchableOpacity
          style={[
            styles.pillButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Scanner', { username, division })}
        >
          <Camera size={26} color={colors.primary} />
          <Text style={[styles.pillButtonText, { color: colors.text }]}>Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Themed Logout Confirmation Dialog */}
      <CustomDialog
        visible={logoutDialogVisible}
        title="Logout"
        message="Are you sure you want to log out of WRD FileTracker?"
        type="confirm"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setLogoutDialogVisible(false) },
          { text: 'Logout', style: 'destructive', onPress: confirmLogout },
        ]}
        onClose={() => setLogoutDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerCard: {
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 36,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  welcomeLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
  usernameText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  divisionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  divisionBadgeText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBranding: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 10,
  },
  brandTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 26,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 210,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    gap: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pillButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    letterSpacing: -0.2,
  },
});

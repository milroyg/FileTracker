import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QrCode, Search, LogOut, FileText } from 'lucide-react-native';
import { DashboardScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { StorageService } from '../services/storageService';

export function DashboardScreen({ route, navigation }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { username, division } = route.params;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of WRD FileTracker?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await StorageService.clearSession();
          navigation.replace('Login');
        },
      },
    ]);
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
      {/* Top Banner Card */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: isDark ? colors.cardBackground : colors.primary,
            borderBottomColor: colors.border,
            borderBottomWidth: isDark ? 1 : 0,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeLabel}>Welcome,</Text>
            <Text style={styles.usernameText}>{username}</Text>
            <View
              style={[
                styles.divisionBadge,
                { backgroundColor: isDark ? 'rgba(76,115,253,0.2)' : 'rgba(255,255,255,0.2)' },
              ]}
            >
              <Text
                style={[
                  styles.divisionBadgeText,
                  { color: isDark ? colors.primary : '#ffffff' },
                ]}
              >
                {division}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.logoutBtn,
              { backgroundColor: isDark ? colors.surface : 'rgba(255,255,255,0.18)' },
            ]}
            onPress={handleLogout}
            accessibilityLabel="Logout"
          >
            <LogOut size={20} color={isDark ? colors.textSecondary : '#ffffff'} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.brandingBanner,
            { backgroundColor: isDark ? colors.surface : 'rgba(255,255,255,0.12)' },
          ]}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.brandTitle, { color: isDark ? colors.text : '#ffffff' }]}>
              WRD FileTracker
            </Text>
            <Text
              style={[
                styles.brandSubtitle,
                { color: isDark ? colors.textSecondary : 'rgba(255,255,255,0.8)' },
              ]}
            >
              Water Resources Department
            </Text>
          </View>
        </View>
      </View>

      {/* Main Action Hub */}
      <View style={styles.actionContainer}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Quick Actions</Text>

        {/* Scan Barcode / QR Action Card */}
        <TouchableOpacity
          style={[
            styles.actionCard,
            styles.scanCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              borderLeftColor: colors.primary,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Scanner', { username, division })}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <QrCode size={36} color="#ffffff" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Scan Barcode / QR
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Scan physical file code and mark custody to an employee
            </Text>
          </View>
        </TouchableOpacity>

        {/* Search Action Card */}
        <TouchableOpacity
          style={[
            styles.actionCard,
            styles.searchCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              borderLeftColor: colors.accent,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Search')}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
            <Search size={36} color="#ffffff" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Search Files
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Search movement logs by code or query files by subject name
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer Version */}
      <View style={styles.footer}>
        <FileText size={16} color={colors.textMuted} />
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          WRD FileTracker v2.0 • Government of Goa
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerCard: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  welcomeLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  usernameText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 22,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  divisionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  divisionBadgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
  },
  logoutBtn: {
    padding: 10,
    borderRadius: 12,
  },
  brandingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
  },
  brandTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 17,
  },
  brandSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
  },
  actionContainer: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  sectionHeading: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
  },
  scanCard: {
    borderLeftWidth: 6,
  },
  searchCard: {
    borderLeftWidth: 6,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  footerText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
});

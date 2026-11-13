import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Camera, LogOut, CloudUpload, ChevronRight } from 'lucide-react-native';
import type { DashboardScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { StorageService } from '../services/storageService';
import { AppText } from '../components/common/AppText';
import { CustomDialog } from '../components/common/CustomDialog';
import { OutboxSheet } from '../components/outbox/OutboxSheet';
import { RegisterFileModal } from '../components/RegisterFileModal';
import { useOutbox } from '../hooks/useOutbox';

export function DashboardScreen({ route, navigation }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { username, division } = route.params;
  const { items: outboxItems } = useOutbox();
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [codeToRegister, setCodeToRegister] = useState<string | null>(null);

  const attentionCount = outboxItems.filter((item) => item.status !== 'pending').length;
  const pendingCount = outboxItems.length - attentionCount;

  const confirmLogout = async () => {
    setLogoutDialogVisible(false);
    await StorageService.clearSession();
    navigation.replace('Login');
  };

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}
    >
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: colors.headerBackground,
            paddingTop: insets.top + 14,
            borderBottomColor: colors.headerBorder,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.userInfo}>
            <AppText style={[styles.welcomeLabel, { color: colors.headerSubtext }]}>
              Welcome,
            </AppText>
            <AppText style={[styles.usernameText, { color: colors.headerText }]}>
              {username}
            </AppText>
            <View
              style={[styles.divisionBadge, { backgroundColor: colors.headerButtonBackground }]}
            >
              <AppText style={[styles.divisionBadgeText, { color: colors.headerText }]}>
                {division}
              </AppText>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.headerButtonBackground }]}
            onPress={() => setLogoutDialogVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <LogOut size={20} color={colors.headerText} />
          </TouchableOpacity>
        </View>

        <View style={styles.centerBranding}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <AppText
            style={[styles.brandTitle, { color: colors.headerText }]}
            accessibilityRole="header"
          >
            WRD FileTracker
          </AppText>
        </View>
      </View>

      <View style={styles.actionContainer}>
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
          accessibilityRole="button"
        >
          <Search size={26} color={colors.primary} />
          <AppText style={styles.pillButtonText}>Search</AppText>
        </TouchableOpacity>

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
          accessibilityRole="button"
        >
          <Camera size={26} color={colors.primary} />
          <AppText style={styles.pillButtonText}>Scan</AppText>
        </TouchableOpacity>

        {outboxItems.length > 0 && (
          <TouchableOpacity
            style={[
              styles.outboxCard,
              {
                backgroundColor: attentionCount > 0 ? colors.warningBadge : colors.badgeBackground,
                borderColor: attentionCount > 0 ? colors.warning : colors.border,
              },
            ]}
            onPress={() => setIsOutboxOpen(true)}
            accessibilityRole="button"
            accessibilityHint="Opens the list of actions saved while offline"
          >
            <CloudUpload size={20} color={attentionCount > 0 ? colors.warning : colors.primary} />
            <View style={styles.outboxTextWrap}>
              <AppText style={styles.outboxTitle}>
                {pendingCount > 0
                  ? `${pendingCount} action${pendingCount === 1 ? '' : 's'} waiting to sync`
                  : 'Saved actions need attention'}
              </AppText>
              {attentionCount > 0 && (
                <AppText style={[styles.outboxSubtitle, { color: colors.textSecondary }]}>
                  {attentionCount} need{attentionCount === 1 ? 's' : ''} your attention
                </AppText>
              )}
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {isOutboxOpen && (
        <OutboxSheet
          onClose={() => setIsOutboxOpen(false)}
          onRegisterFile={(code) => {
            setIsOutboxOpen(false);
            setCodeToRegister(code);
          }}
        />
      )}

      {codeToRegister && (
        <RegisterFileModal
          code={codeToRegister}
          username={username}
          onClose={() => setCodeToRegister(null)}
          onSuccess={() => setCodeToRegister(null)}
        />
      )}

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
    borderBottomWidth: 1,
    paddingHorizontal: 24,
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
  outboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  outboxTextWrap: {
    flex: 1,
  },
  outboxTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
  },
  outboxSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});

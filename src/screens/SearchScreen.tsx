import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';
import { Search, ArrowLeft, History, AlertCircle } from 'lucide-react-native';
import type { SearchScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { AppText } from '../components/common/AppText';
import { CustomInput } from '../components/common/CustomInput';
import { CustomButton } from '../components/common/CustomButton';
import { RecentSearches } from '../components/search/RecentSearches';
import { FileResultsList } from '../components/search/FileResultsList';
import { MovementResults } from '../components/search/MovementResults';
import type { FileSearchResult } from '../api/fileTrackerApi';
import { useFileSearch } from '../hooks/useFileTracker';
import { RecentSearchService } from '../services/recentSearchService';

/** Opened from a subject search: remembers which list to go back to. */
interface Drilldown {
  fromTerm: string;
  filename: string;
}

export function SearchScreen({ route, navigation }: SearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const initialCode = route.params?.initialCode?.trim() || null;

  const [query, setQuery] = useState(initialCode ?? '');
  const [submitted, setSubmitted] = useState<string | null>(initialCode);
  const [drilldown, setDrilldown] = useState<Drilldown | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const search = useFileSearch(submitted);

  useEffect(() => {
    RecentSearchService.getRecentSearches().then(setRecentSearches);
  }, []);

  // Remember a term only once it actually returned results from the server.
  useEffect(() => {
    if (submitted && search.isSuccess) {
      RecentSearchService.addRecentSearch(submitted).then(setRecentSearches);
    }
  }, [submitted, search.isSuccess]);

  const runSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    setQuery(trimmed);
    setDrilldown(null);
    if (trimmed === submitted) {
      // Same term again = explicit refresh; joins any request already in flight.
      void search.refetch({ cancelRefetch: false });
    } else {
      setSubmitted(trimmed);
    }
  };

  const openFile = (file: FileSearchResult) => {
    if (submitted) setDrilldown({ fromTerm: submitted, filename: file.filename });
    setQuery(file.code);
    setSubmitted(file.code);
  };

  const backToFileList = () => {
    if (!drilldown) return;
    setQuery(drilldown.fromTerm);
    setSubmitted(drilldown.fromTerm); // served from cache, no new request
    setDrilldown(null);
  };

  // While drilled into a file, back (button, gesture, Android key) returns to the list.
  usePreventRemove(drilldown !== null, backToFileList);

  const clearSearch = () => {
    setQuery('');
    setSubmitted(null);
    setDrilldown(null);
  };

  const renderResults = () => {
    if (!submitted) return null;
    if (search.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.textSecondary }]}>
            Fetching records from WRD server...
          </AppText>
        </View>
      );
    }
    if (search.error) {
      return (
        <View style={styles.centered}>
          <AlertCircle size={44} color={colors.error} />
          <AppText style={styles.errorTitle}>Search Failed</AppText>
          <AppText style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            {search.error.message}
          </AppText>
          <CustomButton
            title="Retry Search"
            onPress={() => void search.refetch()}
            style={styles.retryBtn}
          />
        </View>
      );
    }
    return search.mode === 'CODE' ? (
      <MovementResults code={submitted} filename={drilldown?.filename} records={search.movements} />
    ) : (
      <FileResultsList files={search.files} onSelect={openFile} />
    );
  };

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBackground,
            paddingTop: insets.top + 12,
            borderBottomColor: colors.headerBorder,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.headerButtonBackground }]}
            onPress={() => (drilldown ? backToFileList() : navigation.goBack())}
            accessibilityRole="button"
            accessibilityLabel={drilldown ? 'Back to file list' : 'Back'}
          >
            <ArrowLeft size={22} color={colors.headerText} />
          </TouchableOpacity>
          <AppText
            style={[styles.headerTitle, { color: colors.headerText }]}
            accessibilityRole="header"
          >
            WRD FileTracker
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <CustomInput
          placeholder="Enter Code or Filename"
          accessibilityLabel="Search by file code or subject"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => runSearch(query)}
          returnKeyType="search"
          clearable
          onClear={clearSearch}
          leftIcon={<Search size={18} color={colors.textSecondary} />}
          onRightIconPress={() => runSearch(query)}
          rightIconAccessibilityLabel="Search"
          rightIcon={
            <View
              style={[
                styles.searchButton,
                { backgroundColor: colors.primary },
                search.isLoading && styles.searchButtonBusy,
              ]}
            >
              {search.isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <AppText style={[styles.searchButtonText, { color: colors.white }]}>Search</AppText>
              )}
            </View>
          }
          style={styles.inputOverrides}
        />
        <AppText style={[styles.helperText, { color: colors.headerSubtext }]}>
          *Enter code (e.g. 1024) or text subject (e.g. Tender). Tap result to inspect movements.
        </AppText>
      </View>

      {drilldown && (
        <TouchableOpacity
          style={[
            styles.drilldownBanner,
            { backgroundColor: colors.badgeBackground, borderBottomColor: colors.border },
          ]}
          onPress={backToFileList}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityHint="Returns to the file list"
        >
          <History size={16} color={colors.primary} />
          <AppText style={[styles.drilldownText, { color: colors.primary }]} numberOfLines={1}>
            Viewing: <AppText style={styles.bold}>{drilldown.filename}</AppText> (Tap to go back)
          </AppText>
        </TouchableOpacity>
      )}

      {!submitted && query === '' && recentSearches.length > 0 && (
        <RecentSearches
          terms={recentSearches}
          onSelect={runSearch}
          onClear={async () => {
            await RecentSearchService.clearRecentSearches();
            setRecentSearches([]);
          }}
        />
      )}

      {renderResults()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  inputOverrides: {
    height: 46,
    fontSize: 15,
  },
  searchButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchButtonBusy: {
    opacity: 0.65,
  },
  searchButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
  },
  helperText: {
    fontSize: 11,
    marginTop: -8,
    lineHeight: 15,
  },
  drilldownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  drilldownText: {
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
  bold: {
    fontFamily: fontFamilies.bold,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontFamily: fontFamilies.medium,
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    marginTop: 14,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryBtn: {
    minWidth: 160,
  },
});

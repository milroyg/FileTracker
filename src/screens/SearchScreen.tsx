import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  BackHandler,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ArrowLeft, FileText, ChevronRight, History } from 'lucide-react-native';
import { SearchScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { CustomInput } from '../components/common/CustomInput';
import { MovementTimeline } from '../components/MovementTimeline';
import { FileTrackerApi, MovementRecord, FileSearchResult } from '../api/fileTrackerApi';
import { classifySearchQuery, SearchMode } from '../utils/queryClassifier';
import { sortRecordsByLatestDate } from '../utils/dateUtils';

export function SearchScreen({ route, navigation }: SearchScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const initialCode = route?.params?.initialCode;

  const [query, setQuery] = useState(initialCode || '');
  const [activeMode, setActiveMode] = useState<SearchMode>('CODE');
  const [isLoading, setIsLoading] = useState(false);
  const [codeResults, setCodeResults] = useState<MovementRecord[]>([]);
  const [fileResults, setFileResults] = useState<FileSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Safeguards to strictly prevent duplicate or overlapping search API requests
  const isSearchingRef = useRef(false);
  const lastSearchTimeRef = useRef(0);
  const lastQueryRef = useRef('');
  const hasMountedRef = useRef(false);

  // Drilldown back-stack: preserves filename results when inspecting a specific code
  const [previousFilenameResults, setPreviousFilenameResults] = useState<FileSearchResult[] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleSearch = (searchQuery?: string) => {
    const raw = searchQuery !== undefined ? searchQuery : query;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const now = Date.now();
    // Drop overlapping calls or duplicate requests within 800ms
    if (
      isSearchingRef.current ||
      (lastQueryRef.current === trimmed && now - lastSearchTimeRef.current < 800)
    ) {
      console.log(`[SearchScreen] Ignored duplicate search trigger for "${trimmed}"`);
      return;
    }

    lastSearchTimeRef.current = now;
    lastQueryRef.current = trimmed;
    isSearchingRef.current = true;
    Keyboard.dismiss();

    executeSearch(trimmed);
  };

  const executeSearch = async (trimmed: string) => {
    setIsLoading(true);
    setHasSearched(true);

    const mode = classifySearchQuery(trimmed);
    setActiveMode(mode);

    try {
      if (mode === 'CODE') {
        const records = await FileTrackerApi.searchByCode(trimmed);
        setCodeResults(sortRecordsByLatestDate(records));
      } else {
        const files = await FileTrackerApi.searchByFileName(trimmed);
        setFileResults(files);
      }
    } catch (error: any) {
      console.warn('Search failed:', error);
      setCodeResults([]);
      setFileResults([]);
    } finally {
      setIsLoading(false);
      // Brief cooldown before releasing search lock
      setTimeout(() => {
        isSearchingRef.current = false;
      }, 300);
    }
  };

  useEffect(() => {
    if (initialCode && !hasMountedRef.current) {
      hasMountedRef.current = true;
      handleSearch(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    const onBackPress = () => {
      if (previousFilenameResults) {
        setFileResults(previousFilenameResults);
        setPreviousFilenameResults(null);
        setSelectedFileName(null);
        setActiveMode('FILENAME');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [previousFilenameResults]);

  const handleDrilldownCode = (file: FileSearchResult) => {
    setPreviousFilenameResults(fileResults);
    setSelectedFileName(file.filename);
    setQuery(file.code);
    setActiveMode('CODE');
    handleSearch(file.code);
  };

  const handleBackToFilenameList = () => {
    if (previousFilenameResults) {
      setFileResults(previousFilenameResults);
      setPreviousFilenameResults(null);
      setSelectedFileName(null);
      setActiveMode('FILENAME');
    }
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
      {/* Header Bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBackground,
            borderBottomColor: colors.headerBorder,
            borderBottomWidth: 1,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[
              styles.backBtn,
              { backgroundColor: colors.headerButtonBackground },
            ]}
            onPress={() => {
              if (previousFilenameResults) {
                handleBackToFilenameList();
              } else {
                navigation.goBack();
              }
            }}
          >
            <ArrowLeft size={22} color={colors.headerText} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>
            WRD FileTracker
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBarContainer}>
          <CustomInput
            placeholder="Enter Code or Filename"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            leftIcon={<Search size={18} color={colors.textSecondary} />}
            onRightIconPress={() => handleSearch()}
            rightIcon={
              <View
                style={[
                  styles.searchButton,
                  { backgroundColor: colors.primary },
                  isLoading && { opacity: 0.65 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={[styles.searchButtonText, { color: colors.white }]}>Search</Text>
                )}
              </View>
            }
            style={styles.inputOverrides}
          />
          <Text
            style={[
              styles.helperText,
              { color: colors.headerSubtext },
            ]}
          >
            *Enter code (e.g. 1024) or text subject (e.g. Tender). Tap result to inspect movements.
          </Text>
        </View>
      </View>

      {/* Drilldown Back-Banner */}
      {previousFilenameResults && selectedFileName && (
        <TouchableOpacity
          style={[
            styles.drilldownBanner,
            {
              backgroundColor: colors.badgeBackground,
              borderBottomColor: colors.border,
            },
          ]}
          onPress={handleBackToFilenameList}
          activeOpacity={0.8}
        >
          <History size={16} color={colors.primary} />
          <Text style={[styles.drilldownText, { color: colors.primary }]} numberOfLines={1}>
            Viewing: <Text style={styles.bold}>{selectedFileName}</Text> (Tap to go back)
          </Text>
        </TouchableOpacity>
      )}

      {/* Results View */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Fetching records from WRD server...
          </Text>
        </View>
      ) : activeMode === 'CODE' ? (
        <MovementTimeline records={codeResults} />
      ) : (
        <FlatList
          data={fileResults}
          keyExtractor={(item, index) => `${item.code}_${index}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            hasSearched ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  No matching files found
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Please check your spelling or search directly by file code.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.fileCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => handleDrilldownCode(item)}
            >
              <View style={styles.fileCardLeft}>
                <View
                  style={[
                    styles.fileIconBox,
                    { backgroundColor: colors.badgeBackground },
                  ]}
                >
                  <FileText size={20} color={colors.primary} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: colors.text }]}>
                    {item.filename}
                  </Text>
                  <Text style={[styles.fileCode, { color: colors.textSecondary }]}>
                    Code: <Text style={styles.bold}>{item.code}</Text>
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 12,
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
  searchBarContainer: {
    width: '100%',
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
  searchButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
  },
  helperText: {
    fontFamily: fontFamilies.regular,
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
  loadingContainer: {
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
  listContainer: {
    padding: 16,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    marginBottom: 4,
  },
  fileCode: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    textAlign: 'center',
  },
});

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X, Search } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { AppText } from './common/AppText';
import { CustomInput } from './common/CustomInput';

interface DivisionPickerModalProps {
  divisions: string[];
  selected: string;
  onSelect: (division: string) => void;
  onClose: () => void;
}

/** Searchable bottom sheet listing every division. Mount only while shown. */
export function DivisionPickerModal({
  divisions,
  selected,
  onSelect,
  onClose,
}: DivisionPickerModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');

  const normalizedSearch = search.toLowerCase();
  const filtered = divisions.filter((d) => d.toLowerCase().includes(normalizedSearch));

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={close}
          accessibilityLabel="Close division list"
        />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              shadowColor: colors.shadow,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.header}>
            <AppText style={styles.title}>Select Division</AppText>
            <TouchableOpacity
              onPress={close}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <CustomInput
            placeholder="Search division..."
            value={search}
            onChangeText={setSearch}
            leftIcon={<Search size={16} color={colors.textSecondary} />}
            clearable
            onClear={() => setSearch('')}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.searchInput}
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No divisions found matching &ldquo;{search}&rdquo;
                </AppText>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <TouchableOpacity
                  style={[
                    styles.item,
                    { borderBottomColor: colors.border },
                    isSelected && { backgroundColor: colors.badgeBackground },
                  ]}
                  onPress={() => {
                    Keyboard.dismiss();
                    onSelect(item);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <AppText
                    style={[
                      styles.itemText,
                      {
                        color: isSelected ? colors.primary : colors.text,
                        fontFamily: isSelected ? fontFamilies.bold : fontFamilies.regular,
                      },
                    ]}
                  >
                    {item}
                  </AppText>
                  {isSelected && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  searchInput: {
    height: 44,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 8,
  },
  empty: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  itemText: {
    fontSize: 16,
  },
});

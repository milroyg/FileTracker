import { useCallback, useMemo, useState } from 'react';
import type {
  CustomDialogProps,
  DialogButton,
  DialogType,
} from '../components/common/CustomDialog';

export interface DialogOptions {
  title: string;
  message?: string;
  type?: DialogType;
  /** Each button closes the dialog first, then runs its own onPress. */
  buttons?: DialogButton[];
  /** Runs when the dialog is dismissed via its default OK, backdrop or back button. */
  onDismiss?: () => void;
}

/**
 * Owns one CustomDialog's state. Every way of closing the dialog actually
 * hides it — callers never have to remember to reset visibility themselves.
 *
 *   const { showDialog, dialogProps } = useDialog();
 *   showDialog({ title: 'Saved', type: 'success', onDismiss: goBack });
 *   <CustomDialog {...dialogProps} />
 */
export function useDialog() {
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const hideDialog = useCallback(() => setOptions(null), []);
  const showDialog = useCallback((next: DialogOptions) => setOptions(next), []);

  const dialogProps = useMemo<CustomDialogProps>(
    () => ({
      visible: options !== null,
      title: options?.title ?? '',
      message: options?.message,
      type: options?.type,
      buttons: options?.buttons?.map((button) => ({
        ...button,
        onPress: () => {
          setOptions(null);
          button.onPress?.();
        },
      })),
      onClose: () => {
        const onDismiss = options?.onDismiss;
        setOptions(null);
        onDismiss?.();
      },
    }),
    [options],
  );

  return { showDialog, hideDialog, dialogProps, isDialogVisible: options !== null };
}

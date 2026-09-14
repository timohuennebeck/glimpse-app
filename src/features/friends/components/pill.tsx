import { Pressable } from 'react-native';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';
interface PillProps {
  label: string;
  /** filled = purple CTA, outline = hairline, muted = grey "Ausstehend". */
  tone?: 'filled' | 'outline' | 'muted' | 'quiet';
  onPress?: () => void;
  compact?: boolean;
}

/** Fill and hairline per tone, plus the label colour. */
const PALETTE = {
  filled: { className: 'bg-purple', textClassName: 'text-white' },
  outline: { className: 'border-[1.5px] border-border', textClassName: 'text-ink-body' },
  muted: { className: 'bg-surface-chip-cool', textClassName: 'text-muted-chip' },
  quiet: { className: 'border-[1.5px] border-border', textClassName: 'text-muted-lilac' },
} as const;

/** The small trailing action on a person row. */
export function Pill({ label, tone = 'filled', onPress, compact = false }: PillProps) {
  const palette = PALETTE[tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={cn(
        'items-center justify-center rounded-pill active:opacity-85',
        compact ? 'h-[38px] px-4' : 'px-[18px] py-[11px]',
        palette.className,
      )}
    >
      <Text variant="bodyXs" weight="semibold" className={palette.textClassName}>
        {label}
      </Text>
    </Pressable>
  );
}

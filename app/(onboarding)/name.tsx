import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { cn } from '@/shared/lib/cn';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { type as typeScale } from '@/shared/theme/fonts';
import { t, tList } from '@/shared/i18n/i18n';
import { useOnboardingDraft } from '@/features/onboarding/hooks/use-onboarding-draft';
/**
 * Screen `01 Name · 1 of 7`.
 *
 * The headline carries two inline pills: "friends" filled purple, and the name
 * itself, which is the input — you type straight into the sentence. That is
 * why this screen does not use the shared OnboardingScreen headline.
 *
 * The locale string carries `%{friends}` and `%{placeholder}`; those are
 * interpolated with sentinel markers, then the sentence is tokenised into
 * words and pills so it wraps naturally in either language.
 */
const FRIENDS_SLOT = '⁣friends⁣';
const NAME_SLOT = '⁣name⁣';
const TOKEN_SPLIT = /(⁣friends⁣|⁣name⁣|\s+)/;

interface HeadlineToken {
  kind: 'word' | 'friends' | 'name' | 'break';
  text: string;
  /** Whether the sentence had whitespace after this token. */
  spaceAfter: boolean;
}

function tokenize(sentence: string): HeadlineToken[] {
  const tokens: HeadlineToken[] = [];
  for (const part of sentence.split(TOKEN_SPLIT)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      if (part.includes('\n')) tokens.push({ kind: 'break', text: '', spaceAfter: false });
      else if (tokens.length > 0) tokens[tokens.length - 1].spaceAfter = true;
      continue;
    }
    const kind = part === FRIENDS_SLOT ? 'friends' : part === NAME_SLOT ? 'name' : 'word';
    tokens.push({ kind, text: part, spaceAfter: false });
  }
  return tokens;
}

/**
 * Tokens with no whitespace between them ("%{placeholder}?") wrap as one unit,
 * so punctuation never lands on a line of its own away from its pill.
 */
function group(tokens: HeadlineToken[]): HeadlineToken[][] {
  const groups: HeadlineToken[][] = [];
  let current: HeadlineToken[] = [];
  for (const token of tokens) {
    if (token.kind === 'break') {
      if (current.length) groups.push(current);
      groups.push([token]);
      current = [];
      continue;
    }
    current.push(token);
    if (token.spaceAfter) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

/**
 * The headline token is `headlineChips` (29px after SCALE). Tailwind's scanner
 * only sees literal class names, so the values derived from it are spelled out:
 *  - `leading-[35px]`: round(29 * 1.2) — tighter than the token's loose leading,
 *    the pills set the line height here;
 *  - `h-[39px]`: that line height plus the pill's 2 x 2px vertical padding;
 *  - `mr-2`: round(29 * 0.28) = 8px, the word gap.
 */
const LINE = 'leading-[35px]';
const CHIP = 'rounded-pill px-3.5 py-1';

export default function NameScreen() {
  const draft = useOnboardingDraft();
  const [name, setName] = useState(draft.firstName);
  const suggestions = tList<string>('onboarding.name.suggestions');
  const groups = group(
    tokenize(t('onboarding.name.title', { friends: FRIENDS_SLOT, placeholder: NAME_SLOT })),
  );

  return (
    <Screen
      scroll
      footer={
        <CtaFooter
          label={t('onboarding.name.cta')}
          onPress={() => {
            draft.set({ firstName: name.trim() });
            router.push('/(onboarding)/camera');
          }}
          disabled={name.trim().length === 0}
        />
      }
    >
      <ProgressHeader step={1} onClose={() => router.back()} />

      <View className="mt-[34px] flex-row flex-wrap items-center gap-y-2.5">
        {groups.map((tokens, g) =>
          tokens[0].kind === 'break' ? (
            <View key={g} className="h-0 w-full" />
          ) : (
            <View
              key={g}
              className={cn('flex-row items-center', tokens[tokens.length - 1].spaceAfter && 'mr-2')}
            >
              {tokens.map((token, i) => {
                switch (token.kind) {
                  case 'friends':
                    return (
                      <View key={i} className={cn(CHIP, 'bg-surface-violet-chip')}>
                        <Text variant="headlineChips" className={cn(LINE, 'text-purple-ink-alt')}>
                          {t('onboarding.name.friendsChip')}
                        </Text>
                      </View>
                    );
                  case 'name':
                    return <NameChip key={i} value={name} onChange={setName} />;
                  default:
                    return (
                      <Text key={i} variant="headlineChips" className={cn(LINE, 'text-ink')}>
                        {token.text}
                      </Text>
                    );
                }
              })}
            </View>
          ),
        )}
      </View>

      <Text variant="bodySm" className="mt-[18px] text-muted">
        {t('onboarding.name.subtitle')}
      </Text>

      <View className="mt-[26px] flex-row flex-wrap gap-2.5">
        {suggestions.map((s) => (
          <Pressable
            key={s}
            className="rounded-pill border-[1.4px] border-dashed border-border-dashed px-4 py-2.5"
            onPress={() => setName(s.replace('+ ', ''))}
            accessibilityRole="button"
            accessibilityLabel={s.replace('+ ', '')}
          >
            <Text variant="bodyXs" className="text-muted-chip">
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

interface NameChipProps {
  value: string;
  onChange: (value: string) => void;
}

/** Size and tracking of the sentence the pill sits in, so the input matches it exactly. */
const { fontSize, letterSpacing } = typeScale.headlineChips;

/**
 * The name pill is the input. A TextInput does not size itself to its text
 * horizontally, so an invisible mirror of the current value (or placeholder)
 * measures the width and the field follows it.
 */
function NameChip({ value, onChange }: NameChipProps) {
  const [width, setWidth] = useState(0);
  const placeholder = t('onboarding.name.placeholderChip');

  return (
    <View className={cn(CHIP, 'bg-surface-violet')}>
      <Text
        variant="headlineChips"
        className={cn(LINE, 'absolute opacity-0')}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {value || placeholder}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.dashedIdle}
        className="h-[39px] p-0 font-sans-semibold text-ink"
        // Size and tracking come from the theme at runtime, the width from the
        // mirror's measurement. The pill is the focus affordance; the web's
        // default focus ring would draw a hard rectangle inside it.
        style={{ fontSize, letterSpacing, width: Math.ceil(width) + 2, outlineWidth: 0 }}
        accessibilityLabel={placeholder}
        autoFocus
        autoCorrect={false}
        autoCapitalize="words"
        maxLength={24}
        returnKeyType="done"
      />
    </View>
  );
}

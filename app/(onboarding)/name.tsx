import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { fontFamily, type as typeScale } from '@/shared/theme/fonts';
import { radius } from '@/shared/theme/page-structure';
import { t, tList } from '@/shared/i18n/i18n';
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
const FRIENDS_SLOT = '\u2063friends\u2063';
const NAME_SLOT = '\u2063name\u2063';
const TOKEN_SPLIT = /(\u2063friends\u2063|\u2063name\u2063|\s+)/;

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

export default function NameScreen() {
  const [name, setName] = useState('');
  const suggestions = tList<string>('onboarding.name.suggestions');
  const groups = group(tokenize(t('onboarding.name.title', { friends: FRIENDS_SLOT, placeholder: NAME_SLOT })));

  return (
    <Screen
      scroll
      footer={
        <CtaFooter
          label={t('onboarding.name.cta')}
          onPress={() => router.push('/(onboarding)/camera')}
          disabled={name.trim().length === 0}
        />
      }
    >
      <ProgressHeader step={1} onClose={() => router.back()} />

      <View style={styles.headline}>
        {groups.map((tokens, g) =>
          tokens[0].kind === 'break' ? (
            <View key={g} style={styles.break} />
          ) : (
            <View key={g} style={[styles.group, tokens[tokens.length - 1].spaceAfter && styles.space]}>
              {tokens.map((token, i) => {
                switch (token.kind) {
                  case 'friends':
                    return (
                      <View key={i} style={[styles.chip, styles.chipFilled]}>
                        <Text variant="headlineChips" color={colors.purpleInkAlt} style={styles.line}>
                          {t('onboarding.name.friendsChip')}
                        </Text>
                      </View>
                    );
                  case 'name':
                    return <NameChip key={i} value={name} onChange={setName} />;
                  default:
                    return (
                      <Text key={i} variant="headlineChips" color={colors.ink} style={styles.line}>
                        {token.text}
                      </Text>
                    );
                }
              })}
            </View>
          ),
        )}
      </View>

      <Text variant="bodySm" color={colors.muted} style={styles.subtitle}>
        {t('onboarding.name.subtitle')}
      </Text>

      <View style={styles.chips}>
        {suggestions.map((s) => (
          <Pressable
            key={s}
            style={styles.suggestion}
            onPress={() => setName(s.replace('+ ', ''))}
            accessibilityRole="button"
            accessibilityLabel={s.replace('+ ', '')}
          >
            <Text variant="bodyXs" color={colors.mutedChip}>
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

/**
 * The name pill is the input. A TextInput does not size itself to its text
 * horizontally, so an invisible mirror of the current value (or placeholder)
 * measures the width and the field follows it.
 */
function NameChip({ value, onChange }: NameChipProps) {
  const [width, setWidth] = useState(0);
  const placeholder = t('onboarding.name.placeholderChip');

  return (
    <View style={[styles.chip, styles.chipIdle]}>
      <Text
        variant="headlineChips"
        style={[styles.line, styles.mirror]}
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
        style={[styles.input, { width: Math.ceil(width) + 2 }]}
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

const { fontSize, letterSpacing } = typeScale.headlineChips;
/** Tighter than the token's loose leading: the pills set the line height here. */
const LINE = Math.round(fontSize * 1.2);

const styles = StyleSheet.create({
  headline: { marginTop: 34, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 10 },
  group: { flexDirection: 'row', alignItems: 'center' },
  line: { lineHeight: LINE },
  space: { marginRight: Math.round(fontSize * 0.28) },
  break: { width: '100%', height: 0 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 4 },
  chipFilled: { backgroundColor: colors.surfaceVioletChip },
  chipIdle: { backgroundColor: colors.surfaceViolet },
  mirror: { position: 'absolute', opacity: 0 },
  input: {
    height: LINE + 4,
    padding: 0,
    fontSize,
    letterSpacing,
    fontFamily: fontFamily.semibold,
    color: colors.ink,
    // The pill is the focus affordance; the web's default focus ring would
    // draw a hard rectangle inside it.
    outlineWidth: 0,
  },
  subtitle: { marginTop: 18 },
  chips: { marginTop: 26, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  suggestion: {
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});

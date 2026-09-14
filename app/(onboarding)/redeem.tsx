import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { CloseRow } from '@/shared/ui/close-row';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { t } from '@/shared/i18n/i18n';
const LENGTH = 6;

/**
 * Screen `10a Redeem partner code` — six character boxes backed by one hidden
 * field, which is how OTP-style inputs behave correctly with autofill and
 * backspace.
 */
export default function RedeemScreen() {
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(true);
  const inputRef = useRef<TextInput>(null);
  const complete = code.length === LENGTH;

  return (
    <Screen
      footer={
        <View className="gap-3.5">
          <Button
            label={t('referral.redeem.cta')}
            size="md"
            disabled={!complete}
            onPress={() => router.push('/(onboarding)/heard-about')}
          />
          <Text variant="bodyXs" className="text-center text-purple-muted">
            {t('referral.redeem.note')}
          </Text>
        </View>
      }
      scroll
    >
      <CloseRow onPress={() => router.back()} />

      <Text variant="eyebrowAccent" className="mt-9 text-purple-deep">
        {t('referral.redeem.eyebrow')}
      </Text>
      <Text variant="displayLg" className="mt-1.5 text-ink">
        {t('referral.redeem.title')}
      </Text>
      <Text variant="body" className="mt-3.5 text-purple-muted">
        {t('referral.redeem.subtitle')}
      </Text>

      {/* Tapping the boxes must bring the keyboard back, not just restyle the cursor. */}
      <Pressable
        className="mt-9 flex-row gap-2"
        onPress={() => inputRef.current?.focus()}
        accessibilityRole="none"
        accessibilityLabel={t('referral.redeem.inputLabel')}
      >
        {Array.from({ length: LENGTH }).map((_, i) => {
          const char = code[i];
          const isCursor = focused && i === code.length;
          return (
            <View
              key={i}
              className={cn(
                'h-16 flex-1 items-center justify-center rounded-chip border-[1.6px] border-border bg-white',
                (char || isCursor) && 'border-2 border-purple bg-surface-violet-tint',
              )}
            >
              {char ? (
                <Text
                  weight="semibold"
                  className="android:font-mono-android font-mono text-[24px] font-semibold text-ink"
                >
                  {char}
                </Text>
              ) : isCursor ? (
                <View className="h-7 w-0.5 rounded-[1px] bg-purple-deep" />
              ) : null}
            </View>
          );
        })}
      </Pressable>

      {/* Off-screen: the real input driving the boxes above. */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(v) =>
          setCode(
            v
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, '')
              .slice(0, LENGTH),
          )
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={LENGTH}
        className="absolute h-px w-px opacity-0"
        textContentType="oneTimeCode"
      />
    </Screen>
  );
}

import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { CheckCircle } from '@/shared/ui/check-circle';
import { CloseRow } from '@/shared/ui/close-row';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { t, tList } from '@/shared/i18n/i18n';
import { BloomBackdrop } from '@/features/onboarding/components/bloom-backdrop';
import { ART } from '@/shared/lib/assets';
type Plan = 'monthly' | 'yearly';

/**
 * Screen `10 Glimpse Plus · skippable`.
 *
 * Nothing here charges anything — there is no billing SDK wired yet.
 * Entitlement will come from RevenueCat, which owns the subscription state
 * machine, so the database deliberately has no `subscriptions` table.
 *
 * It sits after the first capture and friend invites, so skipping or paying
 * never stands between a new user and the growth loop. See README, open
 * product question 3.
 */
export default function PaywallScreen() {
  const [plan, setPlan] = useState<Plan>('yearly');
  const [trial, setTrial] = useState(true);
  const benefits = tList<string>('paywall.benefits');

  return (
    <Screen
      footer={
        <View className="items-center gap-3.5">
          <Button
            label={t('paywall.cta')}
            size="md"
            onPress={() => router.push('/(onboarding)/heard-about')}
          />
          <Text variant="bodyXs" className="text-purple-muted">
            {t('paywall.restore')}
          </Text>
        </View>
      }
      scroll
      backdrop={<BloomBackdrop />}
    >
      <CloseRow onPress={() => router.push('/(onboarding)/heard-about')} />

      <Image source={ART.mascot} className="-mt-1.5 h-[150px] w-[150px] self-center" contentFit="contain" />

      <Text variant="eyebrowAccent" className="mt-3.5 text-purple-deep">
        {t('paywall.eyebrow')}
      </Text>
      <Text variant="displayLg" className="mt-1.5 text-ink">
        {t('paywall.title')}
      </Text>

      <View className="mt-[22px] gap-4">
        {benefits.map((benefit) => (
          <View key={benefit} className="flex-row items-center gap-3.5">
            <CheckCircle checked size={28} />
            <Text variant="body" className="flex-1 text-ink-body">
              {benefit}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-[34px] flex-row gap-3">
        <PlanCard
          selected={plan === 'monthly'}
          onPress={() => setPlan('monthly')}
          label={t('paywall.monthly.label')}
          price={t('paywall.monthly.price')}
          note={t('paywall.monthly.note')}
        />
        <PlanCard
          selected={plan === 'yearly'}
          onPress={() => setPlan('yearly')}
          label={t('paywall.yearly.label')}
          price={t('paywall.yearly.price')}
          note={t('paywall.yearly.note')}
          badge={t('paywall.yearly.badge')}
        />
      </View>

      <View className="mt-3 flex-row items-center gap-3 rounded-card-sm px-[18px] py-4">
        <View className="flex-1">
          <Text variant="rowTitle" className="text-ink-body">
            {t('paywall.trial.title')}
          </Text>
          <Text variant="meta" className="text-purple-muted">
            {t('paywall.trial.body')}
          </Text>
        </View>
        <Pressable
          onPress={() => setTrial((v) => !v)}
          accessibilityRole="switch"
          accessibilityState={{ checked: trial }}
          className={cn(
            'h-[34px] w-14 justify-center rounded-pill',
            trial ? 'bg-purple-deep' : 'bg-swatch-grey',
          )}
        >
          <View
            className={cn(
              'h-7 w-7 rounded-[14px] bg-white',
              trial ? 'mr-[3px] self-end' : 'ml-[3px] self-start',
            )}
          />
        </Pressable>
      </View>
    </Screen>
  );
}

interface PlanCardProps {
  selected: boolean;
  onPress: () => void;
  label: string;
  price: string;
  note: string;
  badge?: string;
}

function PlanCard({ selected, onPress, label, price, note, badge }: PlanCardProps) {
  return (
    <Pressable
      // Constant border width so selecting a plan does not resize the card.
      className={cn(
        'flex-1 gap-1 rounded-card-sm border-2 px-4 pb-4 pt-[18px]',
        selected ? 'border-purple bg-surface-violet-tint' : 'border-border bg-white',
      )}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${price} ${note}`}
    >
      {badge ? (
        <View className="absolute -top-[13px] right-3.5 rounded-pill bg-purple-deep px-2.5 py-[5px]">
          <Text variant="caption" weight="semibold" className="text-white">
            {badge}
          </Text>
        </View>
      ) : null}

      <Text variant="eyebrowAccent" className={selected ? 'text-purple-deep' : 'text-[#8B7BA8]'}>
        {label}
      </Text>
      <Text variant="title" className="mt-1 text-ink">
        {price}
      </Text>
      <Text variant="meta" className="text-purple-muted">
        {note}
      </Text>
      <CheckCircle checked={selected} size={28} className="mt-3.5" />
    </Pressable>
  );
}

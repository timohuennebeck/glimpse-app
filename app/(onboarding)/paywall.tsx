import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Button } from '@/shared/ui/button';
import { CheckCircle } from '@/shared/ui/check-circle';
import { CloseRow } from '@/shared/ui/close-row';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
import { t, tList } from '@/shared/i18n/i18n';
import { BloomBackdrop } from '@/features/onboarding/components/bloom-backdrop';
import { ART } from '@/shared/lib/fixtures';
type Plan = 'monthly' | 'yearly';

/**
 * Screen `10 Glimpse Plus · skippable`.
 *
 * Nothing here charges anything — there is no billing SDK wired yet.
 * Entitlement will come from RevenueCat, which owns the subscription state
 * machine, so the database deliberately has no `subscriptions` table.
 *
 * Worth flagging: the positioning note's open question 03 argues this screen
 * sits too early, because the growth loop needs a first *trade* before anyone is
 * asked for money. It is built where the mock puts it; moving it is a one-line
 * routing change in `reviews.tsx`.
 */
export default function PaywallScreen() {
  const [plan, setPlan] = useState<Plan>('yearly');
  const [trial, setTrial] = useState(true);
  const benefits = tList<string>('paywall.benefits');

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            label={t('paywall.cta')}
            size="md"
            onPress={() => router.push('/(onboarding)/share-code')}
          />
          <View style={styles.footerLinks}>
            <Text variant="bodyXs" color={colors.purpleMuted}>
              {t('paywall.restore')}
            </Text>
            <View style={styles.footerDot} />
            <Text
              variant="bodyXs"
              color={colors.purpleDeep}
              style={styles.footerLink}
              accessibilityRole="link"
              onPress={() => router.push('/(onboarding)/redeem')}
            >
              {t('referral.redeem.cta')}
            </Text>
          </View>
        </View>
      }
      scroll backdrop={<BloomBackdrop />}>
      <CloseRow onPress={() => router.push('/(onboarding)/heard-about')} />

      <Image source={ART.mascot} style={styles.mascot} contentFit="contain" />

      <Text variant="eyebrowAccent" color={colors.purpleDeep} style={styles.eyebrow}>
        {t('paywall.eyebrow')}
      </Text>
      <Text variant="displayLg" color={colors.ink} style={styles.title}>
        {t('paywall.title')}
      </Text>

      <View style={styles.benefits}>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <CheckCircle checked size={28} />
            <Text variant="body" color={colors.inkBody} style={styles.flex}>
              {benefit}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.plans}>
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

      <View style={styles.trialRow}>
        <View style={styles.flex}>
          <Text variant="rowTitle" color={colors.inkBody}>
            {t('paywall.trial.title')}
          </Text>
          <Text variant="meta" color={colors.purpleMuted}>
            {t('paywall.trial.body')}
          </Text>
        </View>
        <Pressable
          onPress={() => setTrial((v) => !v)}
          accessibilityRole="switch"
          accessibilityState={{ checked: trial }}
          style={[styles.switch, !trial && styles.switchOff]}
        >
          <View style={[styles.knob, trial ? styles.knobOn : styles.knobOff]} />
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
      style={[styles.plan, selected && styles.planSelected]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${price} ${note}`}
    >
      {badge ? (
        <View style={styles.planBadge}>
          <Text variant="caption" color={colors.white} style={styles.planBadgeText}>
            {badge}
          </Text>
        </View>
      ) : null}

      <Text variant="eyebrowAccent" color={selected ? colors.purpleDeep : '#8B7BA8'}>
        {label}
      </Text>
      <Text variant="title" color={colors.ink} style={styles.planPrice}>
        {price}
      </Text>
      <Text variant="meta" color={colors.purpleMuted}>
        {note}
      </Text>
      <CheckCircle checked={selected} size={28} style={styles.radio} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mascot: { width: 150, height: 150, alignSelf: 'center', marginTop: -6 },
  eyebrow: { marginTop: 14 },
  title: { marginTop: 6 },
  benefits: { marginTop: 22, gap: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  plans: { marginTop: 34, flexDirection: 'row', gap: 12 },
  plan: {
    flex: 1,
    // Constant width so selecting a plan does not resize the card.
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.cardSm,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 4,
  },
  planSelected: { borderColor: colors.purple, backgroundColor: colors.surfaceVioletTint },
  planBadge: {
    position: 'absolute',
    top: -13,
    right: 14,
    backgroundColor: colors.purpleDeep,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  planBadgeText: { fontWeight: '600' },
  planPrice: { marginTop: 4 },
  radio: { marginTop: 14 },
  trialRow: {
    marginTop: 12,
    borderRadius: radius.cardSm,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switch: {
    width: 56,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.purpleDeep,
    justifyContent: 'center',
  },
  switchOff: { backgroundColor: colors.swatchGrey },
  knob: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white },
  knobOn: { alignSelf: 'flex-end', marginRight: 3 },
  knobOff: { alignSelf: 'flex-start', marginLeft: 3 },
  footer: { gap: 14, alignItems: 'center' },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.swatchGrey },
  footerLink: { fontWeight: '600' },
});

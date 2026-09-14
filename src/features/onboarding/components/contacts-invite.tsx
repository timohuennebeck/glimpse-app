import { View } from 'react-native';
import { Button } from '@/shared/ui/button';
import { Avatar } from '@/shared/ui/avatar';
import { Text } from '@/shared/ui/text';
import { t } from '@/shared/i18n/i18n';
import { AVATARS } from '@/shared/lib/fixtures';
interface ContactsInviteProps {
  onPress?: () => void;
}

// Illustrative: three faces shown, "+2" more implied. Fixture data, not a count
// of the user's contacts (contacts import is not built).
const FACES = [AVATARS.mia, AVATARS.ben, AVATARS.noah];
const HIDDEN_FACES = 2;

/**
 * The stacked-avatars card from screen `05a` — shown when contacts permission
 * has not been granted, so there is no list to render yet.
 */
export function ContactsInvite({ onPress }: ContactsInviteProps) {
  return (
    <View className="mt-[22px] items-center gap-4 rounded-lg bg-surface-violet-deep px-5 pb-[22px] pt-[26px]">
      <View className="flex-row items-center">
        {FACES.map((face, i) => (
          <View key={i} className={i > 0 ? '-ml-4' : undefined}>
            <Avatar source={face} size={64} className="rounded-[32px] border-[3px] border-white" />
          </View>
        ))}
        <View className="-ml-4 h-16 w-16 items-center justify-center rounded-[32px] border-[3px] border-white bg-purple">
          <Text variant="rowTitle" className="text-white">
            {t('onboarding.friends.moreCount', { count: HIDDEN_FACES })}
          </Text>
        </View>
      </View>

      <Text variant="cardTitleLg" className="text-center text-ink">
        {t('onboarding.friends.inviteTitle')}
      </Text>
      {/* 14.5 * 1.4 */}
      <Text variant="subtitle" className="text-center leading-[20.3px] text-purple-muted">
        {t('onboarding.friends.inviteBody')}
      </Text>

      <Button
        label={t('onboarding.friends.inviteCta')}
        variant="purple"
        size="sm"
        onPress={onPress}
        className="w-full"
      />
    </View>
  );
}

import { t } from '@/shared/i18n/i18n';
import { Pill } from '@/features/friends/components/pill';
import { useAcceptFriendRequest, useSendFriendRequest } from '@/features/friends/data/friends-mutations';
import type { PersonSummary, Relationship } from '@/features/friends/interfaces';
interface RelationshipPillProps {
  person: PersonSummary;
  relationship: Relationship;
  compact?: boolean;
}

/**
 * The trailing control on a person row: what I can do about them right now.
 * Add and Accept are mutations; Requested and Friends are states. Both
 * mutations patch `friends.all`, so the pill it sits in re-renders on the tap.
 */
export function RelationshipPill({ person, relationship, compact = false }: RelationshipPillProps) {
  const send = useSendFriendRequest();
  const accept = useAcceptFriendRequest();

  switch (relationship.kind) {
    case 'friends':
      return <Pill label={t('friends.search.alreadyFriends')} tone="outline" compact={compact} />;
    case 'sent':
      return <Pill label={t('friends.search.sent')} tone="quiet" compact={compact} />;
    case 'received':
      return (
        <Pill
          label={t('friends.accept')}
          tone="filled"
          compact={compact}
          onPress={() => accept.mutate(relationship.friendshipId)}
        />
      );
    default:
      return (
        <Pill
          label={t('friends.search.add')}
          tone="filled"
          compact={compact}
          onPress={() => send.mutate(person)}
        />
      );
  }
}

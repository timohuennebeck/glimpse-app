# Glimpse — database design

Target: **Supabase** (Postgres 15 + GoTrue auth + Storage + RLS).

Everything here follows from one mechanic in the positioning note:

> Their photo lands on your homescreen frosted, with their name on it. Tap it and
> the camera opens. The second you send one back, both photos unlock — on your
> widget and theirs, side by side. No sending without receiving, no looking
> without sending.

So the central table is not "posts". It is **`trades`** — a pair of photos with a
lock on it.

---

## 1. Entity overview

| Table | Purpose |
|---|---|
| `profiles` | Public identity mirrored from `auth.users` |
| `friendships` | One row per directed request; accepted = friends |
| `user_blocks` | Hard mute, checked before every read |
| `moments` | A single captured photo (original + pre-blurred rendition) |
| `trades` | **The core.** One initiating moment + one response, with lock state |
| `messages` | 1:1 chat, optionally carrying a moment |
| `device_tokens` | Push targets, needed to refresh the widget |
| `referral_codes` / `referral_redemptions` | Share-your-code + partner codes |
| `invites` | Deeplink for "X sent you a moment" before signup |
| `reports` | Safety queue |

---

## 2. Why `trades` and not `posts`

A naive Locket-style schema is `photos` + `photo_recipients`. That cannot express
the product, because "is this photo visible to me?" depends on **whether I have
sent one back**, which is a property of the *pair*, not the photo.

So: when A sends a moment to B, we insert one `trades` row per recipient.

```
trades(
  initiator_id        -> A
  responder_id        -> B
  initiator_moment_id -> A's photo      (NOT NULL)
  responder_moment_id -> B's photo      (NULL until B trades back)
  status              -> 'pending' | 'unlocked' | 'expired'
  auto_unlock_at      -> the soft escape
  unlocked_at
)
```

Consequences that fall out for free:

- **The widget query** is "my oldest unanswered trade where I am the responder" — the person who has waited longest is the one looking back at you.
- **A completed trade is a pair**, which is exactly what profile screen `07b`
  renders: two photos side by side with one date underneath.
- **The soft escape** from the positioning note ("everything unlocks by itself
  after some hours") is a single `auto_unlock_at` timestamp, not a background job
  rewriting rows — reads simply treat `now() >= auto_unlock_at` as unlocked.
- **A moment sent to 3 friends** is 3 independent locks. Mia trading back does not
  unlock the copy Ben is sitting on. That matches "no looking without sending" per
  relationship.

### Open question this schema deliberately leaves open

Positioning question 02 asks whether an unsent trade *expires* or *unlocks on its
own*. `auto_unlock_at` + a `status` of `expired` supports both without a
migration: set `auto_unlock_at` to unlock, or leave it `NULL` and let a job mark
it `expired` to have the moment disappear instead. Current default: **unlock after
24h**, configured in `app_config`.

---

## 3. Privacy: how a locked photo actually stays locked

Blurring on the client is theatre — anyone can read the response body. So:

1. Every upload writes **two objects** to the private `moments` bucket:
   - `original/{user}/{ts}.jpg` — written by the client, which may only write
     under `original/{its own id}/`
   - `blurred/{user}/{ts}.jpg` — written only by the Edge Function (service
     role); heavy Gaussian and downscaled
2. The bucket has **no public access**, and the **RLS policy on `storage.objects`**
   is the lock: `storage_object_readable(name)` allows `SELECT` on the original
   only for the author or a party to an *open* trade, and on the blurred copy
   only for a party to *any* trade. Three things stop a client from forging the
   row that would grant itself access: a `moments` row may only name paths under
   its own author's prefix (check constraint), paths are unique, and clients have
   **no SELECT on the path columns at all** — they cannot even learn the string.
3. Signed URLs are created by the client through the Storage API
   (`createSignedUrls`). That API checks the policy above with the caller's JWT,
   so a client can only sign a path it is allowed to read. Postgres never signs
   anything — it can't; that is not a thing a SQL function can do.
4. `visible_moment_paths(uuid[])` tells the client which path to ask for, for
   many moments in one round trip. It returns `NULL` for a locked moment whose
   blurred rendition does not exist yet: the moment is **withheld**, not leaked.

A modified client gains nothing: the decision is made by the same predicates in
both the RPC and the storage policy, and only the storage policy is consulted
when a URL is signed.

## 4. Friendship model

One row per *directed* request, with a uniqueness guard so A→B and B→A cannot both
exist:

```sql
unique (least(requester_id, addressee_id), greatest(requester_id, addressee_id))
```

`status` is `pending | accepted | declined`. Screen `08 Freunde` reads this three
ways: accepted list, incoming `pending` (where I am the addressee → "Anfragen"),
outgoing `pending` (where I am the requester → "Gesendet").

The positioning note says to **cut large friend lists**. There is a
`max_friends` value in `app_config` (default 20) enforced by a trigger, so the
product decision lives in data rather than in scattered client checks.

---

## 5. RLS summary

Every table is `enable row level security` with no permissive default.

- `profiles` — readable by anyone signed in (needed for search by `@username`);
  writable only by the owner.
- `friendships` — visible to either party; insertable only as the requester;
  the addressee alone may move `pending → accepted/declined`, and `status` is the
  only column they may write. A trigger also refuses to change the two parties.
- `moments` — the author always; a recipient only via a `trades` row that names
  the moment.
- `trades` — visible to initiator and responder only, never across a block.
  Clients have **no INSERT and may UPDATE exactly one column, `seen_at`**
  (column-level grant). Creating and answering go through `send_moment()` and
  `respond_to_trade()`, which are SECURITY DEFINER and reject anonymous callers.
- `messages` — both parties of an accepted friendship, never blocked; a
  recipient may write only `read_at`; an attached photo must be one the two of
  you actually traded.
- `invites` — owner-managed; there is no SELECT for anyone else. Claiming is
  `claim_invite(token)`, an atomic update by token, because a row filter cannot
  express "the one row whose token you know".
- `referral_codes` — minted on signup; redeemed only through
  `redeem_referral_code()`, which enforces expiry, the redemption cap and
  not-your-own under a row lock.
- everything else — owner-scoped. Every RPC is revoked from `anon`.

Blocks are checked in `profiles`, `friendships`, `trades`, `messages` and inside
`send_moment()`, so a block takes effect immediately in both directions.

---

## 6. Not modelled yet (deliberately)

- **Payments.** There is deliberately no `subscriptions` table: RevenueCat is
  the source of truth for entitlement. The client asks its SDK whether Plus is
  active; the database never mirrors it. If the server ever needs to gate
  something on Plus, add RevenueCat's webhook writing a single `is_plus` flag
  rather than reimplementing their state machine.
- **Google/Apple auth.** Supabase GoTrue handles the identity rows itself; the
  app currently only uses email OTP. Turning the provider on is console config
  plus a button that already exists in the UI.
- **Widget delivery.** The widget reads a snapshot the app writes to the shared
  container. The server's only job is the silent push that tells the app to
  refresh; see `widgets/README.md`.

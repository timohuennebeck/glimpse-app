import { Redirect } from 'expo-router';
/**
 * Entry point. Once auth is wired this branches on session +
 * `profiles.onboarding_done_at`; for now it always starts at the welcome screen
 * so the full designed flow is reachable.
 */
export default function Index() {
  return <Redirect href="/(onboarding)/welcome" />;
}

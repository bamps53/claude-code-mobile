import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the first tab as the default route
  return <Redirect href="/(tabs)/session" />;
}

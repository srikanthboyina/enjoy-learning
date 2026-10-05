// Any unknown address (e.g. the web build hosted under a sub-path) goes to the world map.
import { Redirect } from 'expo-router';

export default function NotFound() {
  return <Redirect href="/" />;
}

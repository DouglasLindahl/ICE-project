import { LoadingScreen } from "@/components/LoadingScreen/page";

export default function Loading() {
  return (
    <LoadingScreen
      message="Opening Subscriptions…"
      subtext="Please wait a moment"
    />
  );
}

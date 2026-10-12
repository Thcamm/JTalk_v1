"use client";

import { ProfilePage } from "./ProfilePage";

/**
 * ProgressPage is now merged into ProfilePage.
 * By default, this renders the unified ProfilePage focused on the "progress" (Tiến trình & Thống kê) tab.
 */
export default function ProgressPage() {
  return <ProfilePage defaultTab="progress" />;
}

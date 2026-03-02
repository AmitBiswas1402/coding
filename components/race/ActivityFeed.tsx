"use client";

import type { ActivityItem } from "@/stores/race-store";

interface ActivityFeedProps {
  items: ActivityItem[];
}

function formatActivity(item: ActivityItem): string {
  switch (item.type) {
    case "run":
      return `${item.userName} ran the code`;
    case "submit":
      return `${item.userName} submitted solution`;
    case "solved":
      return `${item.userName} solved the problem!`;
    default:
      return "";
  }
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="p-2">
      <h3 className="text-sm font-medium mb-2">Activity</h3>
      <ul className="space-y-1 text-xs text-muted-foreground max-h-40 overflow-auto">
        {items.length === 0 && <li>No activity yet.</li>}
        {items.map((item, i) => (
          <li key={`${item.userId}-${item.at}-${i}`}>{formatActivity(item)}</li>
        ))}
      </ul>
    </div>
  );
}

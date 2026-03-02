"use client";

import { useState, useEffect } from "react";
import { Search, Link as LinkIcon } from "lucide-react";
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WeeklyPremiumProps {
  weeks: { week: number; active: boolean }[];
  timeRemaining: string;
}

function WeeklyPremium({ weeks, timeRemaining }: WeeklyPremiumProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold">Weekly Premium</h3>
        <p className="text-xs text-muted-foreground mt-1">{timeRemaining}</p>
      </div>
      <div className="flex gap-2">
        {weeks.map((w) => (
          <div
            key={w.week}
            className={cn(
              "flex-1 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors",
              w.active
                ? "bg-orange-500 text-white"
                : "bg-muted text-muted-foreground"
            )}
          >
            W{w.week}
          </div>
        ))}
      </div>
    </div>
  );
}

function RedeemWidget() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Redeem</h3>
        <a
          href="#"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Rules
        </a>
      </div>
      <div className="text-2xl font-bold">0</div>
      <p className="text-xs text-muted-foreground mt-1">Redeem</p>
    </div>
  );
}

interface TrendingCompaniesProps {
  companies: { name: string; count: number }[];
}

function TrendingCompanies({ companies }: TrendingCompaniesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState(companies);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCompanies(companies);
    } else {
      setFilteredCompanies(
        companies.filter((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, companies]);

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Trending Companies</h3>
      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for a company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-xs bg-muted/50 border-muted"
        />
      </div>
      <div className="space-y-1.5">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => (
            <a
              key={company.name}
              href={`/dashboard/questions?company=${encodeURIComponent(company.name)}`}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors group"
            >
              <span className="text-sm">{company.name}</span>
              <span className="text-xs text-muted-foreground group-hover:text-foreground">
                {company.count}
              </span>
            </a>
          ))
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            No companies found
          </p>
        )}
      </div>
    </div>
  );
}

interface ProblemsRightSidebarProps {
  submissionsByDay?: { date: string; count: number }[];
  companies?: { name: string; count: number }[];
}

export function ProblemsRightSidebar({
  submissionsByDay = [],
  companies = [],
}: ProblemsRightSidebarProps) {
  const [weeklyPremium, setWeeklyPremium] = useState({
    weeks: [
      { week: 1, active: false },
      { week: 2, active: false },
      { week: 3, active: false },
      { week: 4, active: true },
    ],
    timeRemaining: "Less than a day",
  });

  return (
    <aside className="hidden xl:block w-72 border-l bg-background/50">
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4 space-y-4">
        <CalendarWidget submissionsByDay={submissionsByDay} />
        <WeeklyPremium
          weeks={weeklyPremium.weeks}
          timeRemaining={weeklyPremium.timeRemaining}
        />
        <RedeemWidget />
        <TrendingCompanies companies={companies} />
      </div>
    </aside>
  );
}

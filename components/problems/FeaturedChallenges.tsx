"use client";

import Link from "next/link";
import { Trophy, Code2, Briefcase, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChallengeCard {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  buttonText: string;
  visual?: React.ReactNode;
}

const challenges: ChallengeCard[] = [
  {
    title: "Quest",
    subtitle: "Turn coding practice into an epic adventure",
    description: "Complete challenges and unlock achievements",
    href: "/dashboard/questions?filter=quest",
    gradient: "from-purple-500 via-pink-500 to-purple-600",
    icon: Trophy,
    badge: "NEW",
    buttonText: "Begin Now",
    visual: (
      <div className="absolute right-4 top-4 opacity-20">
        <Trophy className="h-24 w-24 text-white" />
      </div>
    ),
  },
  {
    title: "JavaScript 30 Days Challenge",
    subtitle: "30 Days Challenge",
    description: "Beginner Friendly",
    href: "/dashboard/practice?challenge=javascript-30",
    gradient: "from-orange-500 via-amber-500 to-orange-600",
    icon: Code2,
    buttonText: "Start Learning",
    visual: (
      <div className="absolute right-4 top-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
          <div className="text-white font-bold text-lg">DAY</div>
          <div className="text-white font-bold text-2xl">30</div>
          <div className="text-white/80 text-xs">✓</div>
        </div>
      </div>
    ),
  },
  {
    title: "Top Interview Questions",
    subtitle: "Master the most common interview problems",
    description: "Curated by industry experts",
    href: "/dashboard/questions?filter=interview",
    gradient: "from-blue-500 via-cyan-500 to-blue-600",
    icon: Briefcase,
    buttonText: "Get Started",
    visual: (
      <div className="absolute right-4 top-4 opacity-20">
        <Briefcase className="h-20 w-20 text-white" />
      </div>
    ),
  },
];

export function FeaturedChallenges() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
      {challenges.map((challenge) => {
        const Icon = challenge.icon;
        return (
          <Link
            key={challenge.href}
            href={challenge.href}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          >
            {/* Gradient Background */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity duration-300 group-hover:opacity-100",
                challenge.gradient
              )}
            />

            {/* Content */}
            <div className="relative z-10 p-6 min-h-[200px] flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {challenge.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-white/30 backdrop-blur-sm text-white">
                      {challenge.badge}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                {challenge.title}
              </h3>
              <p className="text-sm font-medium text-white/90 mb-2">
                {challenge.subtitle}
              </p>
              <p className="text-xs text-white/80 mb-4 flex-1">
                {challenge.description}
              </p>

              <Button
                variant="secondary"
                size="sm"
                className="w-fit bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {challenge.buttonText}
              </Button>

              {/* Visual Element */}
              {challenge.visual}
            </div>

            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Link>
        );
      })}
    </div>
  );
}

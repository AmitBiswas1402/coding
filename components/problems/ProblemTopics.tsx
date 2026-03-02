"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Topic {
  name: string;
  count: number;
}

interface ProblemTopicsProps {
  topics: Topic[];
  selectedTopic?: string;
  onTopicSelect?: (topic: string | null) => void;
}

const INITIAL_TOPICS_COUNT = 7;

export function ProblemTopics({
  topics,
  selectedTopic,
  onTopicSelect,
}: ProblemTopicsProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Sort topics by count (descending) to show most popular first
  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => b.count - a.count);
  }, [topics]);
  
  const displayedTopics = expanded
    ? sortedTopics
    : sortedTopics.slice(0, INITIAL_TOPICS_COUNT);

  const handleTopicClick = (topicName: string) => {
    if (onTopicSelect) {
      onTopicSelect(selectedTopic === topicName ? null : topicName);
    }
  };

  return (
    <div className="mb-6">
      {topics.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          Loading topics...
        </div>
      ) : (
      <div className="flex flex-wrap items-center gap-2">
        {displayedTopics.map((topic) => (
          <button
            key={topic.name}
            onClick={() => handleTopicClick(topic.name)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              "hover:bg-muted/80 border border-transparent",
              selectedTopic === topic.name
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-foreground hover:border-border"
            )}
          >
            {topic.name} <span className="text-muted-foreground">{topic.count}</span>
          </button>
        ))}
        {sortedTopics.length > INITIAL_TOPICS_COUNT && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-muted/50 text-foreground hover:bg-muted/80 border border-border transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand
              </>
            )}
          </button>
        )}
      </div>
      )}
    </div>
  );
}

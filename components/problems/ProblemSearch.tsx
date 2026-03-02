"use client";

import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProblemSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSort?: () => void;
  onFilter?: () => void;
  placeholder?: string;
}

export function ProblemSearch({
  value,
  onChange,
  onSort,
  onFilter,
  placeholder = "Search questions",
}: ProblemSearchProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 h-9 bg-muted/50 border-muted focus-visible:bg-background"
        />
      </div>
      {onFilter && (
        <Button
          variant="outline"
          size="sm"
          onClick={onFilter}
          className="h-9"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      )}
      {onSort && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSort}
          className="h-9"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

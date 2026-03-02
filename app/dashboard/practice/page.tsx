import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PracticePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Solve problems at your own pace, without timers or competition.
        </p>
      </div>
      <Link href="/dashboard/questions">
        <Card className="hover:border-primary/60 hover:bg-card cursor-pointer border-border/60 bg-card/80 transition">
          <CardHeader>
            <CardTitle>Browse Questions</CardTitle>
          </CardHeader>
          <CardContent>
            Pick a problem and start coding.
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

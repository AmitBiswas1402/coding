import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roomStatusEnum = pgEnum("room_status", [
  "waiting",
  "running",
  "finished",
]);
export const problemSourceEnum = pgEnum("problem_source", [
  "leetcode",
  "hackerrank",
  "gfg",
  "ai_generated",
]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "running",
  "accepted",
  "wrong_answer",
  "time_limit_exceeded",
  "runtime_error",
  "compilation_error",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email"),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const problems = pgTable("problems", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  statement: text("statement").notNull(),
  constraints: text("constraints"),
  inputFormat: text("input_format"),
  outputFormat: text("output_format"),
  source: problemSourceEnum("source").notNull().default("leetcode"),
  difficulty: integer("difficulty").notNull(),
  topic: text("topic"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  problemId: uuid("problem_id").references(() => problems.id, { onDelete: "set null" }),
  status: roomStatusEnum("status").notNull().default("waiting"),
  startedAt: timestamp("started_at"),
  endsAt: timestamp("ends_at"),
  difficulty: integer("difficulty").notNull(), // 1, 2, 3
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roomParticipants = pgTable(
  "room_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("room_user_idx").on(t.roomId, t.userId)]
);

export const testCases = pgTable("test_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  input: text("input").notNull(),
  expectedOutput: text("expected_output").notNull(),
  isSample: boolean("is_sample").notNull().default(false),
});

export const contests = pgTable("contests", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contestProblems = pgTable(
  "contest_problems",
  {
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
  },
  (t) => [primaryKey({ columns: [t.contestId, t.problemId] })]
);

export const contestParticipants = pgTable(
  "contest_participants",
  {
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("contest_user_idx").on(t.contestId, t.userId)]
);

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  contestId: uuid("contest_id").references(() => contests.id, { onDelete: "set null" }),
  language: text("language").notNull(),
  code: text("code").notNull(),
  status: submissionStatusEnum("status").notNull(),
  runResult: jsonb("run_result"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const contestScores = pgTable(
  "contest_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contestId: uuid("contest_id")
      .notNull()
      .references(() => contests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id").references(() => submissions.id),
    score: integer("score").notNull(),
    solvedAt: timestamp("solved_at").notNull(),
  },
  (t) => [uniqueIndex("contest_score_unique_idx").on(t.contestId, t.userId, t.problemId)]
);

export const aiEvaluations = pgTable("ai_evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" })
    .unique(),
  correctnessScore: integer("correctness_score").notNull(),
  timeComplexity: text("time_complexity").notNull(),
  spaceComplexity: text("space_complexity").notNull(),
  optimizationScore: integer("optimization_score").notNull(),
  readabilityScore: integer("readability_score").notNull(),
  edgeCaseScore: integer("edge_case_score").notNull(),
  issues: jsonb("issues").$type<string[]>().notNull().default([]),
  improvements: jsonb("improvements").$type<string[]>().notNull().default([]),
  overallFeedback: text("overall_feedback").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiGeneratedQuestions = pgTable("ai_generated_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  level: text("level").notNull(),
  companyType: text("company_type").notNull(),
  topic: text("topic").notNull(),
  promptUsed: text("prompt_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations with explicit fields/references for db.query.* support
export const roomsRelations = relations(rooms, ({ one, many }) => ({
  creator: one(users, { fields: [rooms.createdBy], references: [users.id] }),
  problem: one(problems, { fields: [rooms.problemId], references: [problems.id] }),
  participants: many(roomParticipants),
}));

export const problemsRelations = relations(problems, ({ many }) => ({
  testCases: many(testCases),
  submissions: many(submissions),
}));

export const roomParticipantsRelations = relations(
  roomParticipants,
  ({ one }) => ({
    room: one(rooms, { fields: [roomParticipants.roomId], references: [rooms.id] }),
    user: one(users, { fields: [roomParticipants.userId], references: [users.id] }),
  })
);

export const testCasesRelations = relations(testCases, ({ one }) => ({
  problem: one(problems, { fields: [testCases.problemId], references: [problems.id] }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
  problem: one(problems, { fields: [submissions.problemId], references: [problems.id] }),
  room: one(rooms, { fields: [submissions.roomId], references: [rooms.id] }),
  contest: one(contests, { fields: [submissions.contestId], references: [contests.id] }),
  aiEvaluation: one(aiEvaluations, { fields: [submissions.id], references: [aiEvaluations.submissionId] }),
}));

export const contestsRelations = relations(contests, ({ many }) => ({
  contestProblems: many(contestProblems),
  contestParticipants: many(contestParticipants),
  contestScores: many(contestScores),
}));

export const contestProblemsRelations = relations(contestProblems, ({ one }) => ({
  contest: one(contests, { fields: [contestProblems.contestId], references: [contests.id] }),
  problem: one(problems, { fields: [contestProblems.problemId], references: [problems.id] }),
}));

export const contestParticipantsRelations = relations(
  contestParticipants,
  ({ one }) => ({
    contest: one(contests, { fields: [contestParticipants.contestId], references: [contests.id] }),
    user: one(users, { fields: [contestParticipants.userId], references: [users.id] }),
  })
);

export const contestScoresRelations = relations(contestScores, ({ one }) => ({
  contest: one(contests, { fields: [contestScores.contestId], references: [contests.id] }),
  user: one(users, { fields: [contestScores.userId], references: [users.id] }),
  problem: one(problems, { fields: [contestScores.problemId], references: [problems.id] }),
  submission: one(submissions, { fields: [contestScores.submissionId], references: [submissions.id] }),
}));

export const aiEvaluationsRelations = relations(aiEvaluations, ({ one }) => ({
  submission: one(submissions, { fields: [aiEvaluations.submissionId], references: [submissions.id] }),
}));

export const aiGeneratedQuestionsRelations = relations(
  aiGeneratedQuestions,
  ({ one }) => ({
    problem: one(problems, { fields: [aiGeneratedQuestions.problemId], references: [problems.id] }),
  })
);

// ── Interview Mode ──

export const interviewStatusEnum = pgEnum("interview_status", [
  "active",
  "completed",
  "expired",
]);

export const interviewSessions = pgTable("interview_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  level: text("level").notNull(),
  companyCategory: text("company_category").notNull(),
  topic: text("topic"),
  question: jsonb("question").notNull(),
  expectedTimeMinutes: integer("expected_time_minutes").notNull(),
  status: interviewStatusEnum("status").notNull().default("active"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const interviewResults = pgTable("interview_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => interviewSessions.id, { onDelete: "cascade" })
    .unique(),
  code: text("code").notNull(),
  language: text("language").notNull(),
  solveTimeMinutes: integer("solve_time_minutes").notNull(),
  runAttempts: integer("run_attempts").notNull().default(0),
  scoresJson: jsonb("scores_json").notNull(),
  hireRecommendation: text("hire_recommendation").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const interviewSessionsRelations = relations(interviewSessions, ({ one }) => ({
  user: one(users, { fields: [interviewSessions.userId], references: [users.id] }),
  result: one(interviewResults, { fields: [interviewSessions.id], references: [interviewResults.sessionId] }),
}));

export const interviewResultsRelations = relations(interviewResults, ({ one }) => ({
  session: one(interviewSessions, { fields: [interviewResults.sessionId], references: [interviewSessions.id] }),
}));

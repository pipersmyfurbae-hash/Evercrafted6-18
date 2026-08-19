import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Platform identities are populated through the configured OAuth flow.
 * Workspace permissions live in memberships; this platform role only gates
 * narrowly-scoped internal administration capabilities.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const organizations = mysqlTable(
  "organizations",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    ownerUserId: int("ownerUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("organizations_slug_unique").on(table.slug)],
);

export const workspaces = mysqlTable(
  "workspaces",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    kind: mysqlEnum("kind", ["personal", "organization"]).notNull(),
    organizationId: int("organizationId").references(() => organizations.id),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    isArchived: boolean("isArchived").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("workspaces_slug_unique").on(table.slug),
    index("workspaces_organization_index").on(table.organizationId),
    index("workspaces_creator_index").on(table.createdByUserId),
  ],
);

export const membershipRoleValues = ["owner", "admin", "member", "viewer", "client"] as const;
export const membershipStatusValues = ["active", "invited", "suspended"] as const;

export const workspaceMemberships = mysqlTable(
  "workspaceMemberships",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
    userId: int("userId").notNull().references(() => users.id),
    role: mysqlEnum("role", membershipRoleValues).default("member").notNull(),
    status: mysqlEnum("status", membershipStatusValues).default("active").notNull(),
    invitedByUserId: int("invitedByUserId").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("workspace_memberships_unique").on(table.workspaceId, table.userId),
    index("workspace_memberships_user_index").on(table.userId),
  ],
);

export const workspaceInvitations = mysqlTable(
  "workspaceInvitations",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
    email: varchar("email", { length: 320 }).notNull(),
    role: mysqlEnum("role", membershipRoleValues).default("member").notNull(),
    token: varchar("token", { length: 128 }).notNull(),
    invitedByUserId: int("invitedByUserId").notNull().references(() => users.id),
    expiresAt: timestamp("expiresAt").notNull(),
    acceptedAt: timestamp("acceptedAt"),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("workspace_invitations_token_unique").on(table.token),
    index("workspace_invitations_workspace_index").on(table.workspaceId),
    index("workspace_invitations_email_index").on(table.email),
  ],
);

export const projectStatusValues = ["draft", "active", "in_review", "approved", "delivered", "archived"] as const;

export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", projectStatusValues).default("draft").notNull(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    archivedAt: timestamp("archivedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("projects_workspace_status_index").on(table.workspaceId, table.status),
    index("projects_creator_index").on(table.createdByUserId),
  ],
);

export const assets = mysqlTable(
  "assets",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
    projectId: int("projectId").references(() => projects.id),
    name: varchar("name", { length: 255 }).notNull(),
    mediaType: varchar("mediaType", { length: 128 }).notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    checksum: varchar("checksum", { length: 128 }),
    status: mysqlEnum("status", ["pending", "ready", "processing", "failed", "archived"]).default("pending").notNull(),
    metadata: json("metadata"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("assets_workspace_index").on(table.workspaceId),
    index("assets_project_index").on(table.projectId),
    uniqueIndex("assets_workspace_storage_key_unique").on(table.workspaceId, table.storageKey),
  ],
);

export const assetVersions = mysqlTable(
  "assetVersions",
  {
    id: int("id").autoincrement().primaryKey(),
    assetId: int("assetId").notNull().references(() => assets.id),
    versionNumber: int("versionNumber").notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    checksum: varchar("checksum", { length: 128 }),
    changeNote: text("changeNote"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("asset_versions_asset_version_unique").on(table.assetId, table.versionNumber)],
);

export const workflowEvents = mysqlTable(
  "workflowEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
    projectId: int("projectId").references(() => projects.id),
    assetId: int("assetId").references(() => assets.id),
    eventType: varchar("eventType", { length: 80 }).notNull(),
    fromStatus: varchar("fromStatus", { length: 32 }),
    toStatus: varchar("toStatus", { length: 32 }),
    note: text("note"),
    actorUserId: int("actorUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("workflow_events_workspace_index").on(table.workspaceId), index("workflow_events_project_index").on(table.projectId)],
);

export const reviewRequests = mysqlTable(
  "reviewRequests",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
    projectId: int("projectId").notNull().references(() => projects.id),
    assetId: int("assetId").references(() => assets.id),
    status: mysqlEnum("status", ["pending", "approved", "changes_requested"]).default("pending").notNull(),
    requestNote: text("requestNote"),
    responseNote: text("responseNote"),
    requestedByUserId: int("requestedByUserId").notNull().references(() => users.id),
    reviewerUserId: int("reviewerUserId").references(() => users.id),
    respondedByUserId: int("respondedByUserId").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    respondedAt: timestamp("respondedAt"),
  },
  table => [index("review_requests_workspace_project_index").on(table.workspaceId, table.projectId), index("review_requests_status_index").on(table.status)],
);

export const deliveries = mysqlTable(
  "deliveries",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
    projectId: int("projectId").notNull().references(() => projects.id),
    status: mysqlEnum("status", ["draft", "ready", "published", "failed"]).default("draft").notNull(),
    destinationType: varchar("destinationType", { length: 80 }).notNull(),
    destinationRef: varchar("destinationRef", { length: 512 }),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("deliveries_workspace_project_index").on(table.workspaceId, table.projectId), index("deliveries_status_index").on(table.status)],
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").references(() => workspaces.id),
    recipientUserId: int("recipientUserId").notNull().references(() => users.id),
    type: varchar("type", { length: 80 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body"),
    actionUrl: varchar("actionUrl", { length: 512 }),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("notifications_recipient_read_index").on(table.recipientUserId, table.readAt)],
);

export const notificationPreferences = mysqlTable(
  "notificationPreferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id),
    inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
    emailEnabled: boolean("emailEnabled").default(false).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("notification_preferences_user_unique").on(table.userId)],
);

export const leads = mysqlTable(
  "leads",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    name: varchar("name", { length: 160 }),
    interest: varchar("interest", { length: 120 }),
    source: varchar("source", { length: 120 }).default("website").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("leads_email_unique").on(table.email)],
);

export const backgroundJobs = mysqlTable(
  "backgroundJobs",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").references(() => workspaces.id),
    jobType: varchar("jobType", { length: 100 }).notNull(),
    status: mysqlEnum("status", ["queued", "running", "succeeded", "failed", "cancelled"]).default("queued").notNull(),
    idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull(),
    payload: json("payload"),
    result: json("result"),
    errorMessage: text("errorMessage"),
    attempts: int("attempts").default(0).notNull(),
    maxAttempts: int("maxAttempts").default(3).notNull(),
    progressPercent: int("progressPercent").default(0).notNull(),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("background_jobs_idempotency_unique").on(table.idempotencyKey),
    index("background_jobs_status_index").on(table.status, table.createdAt),
  ],
);

export const plans = mysqlTable(
  "plans",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("plans_slug_unique").on(table.slug)],
);

/**
 * Provider-neutral subscription lifecycle. No payment provider credentials or
 * payment events are stored here until a provider is separately approved.
 */
export const workspaceSubscriptions = mysqlTable(
  "workspaceSubscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
    planId: int("planId").notNull().references(() => plans.id),
    status: mysqlEnum("status", ["trialing", "active", "past_due", "paused", "canceled", "expired"]).default("trialing").notNull(),
    provider: varchar("provider", { length: 80 }),
    providerSubscriptionId: varchar("providerSubscriptionId", { length: 191 }),
    currentPeriodStart: timestamp("currentPeriodStart").defaultNow().notNull(),
    currentPeriodEnd: timestamp("currentPeriodEnd"),
    cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("workspace_subscriptions_workspace_status_index").on(table.workspaceId, table.status),
    index("workspace_subscriptions_plan_index").on(table.planId),
    uniqueIndex("workspace_subscriptions_provider_identifier_unique").on(table.provider, table.providerSubscriptionId),
  ],
);

/**
 * Period-bucketed counters provide a tenant-scoped usage foundation without
 * collecting payment data or implying a billing provider is configured.
 */
export const workspaceUsage = mysqlTable(
  "workspaceUsage",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
    metric: varchar("metric", { length: 120 }).notNull(),
    periodStart: timestamp("periodStart").notNull(),
    periodEnd: timestamp("periodEnd").notNull(),
    quantity: int("quantity").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("workspace_usage_metric_period_unique").on(table.workspaceId, table.metric, table.periodStart),
    index("workspace_usage_workspace_period_index").on(table.workspaceId, table.periodStart),
  ],
);

export const workspaceEntitlements = mysqlTable(
  "workspaceEntitlements",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
    planId: int("planId").references(() => plans.id),
    capability: varchar("capability", { length: 120 }).notNull(),
    isEnabled: boolean("isEnabled").default(true).notNull(),
    usageLimit: int("usageLimit"),
    validFrom: timestamp("validFrom").defaultNow().notNull(),
    validUntil: timestamp("validUntil"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("workspace_entitlements_capability_unique").on(table.workspaceId, table.capability),
    index("workspace_entitlements_plan_index").on(table.planId),
  ],
);

export const featureFlags = mysqlTable(
  "featureFlags",
  {
    id: int("id").autoincrement().primaryKey(),
    key: varchar("key", { length: 120 }).notNull(),
    workspaceId: int("workspaceId").references(() => workspaces.id),
    isEnabled: boolean("isEnabled").default(false).notNull(),
    description: text("description"),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("feature_flags_workspace_key_unique").on(table.workspaceId, table.key)],
);

/**
 * Platform-level integration control state for the private Personal command.
 * It captures readiness and enablement intent without retaining credentials,
 * provider tokens, provider operations, or payment data.
 */
export const platformIntegrationControls = mysqlTable(
  "platformIntegrationControls",
  {
    id: int("id").autoincrement().primaryKey(),
    integrationKey: varchar("integrationKey", { length: 80 }).notNull(),
    status: mysqlEnum("status", ["unconfigured", "reviewed", "ready", "disabled"]).default("unconfigured").notNull(),
    isEnabled: boolean("isEnabled").default(false).notNull(),
    reviewNote: text("reviewNote"),
    reviewedByUserId: int("reviewedByUserId").references(() => users.id),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("platform_integration_control_key_unique").on(table.integrationKey)],
);

/**
 * Guided Wreath Creation is a versioned customer journey layered over the
 * existing tenant-scoped project model. It deliberately separates the client
 * memory, interpretation, story, approval, consent, and provenance records so
 * no generated output may silently rewrite the supplied source material.
 */
export const guidedWreathStageValues = ["memory", "essence", "story", "florals", "recipe", "blueprint", "wreath", "outcome"] as const;
export const guidedStageStatusValues = ["draft", "blocked", "complete"] as const;
export const guidedApprovalDecisionValues = ["approved", "revision_requested"] as const;
export const generationSourceValues = ["manual", "model", "fallback"] as const;
export const consentTypeValues = ["memory", "story", "wreath_image", "lookbook", "marketing", "anonymous_improvement"] as const;
export const visibilityValues = ["private", "private_story_shareable_wreath", "private_link_lookbook", "anonymous_gallery", "public_first_name", "fully_public"] as const;

export const memoryEntries = mysqlTable(
  "memoryEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull().references(() => projects.id),
    version: int("version").default(1).notNull(),
    body: text("body").notNull(),
    visibility: mysqlEnum("visibility", visibilityValues).default("private").notNull(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("memory_entries_project_version_unique").on(table.projectId, table.version),
    index("memory_entries_project_created_index").on(table.projectId, table.createdAt),
  ],
);

export const essenceProfiles = mysqlTable(
  "essenceProfiles",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull().references(() => projects.id),
    memoryEntryId: int("memoryEntryId").notNull().references(() => memoryEntries.id),
    version: int("version").default(1).notNull(),
    status: mysqlEnum("status", ["draft", "approved", "needs_revision"]).default("draft").notNull(),
    emotionalCenter: varchar("emotionalCenter", { length: 255 }).notNull(),
    atmosphere: varchar("atmosphere", { length: 255 }).notNull(),
    movement: varchar("movement", { length: 255 }).notNull(),
    visualTension: varchar("visualTension", { length: 255 }).notNull(),
    paletteDirection: varchar("paletteDirection", { length: 255 }).notNull(),
    expression: text("expression").notNull(),
    avoidances: json("avoidances").notNull(),
    sourceGrounding: json("sourceGrounding").notNull(),
    unsupportedClaims: json("unsupportedClaims").notNull(),
    generationSource: mysqlEnum("generationSource", generationSourceValues).default("manual").notNull(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    approvedAt: timestamp("approvedAt"),
  },
  table => [
    uniqueIndex("essence_profiles_project_version_unique").on(table.projectId, table.version),
    index("essence_profiles_project_status_index").on(table.projectId, table.status),
  ],
);

export const memoryStories = mysqlTable(
  "memoryStories",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull().references(() => projects.id),
    memoryEntryId: int("memoryEntryId").notNull().references(() => memoryEntries.id),
    essenceProfileId: int("essenceProfileId").notNull().references(() => essenceProfiles.id),
    version: int("version").default(1).notNull(),
    status: mysqlEnum("status", ["draft", "approved", "needs_revision"]).default("draft").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    designSignals: json("designSignals").notNull(),
    sourceGrounding: json("sourceGrounding").notNull(),
    unsupportedClaims: json("unsupportedClaims").notNull(),
    generationSource: mysqlEnum("generationSource", generationSourceValues).default("manual").notNull(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    approvedAt: timestamp("approvedAt"),
  },
  table => [
    uniqueIndex("memory_stories_project_version_unique").on(table.projectId, table.version),
    index("memory_stories_project_status_index").on(table.projectId, table.status),
  ],
);

export const guidedStageStates = mysqlTable(
  "guidedStageStates",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull().references(() => projects.id),
    currentStage: mysqlEnum("currentStage", guidedWreathStageValues).default("memory").notNull(),
    status: mysqlEnum("status", guidedStageStatusValues).default("draft").notNull(),
    blockReason: text("blockReason"),
    updatedByUserId: int("updatedByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("guided_stage_states_project_unique").on(table.projectId)],
);

export const stageApprovals = mysqlTable(
  "stageApprovals",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull().references(() => projects.id),
    stage: mysqlEnum("stage", guidedWreathStageValues).notNull(),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: int("entityId").notNull(),
    entityVersion: int("entityVersion").notNull(),
    decision: mysqlEnum("decision", guidedApprovalDecisionValues).notNull(),
    note: text("note"),
    decidedByUserId: int("decidedByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("stage_approvals_project_stage_index").on(table.projectId, table.stage, table.createdAt),
    index("stage_approvals_entity_index").on(table.entityType, table.entityId),
  ],
);

export const memoryThreadEvents = mysqlTable(
  "memoryThreadEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull().references(() => projects.id),
    stage: mysqlEnum("stage", guidedWreathStageValues).notNull(),
    sourceType: varchar("sourceType", { length: 80 }).notNull(),
    sourceId: int("sourceId").notNull(),
    sourceVersion: int("sourceVersion").notNull(),
    summary: text("summary").notNull(),
    isDirectSource: boolean("isDirectSource").default(false).notNull(),
    createdByUserId: int("createdByUserId").notNull().references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("memory_thread_events_project_created_index").on(table.projectId, table.createdAt)],
);

export const memoryConsents = mysqlTable(
  "memoryConsents",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull().references(() => projects.id),
    consentType: mysqlEnum("consentType", consentTypeValues).notNull(),
    isGranted: boolean("isGranted").default(false).notNull(),
    visibility: mysqlEnum("visibility", visibilityValues).default("private").notNull(),
    decidedByUserId: int("decidedByUserId").notNull().references(() => users.id),
    decidedAt: timestamp("decidedAt").defaultNow().notNull(),
    revokedAt: timestamp("revokedAt"),
  },
  table => [uniqueIndex("memory_consents_project_type_unique").on(table.projectId, table.consentType)],
);

export const auditLogs = mysqlTable(
  "auditLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").references(() => workspaces.id),
    actorUserId: int("actorUserId").references(() => users.id),
    action: varchar("action", { length: 160 }).notNull(),
    targetType: varchar("targetType", { length: 80 }),
    targetId: varchar("targetId", { length: 128 }),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("audit_logs_workspace_created_index").on(table.workspaceId, table.createdAt),
    index("audit_logs_actor_created_index").on(table.actorUserId, table.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type WorkspaceMembership = typeof workspaceMemberships.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Asset = typeof assets.$inferSelect;

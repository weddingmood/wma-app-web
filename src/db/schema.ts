import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  json,
  varchar,
} from "drizzle-orm/pg-core";

// 1. Couples Table
export const couples = pgTable("couples", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  partner1Name: varchar("partner1_name", { length: 120 }).notNull(),
  partner2Name: varchar("partner2_name", { length: 120 }).notNull(),
  partner1Email: varchar("partner1_email", { length: 160 }).notNull(),
  partner2Email: varchar("partner2_email", { length: 160 }),
  partner1Role: varchar("partner1_role", { length: 20 }).default("groom"), // groom, bride, partner
  partner2Role: varchar("partner2_role", { length: 20 }).default("bride"),
  partner1Photo: text("partner1_photo"),
  partner2Photo: text("partner2_photo"),
  weddingDate: varchar("wedding_date", { length: 50 }),
  city: varchar("city", { length: 100 }).default("Abidjan"),
  venue: varchar("venue", { length: 200 }),
  totalBudget: integer("total_budget").default(5000000), // in FCFA
  estimatedGuests: integer("estimated_guests").default(250),
  ceremonyTypes: json("ceremony_types").$type<string[]>().default(["dot", "civil", "benediction", "reception"]),
  church: varchar("church", { length: 150 }),
  pastorName: varchar("pastor_name", { length: 150 }),
  ethnicity: varchar("ethnicity", { length: 100 }), // e.g. Baoulé, Bété, Agni, Senoufo, etc.
  traditions: text("traditions"),
  bibleVerse: text("bible_verse").default("Ecclésiaste 4:12 - La corde à trois fils ne se rompt pas facilement."),
  status: varchar("status", { length: 40 }).default("trial"), // trial, pending_payment, verification, active, expired, suspended, blocked
  trialEndsAt: timestamp("trial_ends_at"),
  passwordHash: text("password_hash").notNull(),
  sharedPasscode: varchar("shared_passcode", { length: 10 }),
  // Code d'accès unique généré automatiquement (Ex: WM-4821)
  accessCode: varchar("access_code", { length: 20 }),
  // Formule d'abonnement : couple (3 000 FCFA) ou individual (2 000 FCFA)
  planType: varchar("plan_type", { length: 30 }).default("couple"),
  planAmount: integer("plan_amount").default(3000),
  partner1AccessActive: boolean("partner1_access_active").default(true),
  partner2AccessActive: boolean("partner2_access_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Couple Preferences & UI Themes (20 themes supported!)
export const couplePreferences = pgTable("couple_preferences", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  themeId: integer("theme_id").default(1), // 1 to 20
  fontFamily: varchar("font_family", { length: 60 }).default("cormorant"), // cormorant, playfair, cinzel, montserrat, jakarta
  displayMode: varchar("display_mode", { length: 30 }).default("standard"), // standard, simplified, organization, elegant
  density: varchar("density", { length: 20 }).default("normal"), // compact, normal, spacious
  fontSize: varchar("font_size", { length: 10 }).default("md"), // sm, md, lg
  coverPhotoUrl: text("cover_photo_url"),
  countdownStyle: varchar("countdown_style", { length: 30 }).default("romantic"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Admins
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 30 }).default("superadmin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 60 }).default("general"), // dot, civil, benediction, reception, traiteur, tenues, photo_video, musique, logistique, spirituel, general
  assignee: varchar("assignee", { length: 20 }).default("both"), // her, him, both
  dueDate: varchar("due_date", { length: 50 }),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  status: varchar("status", { length: 20 }).default("todo"), // todo, in_progress, completed, delayed
  budgetEstimated: integer("budget_estimated").default(0),
  budgetActual: integer("budget_actual").default(0),
  comments: text("comments"),
  attachmentUrl: text("attachment_url"),
  createdBy: varchar("created_by", { length: 20 }).default("both"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Timeline Events (J-90 down to Jour J)
export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  phase: varchar("phase", { length: 20 }).notNull(), // J-90, J-60, J-30, J-14, J-7, J-1, JOUR_J
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 60 }),
  dueDate: varchar("due_date", { length: 50 }),
  isCompleted: boolean("is_completed").default(false),
  assignedTo: varchar("assigned_to", { length: 20 }).default("both"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Calendar Events
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventDate: varchar("event_date", { length: 50 }).notNull(), // YYYY-MM-DD
  startTime: varchar("start_time", { length: 20 }),
  endTime: varchar("end_time", { length: 20 }),
  location: varchar("location", { length: 200 }),
  category: varchar("category", { length: 60 }).default("rendez_vous"),
  reminderMinutes: integer("reminder_minutes").default(60),
  linkedTaskId: integer("linked_task_id"),
  createdBy: varchar("created_by", { length: 20 }).default("both"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Budget Categories
export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  allocatedAmount: integer("allocated_amount").default(0),
  iconKey: varchar("icon_key", { length: 50 }).default("wallet"),
  colorKey: varchar("color_key", { length: 50 }).default("gold"),
  orderIndex: integer("order_index").default(0),
});

// 8. Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => budgetCategories.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  advancePaid: integer("advance_paid").default(0),
  remainingAmount: integer("remaining_amount").default(0),
  dueDate: varchar("due_date", { length: 50 }),
  paymentStatus: varchar("payment_status", { length: 30 }).default("unpaid"), // unpaid, partial, paid
  recipient: varchar("recipient", { length: 150 }),
  invoiceUrl: text("invoice_url"),
  requiresDualValidation: boolean("requires_dual_validation").default(false), // true if > 50 000 FCFA
  validationStatus: varchar("validation_status", { length: 30 }).default("approved_by_both"), // pending, approved_by_both, rejected
  partner1Approved: boolean("partner1_approved").default(true),
  partner2Approved: boolean("partner2_approved").default(false),
  createdBy: varchar("created_by", { length: 20 }).default("partner1"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Decisions
export const decisions = pgTable("decisions", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  amount: integer("amount").default(0),
  proposalDetails: text("proposal_details"),
  status: varchar("status", { length: 30 }).default("pending"), // pending, approved, rejected, discussed
  partner1Decision: varchar("partner1_decision", { length: 20 }).default("approved"), // pending, approved, rejected
  partner2Decision: varchar("partner2_decision", { length: 20 }).default("pending"),
  partner1Comment: text("partner1_comment"),
  partner2Comment: text("partner2_comment"),
  attachmentUrl: text("attachment_url"),
  decidedAt: timestamp("decided_at"),
  createdBy: varchar("created_by", { length: 20 }).default("partner1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 10. Prayers (Journal de prière)
export const prayers = pgTable("prayers", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  prayerText: text("prayer_text").notNull(),
  category: varchar("category", { length: 60 }).default("couple"),
  prayerDate: varchar("prayer_date", { length: 50 }).notNull(),
  isAnswered: boolean("is_answered").default(false),
  testimony: text("testimony"),
  status: varchar("status", { length: 30 }).default("active"), // active, archived
  partner1Prayed: boolean("partner1_prayed").default(true),
  partner2Prayed: boolean("partner2_prayed").default(false),
  createdBy: varchar("created_by", { length: 20 }).default("partner1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. Devotions (7 Biblical Themes)
export const devotions = pgTable("devotions", {
  id: serial("id").primaryKey(),
  themeNumber: integer("theme_number").notNull().unique(), // 1 to 7
  title: varchar("title", { length: 200 }).notNull(),
  scriptureRef: varchar("scripture_ref", { length: 120 }).notNull(),
  scriptureText: text("scripture_text").notNull(),
  teaching: text("teaching").notNull(),
  reflection: text("reflection").notNull(),
  coupleQuestion: text("couple_question").notNull(),
  prayerModel: text("prayer_model").notNull(),
  pastorAudioUrl: text("pastor_audio_url"),
  pastorName: varchar("pastor_name", { length: 120 }),
  timelinePhase: varchar("timeline_phase", { length: 20 }).default("J-90"), // J-90, J-60, J-30, J-7
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 12. Couple Devotion Progress
export const coupleDevotionProgress = pgTable("couple_devotion_progress", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  devotionId: integer("devotion_id").notNull().references(() => devotions.id, { onDelete: "cascade" }),
  partner1Completed: boolean("partner1_completed").default(false),
  partner2Completed: boolean("partner2_completed").default(false),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
});

// 13. Couple Commandments (10 Commandements)
export const coupleCommandments = pgTable("couple_commandments", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  text: text("text").notNull(),
  importanceWhy: text("importance_why"),
  commitmentText: text("commitment_text"),
  partner1Confirmed: boolean("partner1_confirmed").default(false),
  partner2Confirmed: boolean("partner2_confirmed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 14. Quiz Questions
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull(), // connaissance, situation_reelle, discussion_couple
  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(),
  correctOptionIndex: integer("correct_option_index").default(0),
  explanation: text("explanation"),
  bibleRef: varchar("bible_ref", { length: 120 }),
  ivorianContext: text("ivorian_context"),
  dayNumber: integer("day_number").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 15. Quiz Attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  quizQuestionId: integer("quiz_question_id").notNull().references(() => quizQuestions.id, { onDelete: "cascade" }),
  partnerKey: varchar("partner_key", { length: 20 }).notNull(), // partner1, partner2
  chosenOption: integer("chosen_option").notNull(),
  isCorrect: boolean("is_correct").default(false),
  discussionNotes: text("discussion_notes"),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
});

// 16. Library Books
export const libraryBooks = pgTable("library_books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 150 }).notNull(),
  pastor: varchar("pastor", { length: 150 }),
  coverUrl: text("cover_url"),
  fileUrl: text("file_url"),
  category: varchar("category", { length: 60 }).notNull(), // mariage, communication, finances, purete, priere
  description: text("description").notNull(),
  bibleVerse: text("bible_verse"),
  accessLevel: varchar("access_level", { length: 30 }).default("all"), // all, intermediate, advanced
  readTimeMin: integer("read_time_min").default(25),
  chapters: json("chapters").$type<{ title: string; content: string }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 17. Couple Book Progress
export const coupleBooksProgress = pgTable("couple_books_progress", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  bookId: integer("book_id").notNull().references(() => libraryBooks.id, { onDelete: "cascade" }),
  currentChapter: integer("current_chapter").default(1),
  progressPercent: integer("progress_percent").default(0),
  notes: text("notes"),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
});

// 18. Articles (Bon à savoir)
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  category: varchar("category", { length: 60 }).notNull(), // civil, dot, eglise, documents, droits_devoirs, familles, budget, apres_mariage
  source: varchar("source", { length: 150 }),
  organism: varchar("organism", { length: 150 }),
  sourceUrl: text("source_url"),
  verifiedAt: varchar("verified_at", { length: 50 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 19. Courses & Guides
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  momentIdeal: varchar("moment_ideal", { length: 100 }),
  requiredDocuments: json("required_documents").$type<string[]>(),
  steps: json("steps").$type<{ stepNumber: number; title: string; detail: string }[]>(),
  practicalTips: json("practical_tips").$type<string[]>(),
  legalSources: json("legal_sources").$type<string[]>(),
  orderIndex: integer("order_index").default(0),
});

// 20. Guests
export const guests = pgTable("guests", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  groupName: varchar("group_name", { length: 60 }).default("famille"), // famille, jeunesse, chorale, amis, collegues, vip, autre
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 160 }),
  plusOnesAllowed: integer("plus_ones_allowed").default(0),
  plusOnesConfirmed: integer("plus_ones_confirmed").default(0),
  rsvpStatus: varchar("rsvp_status", { length: 30 }).default("pending"), // pending, confirmed, declined
  dietaryNeeds: text("dietary_needs"),
  tableNumber: varchar("table_number", { length: 30 }),
  notes: text("notes"),
  qrCodeToken: varchar("qr_code_token", { length: 100 }),
  isCheckedIn: boolean("is_checked_in").default(false),
  checkedInAt: timestamp("checked_in_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 21. Invitations (Public Couple Website)
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  heroTitle: varchar("hero_title", { length: 255 }).notNull(),
  loveStory: text("love_story"),
  testimony: text("testimony"),
  weddingDate: varchar("wedding_date", { length: 50 }),
  weddingTime: varchar("wedding_time", { length: 60 }),
  dotDate: varchar("dot_date", { length: 50 }),
  civilDate: varchar("civil_date", { length: 50 }),
  churchDate: varchar("church_date", { length: 50 }),
  receptionDate: varchar("reception_date", { length: 50 }),
  venueName: varchar("venue_name", { length: 200 }),
  venueAddress: text("venue_address"),
  venueMapUrl: text("venue_map_url"),
  heroImageUrl: text("hero_image_url"),
  hasPhoto: boolean("has_photo").default(true),
  photoLayout: varchar("photo_layout", { length: 40 }).default("arched"), // vertical, horizontal, round, framed, arched, full_width
  photoZoom: integer("photo_zoom").default(100),
  photoPosition: varchar("photo_position", { length: 40 }).default("center"),
  subTitle: varchar("sub_title", { length: 255 }).default("Nous nous marions"),
  cardTemplate: varchar("card_template", { length: 50 }).default("terracotta_royal"), // terracotta_royal, classic_gold, emerald_elegance, minimalist_pure, floral_garden, spiritual_cross, chic_ivoirien
  sansPhotoStyle: varchar("sans_photo_style", { length: 50 }).default("monogram"), // monogram, typographic, floral, spiritual, terracotta_gold, african_chic
  ceremoniesSelected: json("ceremonies_selected").$type<string[]>().default(["dot", "civil", "church", "reception"]),
  ceremoniesDetails: json("ceremonies_details").$type<Record<string, {
    time?: string;
    date?: string;
    location?: string;
    address?: string;
    mapUrl?: string;
    description?: string;
  }>>(),
  introText: text("intro_text"),
  additionalInfo: text("additional_info"),
  finalMessage: text("final_message"),
  galleryPhotos: json("gallery_photos").$type<string[]>(),
  pastorWord: text("pastor_word"),
  blessingMessage: text("blessing_message"),
  customVerse: text("custom_verse"),
  publicationStatus: varchar("publication_status", { length: 40 }).default("published"), // draft, ready_to_publish, published, updating
  isPublished: boolean("is_published").default(true),
  rsvpDeadline: varchar("rsvp_deadline", { length: 50 }),
  // Customization styling tokens
  customPrimaryColor: varchar("custom_primary_color", { length: 30 }),
  customSecondaryColor: varchar("custom_secondary_color", { length: 30 }),
  customAccentColor: varchar("custom_accent_color", { length: 30 }),
  customTextColor: varchar("custom_text_color", { length: 30 }),
  customFontFamily: varchar("custom_font_family", { length: 60 }),
  customFontSize: varchar("custom_font_size", { length: 20 }),
  customTextAlign: varchar("custom_text_align", { length: 20 }).default("center"),
  photoPositionX: integer("photo_position_x").default(50), // 0 to 100%
  photoPositionY: integer("photo_position_y").default(50), // 0 to 100%
  // Section visibility flags
  showCountdown: boolean("show_countdown").default(true),
  showStory: boolean("show_story").default(true),
  showProgramme: boolean("show_programme").default(true),
  showLocations: boolean("show_locations").default(true),
  showVerse: boolean("show_verse").default(true),
  showRsvp: boolean("show_rsvp").default(true),
  showCagnotte: boolean("show_cagnotte").default(true),
  showQrCode: boolean("show_qr_code").default(true),
  // Cagnotte custom contribution link settings
  cagnotteEnabled: boolean("cagnotte_enabled").default(true),
  cagnotteTitle: varchar("cagnotte_title", { length: 200 }).default("Cagnotte Foyer & Premier Loyer"),
  cagnotteDescription: text("cagnotte_description").default("Pour les proches qui souhaitent manifester leur générosité et participer à l'aménagement du foyer, vous pouvez contribuer directement par votre moyen de paiement habituel."),
  cagnottePaymentMethod: varchar("cagnotte_payment_method", { length: 50 }).default("wave"), // wave, orange_money, mtn_money, moov_money, other
  cagnottePaymentUrl: text("cagnotte_payment_url"),
  cagnotteButtonText: varchar("cagnotte_button_text", { length: 100 }).default("Contribuer au foyer"),
  cagnotteUpdatedAt: timestamp("cagnotte_updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 22. RSVPs
export const rsvps = pgTable("rsvps", {
  id: serial("id").primaryKey(),
  invitationId: integer("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  guestId: integer("guest_id").references(() => guests.id, { onDelete: "set null" }),
  guestName: varchar("guest_name", { length: 150 }).notNull(),
  email: varchar("email", { length: 160 }),
  phone: varchar("phone", { length: 50 }),
  attending: boolean("attending").notNull(),
  attendanceStatus: varchar("attendance_status", { length: 30 }).default("confirmed"), // confirmed, declined, maybe
  plusOnesCount: integer("plus_ones_count").default(0),
  messageForCouple: text("message_for_couple"),
  prayerWishes: text("prayer_wishes"),
  adviceWishes: text("advice_wishes"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// 23. Cagnotte Contributions (Cagnotte Foyer, Premier Loyer)
export const cagnotteContributions = pgTable("cagnotte_contributions", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  donorName: varchar("donor_name", { length: 150 }).notNull(),
  donorPhone: varchar("donor_phone", { length: 50 }),
  amount: integer("amount").notNull(),
  message: text("message"),
  paymentReference: varchar("payment_reference", { length: 100 }),
  isVerified: boolean("is_verified").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 24. Messages (Couple Native Chat)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id", { length: 20 }).notNull(), // partner1, partner2
  text: text("text").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentType: varchar("attachment_type", { length: 30 }), // image, audio, doc
  isRead: boolean("is_read").default(false),
  sentOffline: boolean("sent_offline").default(false),
  localId: varchar("local_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 25. Call Logs (WebRTC signaling records)
export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  callerId: varchar("caller_id", { length: 20 }).notNull(),
  callType: varchar("call_type", { length: 20 }).notNull(), // audio, video
  status: varchar("status", { length: 30 }).default("completed"), // missed, completed, declined
  durationSeconds: integer("duration_seconds").default(0),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

// 26. Game Sessions (Ludo, Awalé, Dames, Mots, etc.)
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  gameType: varchar("game_type", { length: 40 }).notNull(), // ludo, awale, dames, mots
  gameState: json("game_state").notNull(),
  mode: varchar("mode", { length: 40 }).default("couple"), // couple, ai, local2p, solo
  aiLevel: varchar("ai_level", { length: 30 }), // debutant, facile, moyen, difficile, expert, maitre
  turn: varchar("turn", { length: 20 }).default("partner1"), // partner1, partner2
  score1: integer("score1").default(0),
  score2: integer("score2").default(0),
  status: varchar("status", { length: 30 }).default("ongoing"), // ongoing, finished
  winner: varchar("winner", { length: 30 }), // partner1, partner2, draw, ai
  roomCode: varchar("room_code", { length: 20 }),
  lastMoveAt: timestamp("last_move_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 26b. Game History & Records
export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  gameType: varchar("game_type", { length: 40 }).notNull(),
  mode: varchar("mode", { length: 40 }).notNull(),
  player1Name: varchar("player1_name", { length: 120 }),
  player2Name: varchar("player2_name", { length: 120 }),
  score1: integer("score1").default(0),
  score2: integer("score2").default(0),
  winner: varchar("winner", { length: 40 }), // partner1, partner2, draw, ai
  durationSeconds: integer("duration_seconds").default(0),
  details: json("details"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// 27. Day J Items
export const dayJItems = pgTable("day_j_items", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  timeSlot: varchar("time_slot", { length: 30 }).notNull(), // e.g. "07:30", "09:00"
  activityTitle: varchar("activity_title", { length: 200 }).notNull(),
  location: varchar("location", { length: 200 }),
  personInCharge: varchar("person_in_charge", { length: 150 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  notes: text("notes"),
  isCompleted: boolean("is_completed").default(false),
  orderIndex: integer("order_index").default(0),
});

// 28. Day J Blessings (Wall for big screen projector)
export const dayJBlessings = pgTable("day_j_blessings", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  senderName: varchar("sender_name", { length: 150 }).notNull(),
  senderRelation: varchar("sender_relation", { length: 100 }), // famille, ami, chorale, etc.
  blessingText: text("blessing_text").notNull(),
  photoUrl: text("photo_url"),
  isApprovedForScreen: boolean("is_approved_for_screen").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 29. Payments (Manual Wave CI Workflow: 3 000 FCFA Couple / 2 000 FCFA Individuel)
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull().default(3000), // in FCFA
  planType: varchar("plan_type", { length: 30 }).default("couple"), // couple (3000) | individual (2000)
  payerEmail: varchar("payer_email", { length: 160 }),
  payerPartner: varchar("payer_partner", { length: 20 }).default("partner1"),
  paymentDate: varchar("payment_date", { length: 50 }).notNull(),
  referenceNumber: varchar("reference_number", { length: 120 }).notNull(),
  proofImageUrl: text("proof_image_url"),
  status: varchar("status", { length: 40 }).default("pending"), // pending, verified, rejected, need_new_proof
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 30. Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  recipient: varchar("recipient", { length: 20 }).default("both"), // partner1, partner2, both
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 40 }).default("system"), // task, expense, message, quiz, prayer, payment, decision, system
  linkUrl: varchar("link_url", { length: 255 }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 31. Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id),
  coupleId: integer("couple_id").references(() => couples.id),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 60 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import * as schema from "./schema";

// Sch?mas de validation pour les Couples / Profils
export const insertCoupleSchema = createInsertSchema(schema.couples);
export const selectCoupleSchema = createSelectSchema(schema.couples);

// Sch?mas de validation pour la Messagerie
export const insertMessageSchema = createInsertSchema(schema.messages);
export const selectMessageSchema = createSelectSchema(schema.messages);

// Sch?mas de validation pour les Journaux d'appels
export const insertCallLogSchema = createInsertSchema(schema.callLogs);
export const selectCallLogSchema = createSelectSchema(schema.callLogs);



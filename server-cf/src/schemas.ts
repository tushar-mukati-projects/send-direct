import { z } from "zod";

const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/, "code must be 6 alphanumeric characters");

export const sessionDescriptionSchema = z.object({
  type: z.enum(["offer", "answer", "pranswer", "rollback"]),
  sdp: z.string(),
});

export const iceCandidateSchema = z.object({
  candidate: z.string().optional(),
  sdpMid: z.string().nullable().optional(),
  sdpMLineIndex: z.number().nullable().optional(),
  usernameFragment: z.string().nullable().optional(),
});

export type SessionDescription = z.infer<typeof sessionDescriptionSchema>;
export type IceCandidate = z.infer<typeof iceCandidateSchema>;

export const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("create"), code: codeSchema }),
  z.object({ type: z.literal("join"), code: codeSchema }),
  z.object({ type: z.literal("offer"), sdp: sessionDescriptionSchema }),
  z.object({ type: z.literal("answer"), sdp: sessionDescriptionSchema }),
  z.object({ type: z.literal("ice"), candidate: iceCandidateSchema }),
  z.object({ type: z.literal("bye") }),
]);

export type ServerErrorReason =
  | "room-exists"
  | "room-not-found"
  | "room-full"
  | "not-in-room"
  | "bad-message";

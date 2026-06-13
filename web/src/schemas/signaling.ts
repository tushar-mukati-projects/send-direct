import { z } from "zod";

const sessionDescriptionSchema = z.object({
  type: z.enum(["offer", "answer", "pranswer", "rollback"]),
  sdp: z.string(),
});

const iceCandidateSchema = z.object({
  candidate: z.string().optional(),
  sdpMid: z.string().nullable().optional(),
  sdpMLineIndex: z.number().nullable().optional(),
  usernameFragment: z.string().nullable().optional(),
});

export type SessionDescription = z.infer<typeof sessionDescriptionSchema>;
export type IceCandidate = z.infer<typeof iceCandidateSchema>;

export const serverMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("created"), code: z.string() }),
  z.object({ type: z.literal("joined"), code: z.string() }),
  z.object({ type: z.literal("peer-joined") }),
  z.object({ type: z.literal("peer-left") }),
  z.object({ type: z.literal("offer"), sdp: sessionDescriptionSchema }),
  z.object({ type: z.literal("answer"), sdp: sessionDescriptionSchema }),
  z.object({ type: z.literal("ice"), candidate: iceCandidateSchema }),
  z.object({ type: z.literal("error"), reason: z.string(), message: z.string() }),
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;

export type ClientMessage =
  | { type: "create"; code: string }
  | { type: "join"; code: string }
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; candidate: RTCIceCandidateInit }
  | { type: "bye" };

export const manifestSchema = z.object({
  files: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      size: z.number().nonnegative(),
    }),
  ),
});

export const dataControlSchema = z.discriminatedUnion("t", [
  z.object({ t: z.literal("manifest"), files: manifestSchema.shape.files }),
  z.object({ t: z.literal("accept") }),
  z.object({ t: z.literal("decline") }),
  z.object({ t: z.literal("file-begin"), id: z.string() }),
  z.object({ t: z.literal("file-end"), id: z.string() }),
  z.object({ t: z.literal("all-done") }),
  z.object({ t: z.literal("abort") }),
]);

export type DataControl = z.infer<typeof dataControlSchema>;

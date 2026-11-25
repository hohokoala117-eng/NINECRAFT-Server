import { schema, t, type SchemaType } from "@colyseus/schema";

export const Player = schema({
  id: t.string(),
  name: t.string(),
  x: t.number(),
  y: t.number(),
  z: t.number(),
  yaw: t.number(),
  pitch: t.number(),
  heldItem: t.string(),
  crouching: t.boolean(),
  flying: t.boolean(),
});
export type Player = SchemaType<typeof Player>;

export const MyRoomState = schema({
  inviteCode: t.string(),
  worldName: t.string(),
  seed: t.string(),
  gameMode: t.string(),
  worldSize: t.string(),
  worldType: t.string(),
  worldTime: t.number(),
  weather: t.string(),
  players: t.map(Player),
  blocks: t.map("string"),
  blockStates: t.map("string"),
});
export type MyRoomState = SchemaType<typeof MyRoomState>;

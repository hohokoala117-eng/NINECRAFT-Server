import { schema, t, type SchemaType } from "@colyseus/schema";

export const Player = schema({
  id: t.string(),
  name: t.string(),
  skin: t.string(),
  isHost: t.boolean(),
  isAdmin: t.boolean(),
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
  hostId: t.string(),
  worldName: t.string(),
  seed: t.string(),
  gameMode: t.string(),
  worldSize: t.string(),
  worldType: t.string(),
  worldTime: t.number(),
  weather: t.string(),
  alwaysDay: t.boolean(),
  keepInventory: t.boolean(),
  allowCheats: t.boolean(),
  players: t.map(Player),
  blocks: t.map("string"),
  blockStates: t.map("string"),
});
export type MyRoomState = SchemaType<typeof MyRoomState>;

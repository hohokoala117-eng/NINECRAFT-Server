import { Room, Client, CloseCode } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState.js";
import { verifyAdminToken } from "../app.config.js";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class MyRoom extends Room<{ state: MyRoomState }> {
  maxClients = 16;
  state = new MyRoomState();

  messages = {
    move: (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !data) return;
      if (typeof data.x === "number") player.x = data.x;
      if (typeof data.y === "number") player.y = data.y;
      if (typeof data.z === "number") player.z = data.z;
      if (typeof data.yaw === "number") player.yaw = data.yaw;
      if (typeof data.pitch === "number") player.pitch = data.pitch;
      if (typeof data.heldItem === "string") player.heldItem = data.heldItem;
      if (typeof data.skin === "string" && data.skin) player.skin = data.skin;
      if (typeof data.crouching === "boolean") player.crouching = data.crouching;
      if (typeof data.flying === "boolean") player.flying = data.flying;
    },

    block_update: (client: Client, data: any) => {
      if (!data || typeof data.x !== "number" || typeof data.y !== "number" || typeof data.z !== "number") return;
      const key = `${Math.floor(data.x)},${Math.floor(data.y)},${Math.floor(data.z)}`;
      const blockId = typeof data.blockId === "string" ? data.blockId : "air";
      this.state.blocks.set(key, blockId);
      if (blockId === "air" || blockId === "") {
        this.state.blockStates.delete(key);
      } else if (data.state !== undefined) {
        this.state.blockStates.set(key, typeof data.state === "string" ? data.state : JSON.stringify(data.state));
      }
    },

    block_state_update: (client: Client, data: any) => {
      if (!data || typeof data.x !== "number" || typeof data.y !== "number" || typeof data.z !== "number") return;
      const key = `${Math.floor(data.x)},${Math.floor(data.y)},${Math.floor(data.z)}`;
      if (!data.state) { this.state.blockStates.delete(key); return; }
      const prev = JSON.parse(this.state.blockStates.get(key) || "{}");
      this.state.blockStates.set(key, JSON.stringify(typeof data.state === "object" ? { ...prev, ...data.state } : data.state));
    },
    // メッセージ受信やワールド設定、モブスポーン処理
    chat: (client: Client, data: any) => { /* ... (チャット配信処理) ... */ },
    world_env: (client: Client, data: any) => { /* ... (ワールド環境設定) ... */ },
    spawn_mob: (client: Client, data: any) => { /* ... (モブスポーン処理) ... */ },
  };

  onCreate(options: any) {
    // ルーム・ワールド初期化設定
    const code = options?.inviteCode || generateInviteCode();
    this.roomId = code;
    this.state.inviteCode = code;
    this.state.worldName = options?.worldName || "NINECRAFT World";
    // （他シード値やゲームモードなどの初期化）
  }

  onJoin(client: Client, options: any) {
    // プレイヤー参加時の初期化処理
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    if (this.state.hostId === client.sessionId) this.state.hostId = "";
  }

  onDrop(client: Client) {
    this.allowReconnection(client, 30).catch(() => {});
  }
}

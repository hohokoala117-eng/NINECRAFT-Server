import { Room, Client, CloseCode } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState.js";

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
    // プレイヤーの位置・向き・姿勢の更新
    move: (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !data) return;
      if (typeof data.x === "number") player.x = data.x;
      if (typeof data.y === "number") player.y = data.y;
      if (typeof data.z === "number") player.z = data.z;
      if (typeof data.yaw === "number") player.yaw = data.yaw;
      if (typeof data.pitch === "number") player.pitch = data.pitch;
      if (typeof data.heldItem === "string") player.heldItem = data.heldItem;
      if (typeof data.crouching === "boolean") player.crouching = data.crouching;
      if (typeof data.flying === "boolean") player.flying = data.flying;
    },

    // ブロックの設置・破壊（key: "x,y,z", blockId: ブロック名 or "air"）
    block_update: (client: Client, data: any) => {
      if (!data || typeof data.x !== "number" || typeof data.y !== "number" || typeof data.z !== "number") return;
      const key = `${Math.floor(data.x)},${Math.floor(data.y)},${Math.floor(data.z)}`;
      const blockId = typeof data.blockId === "string" ? data.blockId : "air";
      this.state.blocks.set(key, blockId);
    },

    // チャットメッセージ送信
    chat: (client: Client, data: any) => {
      const player = this.state.players.get(client.sessionId);
      const text = typeof data?.text === "string" ? data.text.slice(0, 200) : "";
      if (!text) return;
      this.broadcast("chat", {
        senderId: client.sessionId,
        senderName: player?.name || "Player",
        text,
        timestamp: Date.now(),
      });
    },

    // ホストからの時間・天候同期（ベッドで寝た時など）
    world_env: (client: Client, data: any) => {
      if (!data) return;
      if (typeof data.worldTime === "number") this.state.worldTime = data.worldTime;
      if (typeof data.weather === "string") this.state.weather = data.weather;
    },
  };

  onCreate(options: any) {
    // 6桁の招待コードをルームIDとしても使えるように設定
    const code = options?.inviteCode || generateInviteCode();
    this.roomId = code;
    this.state.inviteCode = code;

    this.state.worldName = options?.worldName || "NINECRAFT World";
    this.state.seed = String(options?.seed ?? Math.floor(Math.random() * 1000000));
    this.state.gameMode = options?.gameMode || "survival";
    this.state.worldSize = options?.worldSize || "infinite";
    this.state.worldType = options?.worldType || "overworld";
    this.state.worldTime = typeof options?.worldTime === "number" ? options.worldTime : 0;
    this.state.weather = options?.weather || "clear";

    this.setMetadata({
      inviteCode: code,
      worldName: this.state.worldName,
      gameMode: this.state.gameMode,
    });

    console.log(`[NINECRAFT] Room created! Invite Code: ${code}`);
  }

  onJoin(client: Client, options: any) {
    const name = typeof options?.name === "string" && options.name.trim()
      ? options.name.trim().slice(0, 20)
      : `Player_${client.sessionId.slice(0, 4)}`;

    console.log(`[NINECRAFT] ${name} (${client.sessionId}) joined room ${this.roomId}`);

    this.state.players.set(client.sessionId, new Player({
      id: client.sessionId,
      name,
      x: typeof options?.x === "number" ? options.x : 0,
      y: typeof options?.y === "number" ? options.y : 70,
      z: typeof options?.z === "number" ? options.z : 0,
      yaw: 0,
      pitch: 0,
      heldItem: "",
      crouching: false,
      flying: false,
    }));

    this.broadcast("chat", {
      senderId: "system",
      senderName: "System",
      text: `${name} がワールドに参加しました`,
      timestamp: Date.now(),
    });
  }

  onLeave(client: Client, code: CloseCode) {
    const player = this.state.players.get(client.sessionId);
    const name = player?.name || "Player";
    console.log(`[NINECRAFT] ${name} (${client.sessionId}) left!`);
    this.state.players.delete(client.sessionId);

    this.broadcast("chat", {
      senderId: "system",
      senderName: "System",
      text: `${name} が退出しました`,
      timestamp: Date.now(),
    });
  }

  onDrop(client: Client, code: CloseCode) {
    this.allowReconnection(client, 30).catch(() => {});
  }

  onReconnect(client: Client) {
    console.log(`[NINECRAFT] ${client.sessionId} reconnected!`);
  }
}

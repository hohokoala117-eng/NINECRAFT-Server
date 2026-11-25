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

    block_update: (client: Client, data: any) => {
      if (!data || typeof data.x !== "number" || typeof data.y !== "number" || typeof data.z !== "number") return;
      const key = `${Math.floor(data.x)},${Math.floor(data.y)},${Math.floor(data.z)}`;
      const blockId = typeof data.blockId === "string" ? data.blockId : "air";
      this.state.blocks.set(key, blockId);

      if (blockId === "air" || blockId === "") {
        this.state.blockStates.delete(key);
      } else if (data.state !== undefined) {
        const stateStr = typeof data.state === "string" ? data.state : JSON.stringify(data.state);
        this.state.blockStates.set(key, stateStr);
      }
    },

    block_state_update: (client: Client, data: any) => {
      if (!data || typeof data.x !== "number" || typeof data.y !== "number" || typeof data.z !== "number") return;
      const key = `${Math.floor(data.x)},${Math.floor(data.y)},${Math.floor(data.z)}`;
      if (data.state === null || data.state === undefined) {
        this.state.blockStates.delete(key);
        return;
      }
      let nextState: any = data.state;
      if (typeof data.state === "object") {
        try {
          const prev = JSON.parse(this.state.blockStates.get(key) || "{}");
          nextState = JSON.stringify({ ...prev, ...data.state });
        } catch {
          nextState = JSON.stringify(data.state);
        }
      }
      this.state.blockStates.set(key, String(nextState));
    },

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

    world_env: (client: Client, data: any) => {
      if (!data) return;
      if (typeof data.worldTime === "number") this.state.worldTime = data.worldTime;
      if (typeof data.weather === "string") this.state.weather = data.weather;
    },
  };

  onCreate(options: any) {
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

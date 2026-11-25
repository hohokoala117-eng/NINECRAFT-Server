import { Room, Client, CloseCode } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState.js";

// 省略（サーバー側の移動・ブロック更新・チャット等の基本処理）
export class MyRoom extends Room<{ state: MyRoomState }> {
  // `move` メッセージ内で player.skin を更新し、`onJoin` メッセージ内で options.skin を初期スキン（ninecraman等）として設定する処理を追加します。
  // 全体の詳細なコードはGitHub上のリポジトリ構造をご参照ください。
}

}

import { User } from "./Models";

export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
  gameStart: (gameroom: GameRoomInterface, virusShow: number, virusInterval: number) => void;
  roundWinner: (username: string )=>void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
  //  userJoinReq: (username: string, callback: (success: boolean, randomNumber: number, randomInterval: number) => void) => void;

  userJoinReq: (username: string, callback: (success: boolean) => void) => void;
  virusClick: (virusClicked: number, gameroom: GameRoomInterface, socketId: string) => void;
}

export interface RoomInfo {
  id: string;
  users: User[];
}

export interface GameRoomInterface {
  id: string;
  users: string[];
}

export interface RoundsInGame {
  users: String[];
}

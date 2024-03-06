import { User } from "./Models";

export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
    gameStart: (gameroom: GameRoomInterface) => void;

}

// Events emitted by the client to the server
export interface ClientToServerEvents {
  userJoinReq: (username: string, callback: (success: boolean, randomNumber: number, randomInterval: number) => void) => void;
  virusClick: (virusClicked: number) => void;
}

export interface RoomInfo {
  id: string;
  users: User[];
}

export interface GameRoomInterface {
    id: string;
    users: string[];
}
import { User } from "./Models";

export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
    gameStart: (gameroom: GameRoomInterface, virusShow: number, virusInterval: number) => void;
    nextRound: (roomId: string, round: number) => void;
    gameOver: (gameroom: GameRoomInterface) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
//  userJoinReq: (username: string, callback: (success: boolean, randomNumber: number, randomInterval: number) => void) => void;

  userJoinReq: (username: string, callback: (username: string) => void) => void;
  virusClick: (roomId: string, username: string, virusClicked: number) => void;
  // Ska klienten verkligen skicka när rundan är över? Bör göras av servern
  // nextRound: (roomId: string, round: number) => void;
}

export interface RoomInfo {
  id: string;
  users: User[];
}

export interface GameRoomInterface {
    id: string;
    users: string[];
    currentRound?: number;
}
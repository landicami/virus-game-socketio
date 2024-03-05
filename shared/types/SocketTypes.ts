import { User } from "./Models";

export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
  gameStart: (roomWithUsers: RoomInfo) => void;
  userJoinedRoom: (user: string) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
  userJoinReq: (username: string, callback: (success: boolean, slumpatTal: number) => void) => void;
}

export interface RoomInfo {
  id: string;
  users: User[];
}

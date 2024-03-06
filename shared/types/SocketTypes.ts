export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {
    gameStart: (gameroom: GameRoomInterface) => void;

}

// Events emitted by the client to the server
export interface ClientToServerEvents {
    userJoinReq: (username: string, callback: (success: boolean) => void) => void;
}

export interface GameRoomInterface {
    id: string;
    users: string[];
}
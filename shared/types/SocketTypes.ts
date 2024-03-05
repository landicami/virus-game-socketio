export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {

}

// Events emitted by the client to the server
export interface ClientToServerEvents {
    userJoinReq: (username: string, callback: (success: boolean, randomNumber: number, randomInterval: number) => void) => void;
}

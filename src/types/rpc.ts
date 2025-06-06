export interface RpcMessage {
    txId: string;
    method: string;
    next?: string;
    payload: any;
  }

export interface RgbTransfer {
  idx: number;
  batch_transfer_idx: number;
  created_at: number;
  updated_at: number;
  status: TransferStatus;
  amount: number;
  kind: number;
  txid: string | null;
  recipient_id: string;
  receive_utxo: { txid: string; vout: number } | null;
  change_utxo: { txid: string; vout: number } | null;
  expiration: number;
  transport_endpoints: {
    endpoint: string;
    transport_type: number;
    used: boolean;
  }[];
}

export enum TransferStatus {
  WAITING_COUNTERPARTY = 0,
  WAITING_CONFIRMATIONS,
  SETTLED,
  FAILED,
}
export enum TransferKind {
  ISSUANCE = 0,
  RECEIVE_BLIND,
  RECEIVE_WITNESS,
  SEND
}

export interface Unspent {
  utxo: Utxo;
  rgb_allocations: RgbAllocation[];
}
export interface Utxo {
  outpoint: {
    txid: string;
    vout: number;
  };
  btc_amount: number;
  colorable: boolean;
}

export interface RgbAllocation {
  asset_id: string;
  amount: number;
  settled: boolean;
}
export interface AssetNia {
  asset_id: string;
  name: string;
  description: string;
  ticker: string;
  precision: number;
  issued_supply: number;
  timestamp: number;
  added_at: number;
  balance: {
    settled: number,
    future: number,
    spendable: number,
    offchain_outbound: number,
    offchain_inbound: number;
  }

}
import { NotificationType } from "../services/notification";
import { AssetNia } from "../types/wallet";
import { formatTokenAmount } from "./formatTokenAmount";
const network = process.env.BITCOIN_NETWORK;

export const notificationTemplate = {

    [NotificationType.InsufficientBTC]: (params: any) => {
        const { balance, address } = params;
        return `⚠️ Low BTC Balance Warning
  
BTC address: ${address}
₿:  settled - ${balance.settled} sats
    future - ${balance.future} sats
    spendable - ${balance.spendable} sats
🌐: ${network}
  `
    },
    [NotificationType.LowAssetBalance]: (asset: AssetNia) => {
        const { asset_id: assetId, name, balance } = asset;
        return `⚠️ Low Assets Balance Warning
    
    🏷️ Token: ${name}
    🧾 Asset ID: ${assetId}
    💰 Balance:   
        settled - ${formatTokenAmount(balance.settled, asset.precision)} 
        future - ${formatTokenAmount(balance.future, asset.precision)}
        spendable - ${formatTokenAmount(balance.spendable, asset.precision)} 
    🌐: ${network}
`;
    },
}
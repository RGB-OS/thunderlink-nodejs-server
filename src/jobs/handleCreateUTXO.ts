import { logger } from "../lib/logger";
import { wallet } from "../lib/wallet";
import { getChannel } from "../rpc/channel";
import { InvokeRPCMethod } from "../rpc/methodHandlers";
import { pendingRequests } from "../rpc/pending";
import { RpcMessage } from "../types/rpc";
import { Unspent } from "../types/wallet";

// const UTXO_LIMIT = parseInt(process.env.UNSETELED_UTXO_LIMIT || '20', 10);
const UTXO_LIMIT = 50; // Default value for testing

export const handleCreateUTXO = async () => {
    const unspents = await wallet.listUnspents();

    const availableUtxos = unspents.filter(unspent => {
        if (unspent.rgb_allocations.length === 0) return true;
        return unspent.rgb_allocations.every(allocation => allocation.settled === false);
    });

    const availableCount = availableUtxos.length;
    console.log('availableCount', availableCount);
    console.log('UTXO_LIMIT', UTXO_LIMIT);
    if (availableCount < UTXO_LIMIT) {
        const diff = UTXO_LIMIT - availableCount;
        logger.info(`[UTXO Checker] Need to create ${diff} new UTXOs...`);
        try {
            await createUtxos(diff);
            logger.info(`[UTXO Checker] Create UTXOs request sent to signer for ${diff} UTXOs.`);
            // logger.info(`[UTXO Checker] Successfully created ${diff} UTXOs.`);
        } catch (error: any) {
            console.error('Error creating UTXOs:', error?.data || error);
            logger.error(error, '[UTXO Checker Error]');
        }
    } else {
        logger.info(`[UTXO Checker] Enough UTXOs available. No action needed.  ${availableCount}/${UTXO_LIMIT}`);
    }
};
const createUtxos = async (numUTXOs: number) => {
    // const psbtBase64 = await wallet.createUtxosBegin({ num: numUTXOs });
    // console.log('psbtBase64', psbtBase64);
    // const signedPsbt = await wallet.signPsbt({ psbtBase64, mnemonic });
    // console.log('signPsbt', signedPsbt);
    // await wallet.createUtxosEnd({ signedPsbt });

    await InvokeRPCMethod('create-utxo-begin', { num: numUTXOs })
}

export const getUnsettledUnspents = (
    unspents: Unspent[]
): Unspent[] => {
    const unsetteledUTXOs: Unspent[] = []
    for (let i = unspents.length - 1; i >= 0; i--) {
        const unspent = unspents[i];
        const unsettledAllocations = unspent.rgb_allocations.filter(
            (allocation) => allocation.settled === false
        );
        if (unsettledAllocations && unsettledAllocations.length > 0) {
            unsetteledUTXOs.push({
                ...unspent,
                rgb_allocations: unsettledAllocations
            })
        }
    }
    return unsetteledUTXOs;
}



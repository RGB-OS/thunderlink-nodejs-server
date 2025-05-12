export const confirmWebhook = async (req: any, res: any) => {

    try {
        //  bridge work is done successfully then asset should be sent to recipient
        // const transferDetails={
                // recipient_map: Record<string, Recipient[]>;
                // donation?: boolean;            // default: false
                // fee_rate?: number;             // default: 1
                // min_confirmations?: number;    // default: 1
            //   }
        
        // await wallet.send(transferDetails,process.env.MNEMONIC);
        return res.json({ message: 'Transfer sent' });
    } catch (error) {
        console.error('Error confirming transfer:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
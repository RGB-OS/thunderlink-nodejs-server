# Thunderlink Manager – Server Deployment Preparation

This guide outlines the steps required to configure and run the Thunderlink Manager service.

---

## 1. Generate Wallet Keys
You can generate wallet keys in one of two ways:
- Let users generate keys themselves.
- Use the Manager API:
  `
  POST /wallet/generate_keys
  `
- Or call the `generate_keys` function from the RGB library.

---

## 2. Set Environment Variables
Populate the following environment variables based on the generated keys and set the connection URL:
- `XPUB_VAN`
- `XPUB_COL`
- `RABBITMQ_CONNECTION_URL`

These should correspond to the xpubs generated in the previous step.

---

## 3. Start the Signer Client Server
Ensure that the Signer service is running.  
In the Signer `.env` file, set the mnemonic:
`
MNEMONIC="your mnemonic phrase"
`

---

## 5. Fund Wallet Address
Invoke:
`
POST /wallet/address
`
Send some test satoshis to the returned Bitcoin address.

---

## 6. Create UTXOs Automatically
Set the following variable in `.env` to control how many UTXOs should be created if not enough exist:
```
UNSETELED_UTXO_LIMIT=5
```
The service will automatically create missing UTXOs on startup.

---

## 7. Issue an Asset
Call:
```
POST /wallet/issueassetnia
```

### Example Payload:
```json
{
  "ticker": "WUSDT",
  "name": "Wrapped Test USDT",
  "amounts": [1000000],
  "precision": 0
}
```

---

## 8. Verify Asset Issuance
Invoke:
```
GET /wallet/assets
```
Ensure your asset appears in the list.

---


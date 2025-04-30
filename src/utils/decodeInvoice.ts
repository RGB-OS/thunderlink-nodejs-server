

export function decodeInvoice(invoice: string) {
  const parts:any = {
    recipient_id: null,
    asset_iface: null,
    asset_id: null,
    amount: null,
    network: null,
    expiration_timestamp: null,
    transport_endpoints: [] as string[],
  };

  const [prefix, query] = invoice.split('?');
  const [asset_id, iface, amountAndRecipient] = prefix.split('/');
  const [amountPart, recipient_id] = amountAndRecipient.split('+');

  parts.asset_id = asset_id || null;
  parts.asset_iface = iface || null;
  parts.recipient_id = recipient_id || null;

  try {
    parts.amount = base58ToNumber(amountPart);
  } catch {
    parts.amount = null;
  }

  if (recipient_id?.startsWith('bcrt')) parts.network = 'Regtest';
  else if (recipient_id?.startsWith('tb')) parts.network = 'Testnet';
  else if (recipient_id?.startsWith('bc')) parts.network = 'Bitcoin';

  const params = new URLSearchParams(query);
  if (params.get('expiry')) parts.expiration_timestamp = parseInt(params.get('expiry')!, 10);
  if (params.get('endpoints')) parts.transport_endpoints = [params.get('endpoints')!];

  return parts;
}
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58ToNumber(str: string): number {
  return [...str].reduce((num, char) => {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`Invalid Base58 character: ${char}`);
    return num * 58 + index;
  }, 0);
}

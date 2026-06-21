import Tesseract from 'tesseract.js';

export async function extractReceiptData(file) {
  const { data: { text } } = await Tesseract.recognize(file, 'eng');
  return parseReceiptText(text);
}

function cleanNum(str) {
  // handles "50,000" "50 000" "50.000" → 50000
  return parseInt(str.replace(/[,.\s]/g, ''), 10);
}

function parseReceiptText(raw) {
  const flat = raw.replace(/\r?\n/g, ' ').replace(/\s{2,}/g, ' ');

  let amount = '';
  let senderNumber = '';
  let referenceId = '';

  // Amount — try labelled fields first, then currency-adjacent numbers
  // Handles: "50,000" "50 000" "50.000" with optional Le/SLE/NLE/SLL prefix or suffix
  const NUM = '([\\d][\\d,. ]{1,12})';
  const CUR = '(?:le|sle|nle|sll|nsl)';
  const amountTries = [
    flat.match(new RegExp(`(?:amount|amt|total|sent|paid|value|recharge|credit|debit)[:\\s]+(?:${CUR})?\\s*${NUM}`, 'i')),
    flat.match(new RegExp(`${CUR}\\s*${NUM}`, 'i')),
    flat.match(new RegExp(`${NUM}\\s*${CUR}`, 'i')),
    // last resort: biggest standalone number on the receipt
    flat.match(/\b(\d[\d,. ]{2,10}\d)\b/),
  ];
  for (const m of amountTries) {
    if (!m) continue;
    const n = cleanNum(m[1]);
    if (n > 0 && n <= 500_000_000) { amount = n.toString(); break; }
  }

  // Sierra Leone phone — 076/077/078/079/030/031/032/033 (9 digits) or +232 prefix
  const phoneM = flat.match(
    /(?:from|de|sender|mobile|phone|msisdn|numero)?[:\s]*(\+?232[\s.\-]?[0-9]{2}[\s.\-]?[0-9]{3}[\s.\-]?[0-9]{4}|\b0[37][0-9][\s.\-]?[0-9]{3}[\s.\-]?[0-9]{4}\b)/i
  );
  if (phoneM) {
    const digits = phoneM[1].replace(/[\s.\-]/g, '');
    if (digits.startsWith('232')) senderNumber = '+' + digits;
    else if (digits.startsWith('0')) senderNumber = '+232' + digits.slice(1);
    else senderNumber = digits;
  }

  // Reference ID — prefer labelled field, fall back to bare alphanumeric code
  const refM = flat.match(
    /(?:ref(?:erence)?(?:\s*(?:id|no|num(?:ber)?)?)?|transaction\s*(?:id|no|ref)|txn\s*(?:id)?|receipt\s*(?:no|id)?|id\s*no)[:\s#]+([A-Z0-9]{5,25})/i
  ) || flat.match(/\b([A-Z]{1,4}[0-9]{6,16}[A-Z0-9]{0,6})\b/);
  if (refM) referenceId = refM[1].toUpperCase();

  return { amount, senderNumber, referenceId };
}

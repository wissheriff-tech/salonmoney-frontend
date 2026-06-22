import Tesseract from 'tesseract.js';

export async function extractReceiptData(file) {
  const { data: { text } } = await Tesseract.recognize(file, 'eng');
  const result = parseReceiptText(text);
  result._rawText = text;
  return result;
}

function cleanNum(str) {
  return parseInt(str.replace(/[,.\s]/g, ''), 10);
}

function normalizePhone(raw) {
  const digits = raw.replace(/[\s.\-()]/g, '');
  if (digits.startsWith('+232')) return '+232' + digits.slice(4);
  if (digits.startsWith('232')) return '+232' + digits.slice(3);
  if (digits.startsWith('0') && digits.length >= 9) return '+232' + digits.slice(1);
  return digits;
}

function parseReceiptText(raw) {
  const flat = raw.replace(/\r?\n/g, ' ').replace(/\s{2,}/g, ' ');

  let amount = '', senderNumber = '', referenceId = '';

  // ── Amount ────────────────────────────────────────────────────────────────
  // Orange Money SL: "SLE2,500" or "SLE 2,500" (Main Account label)
  // Also handles: "Amount: Le 50,000" / "Total: 50 000 SLE"
  const NUM = '([\\d][\\d,. ]{0,12})';
  const CUR = '(?:le|sle|nle|sll|nsl)';
  const amountTries = [
    // "SLE2,500" — currency immediately before number (no space)
    flat.match(new RegExp(`(?:${CUR})([\\d][\\d,]*(?:\\.\\d{1,2})?)`, 'i')),
    // "Amount: Le 50,000" / "Main Account SLE 2,500"
    flat.match(new RegExp(`(?:amount|amt|total|sent|paid|value|recharge|main\\s*account)[:\\s]+(?:${CUR})?\\s*${NUM}`, 'i')),
    // currency with space: "SLE 2,500"
    flat.match(new RegExp(`(?:${CUR})\\s+${NUM}`, 'i')),
    // number then currency: "2,500 SLE"
    flat.match(new RegExp(`${NUM}\\s*(?:${CUR})`, 'i')),
    // last resort: largest standalone number
    flat.match(/\b(\d[\d,. ]{2,10}\d)\b/),
  ];
  for (const m of amountTries) {
    if (!m) continue;
    const n = cleanNum(m[1]);
    if (n > 0 && n <= 500_000_000) { amount = n.toString(); break; }
  }

  // ── Sender ────────────────────────────────────────────────────────────────
  // Orange Money SL format: "Sender : 075085941"
  const SL_PHONE = '(\\+?232[\\s.\\-]?[0-9]{2}[\\s.\\-]?[0-9]{3}[\\s.\\-]?[0-9]{4}|\\b0[37][0-9][\\s.\\-]?[0-9]{3}[\\s.\\-]?[0-9]{4}\\b)';
  const senderM = flat.match(new RegExp(`(?:sender|from|de|your\\s*(?:number|no|account)|msisdn|mobile)\\s*:?\\s*${SL_PHONE}`, 'i'));
  if (senderM) {
    senderNumber = normalizePhone(senderM[1]);
  }

  // ── Receiver (for fallback — not put in form but used to exclude from sender search) ──
  const receiverM = flat.match(new RegExp(`(?:receiver|recipient|to|transfer\\s*to|beneficiary)\\s*:?\\s*${SL_PHONE}`, 'i'));
  const receiverRaw = receiverM ? receiverM[1].replace(/[\s.\-]/g, '') : null;

  // If no explicit sender label, pick first SL number that isn't the receiver
  if (!senderNumber) {
    const allPhones = [...flat.matchAll(new RegExp(SL_PHONE, 'gi'))].map(m => m[1]);
    for (const p of allPhones) {
      const digits = p.replace(/[\s.\-]/g, '');
      if (receiverRaw && (digits === receiverRaw || digits.endsWith(receiverRaw.slice(-7)))) continue;
      senderNumber = normalizePhone(p);
      break;
    }
  }

  // ── Reference ID ──────────────────────────────────────────────────────────
  // Orange Money SL format: "ReferenceCI260606.1351.B51366"
  // The word "Reference" is part of the string — extract everything after it
  const orangeRefM = flat.match(/Reference([A-Z]{0,4}[0-9]{4,}[A-Z0-9.]{0,30})/i);
  if (orangeRefM) {
    // Keep the full string including "Reference" prefix as the ID
    referenceId = ('Reference' + orangeRefM[1]).toUpperCase();
  } else {
    // Standard labelled reference: "Ref: ABC123" / "Transaction ID: XYZ"
    const refM = flat.match(
      /(?:ref(?:erence)?(?:\s*(?:id|no|num(?:ber)?)?)?|transaction\s*(?:id|no|ref)|txn\s*(?:id)?|receipt\s*(?:no|id)?|id\s*no)[:\s#]+([A-Z0-9]{5,25})/i
    ) || flat.match(/\b([A-Z]{1,4}[0-9]{6,16}[A-Z0-9]{0,6})\b/);
    if (refM) referenceId = refM[1].toUpperCase();
  }

  return { amount, senderNumber, referenceId };
}

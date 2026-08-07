import { getKv } from "./kv";

/**
 * SMS opt-out suppression list. Required for the "Reply STOP to opt out"
 * disclosure in the privacy policy to actually be true, and expected by
 * carriers for A2P approval. Keyed by the raw phone string as given (no
 * normalization beyond trim, since lib/sms.ts already expects E.164-ish
 * input everywhere it calls sendSms).
 */
const OPT_OUT_KEY = "sms:opted_out";

export async function isOptedOut(phone: string): Promise<boolean> {
  return getKv().sismember(OPT_OUT_KEY, phone.trim());
}

export async function addOptOut(phone: string): Promise<void> {
  await getKv().sadd(OPT_OUT_KEY, phone.trim());
}

export async function removeOptOut(phone: string): Promise<void> {
  await getKv().srem(OPT_OUT_KEY, phone.trim());
}

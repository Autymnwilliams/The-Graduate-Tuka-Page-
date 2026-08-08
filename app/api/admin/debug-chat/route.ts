/**
 * One-time diagnostic endpoint: reports which env vars this running
 * instance actually sees (booleans only, never values) plus a live
 * one-shot Gemini call and a live one-shot Twilio account-fetch, so
 * "missing" vs "present but invalid/wrong-scoped" is distinguishable
 * instead of guessing from a generic 500 / silently-skipped SMS. Same
 * pattern as debug-photos -- delete this route once it's served its
 * purpose.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import twilio from "twilio";
import { uploadImageBuffer, deleteImageByUrl, isCloudinaryConfigured } from "@/lib/cloudinary";

const DEBUG_TOKEN = "03531245bcf2f42d51e2bb88b4892107";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== DEBUG_TOKEN) {
    return new Response("Not found", { status: 404 });
  }

  const envPresence = {
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID: !!process.env.TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET: !!process.env.TWILIO_API_KEY_SECRET,
    TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
    UBER_CLIENT_ID: !!process.env.UBER_CLIENT_ID,
    MONGODB_URI: !!process.env.MONGODB_URI,
    GOOGLE_PLACES_API_KEY: !!process.env.GOOGLE_PLACES_API_KEY,
    STAFF_PASSCODE: !!process.env.STAFF_PASSCODE,
    ENABLE_REAL_AVAILABILITY: process.env.ENABLE_REAL_AVAILABILITY === "true",
    CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
  };

  let geminiTest: { ok: boolean; detail: string };
  try {
    if (!process.env.GEMINI_API_KEY) {
      geminiTest = { ok: false, detail: "GEMINI_API_KEY not set" };
    } else {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const result = await model.generateContent("Reply with exactly: ok");
      geminiTest = { ok: true, detail: result.response.text().trim() };
    }
  } catch (err) {
    geminiTest = { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }

  let twilioTest: { ok: boolean; detail: string };
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const keySid = process.env.TWILIO_API_KEY_SID;
    const keySecret = process.env.TWILIO_API_KEY_SECRET;
    if (!sid || !keySid || !keySecret) {
      twilioTest = { ok: false, detail: "One or more of TWILIO_ACCOUNT_SID/API_KEY_SID/API_KEY_SECRET not set" };
    } else {
      const client = twilio(keySid, keySecret, { accountSid: sid });
      const account = await client.api.v2010.accounts(sid).fetch();
      twilioTest = { ok: true, detail: `Account status: ${account.status}` };
    }
  } catch (err) {
    twilioTest = { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }

  let cloudinaryTest: { ok: boolean; detail: string };
  try {
    if (!isCloudinaryConfigured()) {
      cloudinaryTest = { ok: false, detail: "CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET not fully set" };
    } else {
      const { url } = await uploadImageBuffer(Buffer.from("ok"), "debug");
      await deleteImageByUrl(url);
      cloudinaryTest = { ok: true, detail: "Test upload + delete succeeded" };
    }
  } catch (err) {
    cloudinaryTest = { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }

  return Response.json({ envPresence, geminiTest, twilioTest, cloudinaryTest });
}

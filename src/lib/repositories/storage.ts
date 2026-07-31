import type { SupabaseClient } from "@supabase/supabase-js";

const SIGNED_URL_SECONDS = 60;

export async function createSignedResumeUrl(
  client: SupabaseClient,
  storagePath: string,
): Promise<string> {
  const { data, error } = await client.storage
    .from("resumes")
    .createSignedUrl(storagePath, SIGNED_URL_SECONDS);
  if (error || !data.signedUrl) {
    throw new Error("A secure resume download could not be created.");
  }
  return data.signedUrl;
}

export async function createSignedReportUrl(
  client: SupabaseClient,
  storagePath: string,
): Promise<string> {
  const { data, error } = await client.storage
    .from("reports")
    .createSignedUrl(storagePath, SIGNED_URL_SECONDS);
  if (error || !data.signedUrl) {
    throw new Error("A secure report download could not be created.");
  }
  return data.signedUrl;
}

export function opaqueStoragePath(
  extension: "pdf" | "docx" | "txt" | "json",
): string {
  return `${crypto.randomUUID()}/${crypto.randomUUID()}.${extension}`;
}

export { SIGNED_URL_SECONDS };

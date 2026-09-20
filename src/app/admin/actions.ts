"use server";

import { setVerification } from "@/lib/actions/admin";

export async function approveMember(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await setVerification(id, "verified");
}

export async function rejectMember(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await setVerification(id, "rejected");
}

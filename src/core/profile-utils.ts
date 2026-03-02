import { supabase } from '../lib/supabase';
import {
  combinePhone,
  detectCountryFromPhone,
  getDefaultCountryByLanguage,
} from '../data/country-codes';

export function splitFullName(fullName?: string): {
  first: string;
  last: string;
} {
  if (!fullName) return { first: '', last: '' };
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] ?? '',
    last: parts.slice(1).join(' '),
  };
}

export function parseExistingPhone(
  rawPhone: string | undefined,
  lang: string
): { country: string; local: string } {
  if (!rawPhone)
    return { country: getDefaultCountryByLanguage(lang), local: '' };
  const detected = detectCountryFromPhone(rawPhone);
  if (detected)
    return { country: detected.countryCode, local: detected.localNumber };
  return { country: getDefaultCountryByLanguage(lang), local: rawPhone };
}

export interface UpdateUserProfileParams {
  firstName?: string;
  lastName?: string;
  phoneCountry?: string;
  phone?: string;
  currentEmail?: string;
  newEmail?: string;
}

export interface UpdateUserProfileResult {
  success: boolean;
  emailChanged: boolean;
  error?: string;
}

export async function updateUserProfile(
  params: UpdateUserProfileParams
): Promise<UpdateUserProfileResult> {
  const { firstName, lastName, phoneCountry, phone, currentEmail, newEmail } =
    params;

  const metadata: Record<string, string> = {};
  if (firstName) metadata.first_name = firstName;
  if (lastName) metadata.last_name = lastName;
  if (phone) metadata.phone = combinePhone(phoneCountry, phone);

  const emailChanged = !!newEmail && newEmail !== currentEmail;

  if (Object.keys(metadata).length === 0 && !emailChanged) {
    return { success: true, emailChanged: false };
  }

  const updatePayload: { email?: string; data?: Record<string, string> } = {};
  if (emailChanged) updatePayload.email = newEmail;
  if (Object.keys(metadata).length > 0) updatePayload.data = metadata;

  const { error } = await supabase.auth.updateUser(updatePayload);

  if (error) {
    return { success: false, emailChanged: false, error: error.message };
  }

  return { success: true, emailChanged };
}

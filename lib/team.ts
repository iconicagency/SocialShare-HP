// Team emails that share the same data workspace
export const TEAM_EMAILS = [
  'thanhnt.ads@gmail.com',
  'noithathoaphatdsg@gmail.com',
  'hoaphatnoithathm@gmail.com',
  'hoaphatnoithathn@gmail.com',
];

// The canonical owner ID used for all team members' data
// This is the Firebase UID of thanhnt.ads@gmail.com (team owner)
// Update this value after first login by the owner:
// Firebase Console → Authentication → find thanhnt.ads@gmail.com → copy UID
export const TEAM_OWNER_EMAIL = 'thanhnt.ads@gmail.com';

export function isTeamMember(email: string | null | undefined): boolean {
  if (!email) return false;
  return TEAM_EMAILS.includes(email.toLowerCase());
}

export type PractitionerProfile = {
  avatarUrl: string | null;
  branchId: string | null;
  branchName: string;
  branchState: string | null;
  email: string;
  fullName: string;
  id: string;
  phone: string;
  practiceState: string;
  role: string;
  scn: string;
};

export type PractitionerSubscription = {
  amount: number;
  expiresAt: string;
  isCurrent: boolean;
  plan: string;
  rateType: string;
  startsAt: string;
  status: string;
};

export type ProfilePageData = {
  account: {
    email: string;
    lastSignedIn: string;
  };
  profile: PractitionerProfile;
  subscription: PractitionerSubscription | null;
};

export type ProfileLoadResult =
  | { data: ProfilePageData; error: null }
  | { data: null; error: string };

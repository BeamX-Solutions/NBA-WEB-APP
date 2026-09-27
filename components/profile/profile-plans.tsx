import { FormNotice } from "@/components/ui/form-notice";
import { DetailRow, ProfileCard, ProfileFrame, ProfileHeading, ProfileIcon } from "@/components/profile/profile-ui";
import { formatNaira, formatProfileDate, labelEnum } from "@/lib/profile/format";
import type { PractitionerSubscription } from "@/lib/profile/types";

export function ProfilePlans({ branchName, subscription }: { branchName: string; subscription: PractitionerSubscription | null }) {
  return (
    <ProfileFrame>
      <ProfileHeading description="View the subscription recorded for your practitioner account." title="Subscription" />
      <div className="mx-auto max-w-[760px] space-y-4">
        {subscription ? (
          <ProfileCard icon={<ProfileIcon kind="medal" />} title="Current subscription">
            <div className="mb-4">
              <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-[.06em] ${subscription.isCurrent ? "bg-[#e5f5ec] text-[#0d6a3f]" : "bg-[#fff1e6] text-[#9a4f08]"}`}>
                {subscription.isCurrent ? "Active" : labelEnum(subscription.status)}
              </span>
            </div>
            <dl>
              <DetailRow label="Plan" value={labelEnum(subscription.plan)} />
              <DetailRow label="Rate type" value={labelEnum(subscription.rateType)} />
              <DetailRow label="Amount" value={formatNaira(subscription.amount)} />
              <DetailRow label="Starts" value={formatProfileDate(subscription.startsAt)} />
              <DetailRow label="Expires" value={formatProfileDate(subscription.expiresAt)} />
            </dl>
          </ProfileCard>
        ) : (
          <FormNotice tone="info">No subscription is recorded for this account.</FormNotice>
        )}
        <ProfileCard icon={<ProfileIcon kind="support" />} title="Subscription support">
          <p className="text-[16px] leading-[1.55] text-[#66717e]">
            Contact {branchName} for subscription activation, renewal, or questions about the amount recorded on your account.
          </p>
        </ProfileCard>
      </div>
    </ProfileFrame>
  );
}

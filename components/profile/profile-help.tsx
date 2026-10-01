import { Card } from "@/components/mobile/card";
import { Icon } from "@/components/mobile/icon";
import { Screen, ScreenHeading, SectionTitle } from "@/components/mobile/screen";
import { ATTRIBUTION, ORDER_FULL_NAME, PRODUCT_NAME } from "@/lib/branding";

/** mobile settings/help. The answers are mobile's, except where the web works differently. */
const faqs = [
  { question: "What amount should I enter?", answer: "It depends on the instrument, and the calculator relabels the field to match. Conveyancing is charged on the consideration, a gift on market value, an exchange on the higher of the two properties, a mortgage on the loan, and a lease or tenancy on ONE YEAR of rent rather than the total over the term." },
  { question: "Why is a mortgage cheaper than an assignment of the same value?", answer: "They fall under different sub-scales. Conveyancing is Scale 4A, which starts at 10%. Mortgages are Scale 4B, which starts at 4%. Leases and tenancies are Scale 4C and are charged on annual rent." },
  { question: "What fee applies to an Irrevocable Power of Attorney?", answer: "None that the calculator can compute. A Power of Attorney is not a Scale 4 instrument: its fee is agreed with the client under paragraph 2 of the Order, having regard to complexity, time and value." },
  { question: "Is the calculated fee the amount I must charge?", answer: "It is the prescribed minimum, not a quote. You may charge more. Charging below the scale requires an application to the Bar Remuneration Committee." },
  { question: "Why have I not received a Certificate of Compliance?", answer: "A certificate is issued only after a branch administrator verifies your proof of payment. If your transaction still shows Pending Verification, it is waiting on your branch. If it was rejected, the reason is shown on the transaction." },
  { question: "Can I change my branch?", answer: "Not from your profile. Your branch determines who verifies your payments and issues your certificates, so a branch administrator has to make that change. Contact your branch secretariat." },
  { question: "Do I lose my certificates if my subscription lapses?", answer: "No. Certificates already issued to you remain available to download indefinitely. A lapsed subscription only stops new invoices being generated." },
];

export function ProfileHelp() {
  return <Screen>
    <ScreenHeading subtitle="Answers to common questions, and how to reach your branch." title="Help & Support"/>
    <Card>
      <SectionTitle icon="quiz" underline>Frequently asked</SectionTitle>
      {faqs.map((faq) => <details className="group border-b border-border py-3 last:border-b-0" key={faq.question}>
        <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden"><span className="flex-1 text-body font-semibold text-text">{faq.question}</span><Icon className="transition-transform group-open:rotate-180" color="var(--color-text-muted)" name="expand-more" size={22}/></summary>
        <p className="mt-2 text-body leading-[21px] text-text-muted">{faq.answer}</p>
      </details>)}
    </Card>
    <Card className="mt-4">
      <SectionTitle icon="support-agent" underline>Contact your branch</SectionTitle>
      <p className="text-body leading-[21px] text-text-muted">Questions about a specific payment, a rejected proof, or your branch affiliation are handled by your branch, not by this app. Your branch secretariat holds those records.</p>
      <a className="mt-3 flex items-center gap-2 text-body font-semibold text-primary" href="mailto:support@nbaanaocha.org"><Icon name="mail-outline" size={20}/>support@nbaanaocha.org</a>
    </Card>
    <Card className="mt-4">
      <SectionTitle icon="info-outline" underline>About</SectionTitle>
      <p className="text-body leading-[21px] text-text-muted">{PRODUCT_NAME}. {ATTRIBUTION}.</p>
      <p className="mt-3 text-caption leading-[18px] text-text-muted">Fees are calculated under the {ORDER_FULL_NAME}, made under section 15(3) of the Legal Practitioners Act. That Order is an instrument of the Legal Practitioners Remuneration Committee, not of the Nigerian Bar Association.</p>
    </Card>
  </Screen>;
}

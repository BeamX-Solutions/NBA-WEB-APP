import { ButtonLink } from "@/components/mobile/button";
import { Screen } from "@/components/mobile/screen";
import { ErrorState } from "@/components/mobile/states";

export function ProfileLoadError({ message }: { message: string }) {
  return <Screen><ErrorState action={<ButtonLink href="/profile" variant="outline">Try again</ButtonLink>} body={message} title="Your profile could not be loaded"/></Screen>;
}

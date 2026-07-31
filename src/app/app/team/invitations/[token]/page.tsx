import { InvitationAcceptance } from "./invitation-acceptance";

export default async function TeamInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InvitationAcceptance token={token} />;
}

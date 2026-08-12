import { MarketingHeader } from "@/components/marketing-header";

export default function FeaturesLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <MarketingHeader reserveSpace={false} />
      {children}
    </>
  );
}

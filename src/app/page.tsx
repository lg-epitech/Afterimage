import { Show } from "@clerk/nextjs";
import { Dashboard } from "@/components/dashboard";
import { SignedOutLanding } from "@/components/signed-out-landing";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="shell" id="top">
      <SiteHeader />
      <main className="shell__main">
        <Show when="signed-in" fallback={<SignedOutLanding />}>
          <Dashboard />
        </Show>
      </main>
      <SiteFooter />
    </div>
  );
}

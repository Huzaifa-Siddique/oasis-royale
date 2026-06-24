import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export default function AdminPage() {
  return (
    <Section>
      <div className="pt-32">
        <SectionHeader
          tag="Administration"
          title="Staff Portal"
          subtitle="Authenticate to access the management dashboard."
        />
        <div className="max-w-md mx-auto text-center">
          <p className="text-muted mb-8">
            This portal is for authorized staff only. Please log in with your credentials to access the dashboard.
          </p>
          <Button variant="primary" size="lg" asChild>
            <Link href="/admin/dashboard">
              Access Dashboard
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}


import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <p className="text-gold font-heading text-8xl md:text-9xl mb-4">404</p>
      <h1 className="text-3xl md:text-4xl font-heading mb-4">Lost in the Desert</h1>
      <p className="text-muted max-w-md mb-8">
        The page you are looking for has disappeared into the sands. Let us guide you back.
      </p>
      <Button variant="primary" size="lg" asChild>
        <Link href="/">
          <ArrowLeft size={16} />
          Return Home
        </Link>
      </Button>
    </div>
  );
}

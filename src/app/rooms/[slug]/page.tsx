import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { ROOMS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = ROOMS.find((r) => r.id === slug);

  if (!room) notFound();

  return (
    <>
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={room.images[0]} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-8 text-sm"
          >
            <ArrowLeft size={16} />
            Back to Rooms
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
            <div>
              <Badge variant="gold" className="mb-4">
                From ${room.price}/night
              </Badge>
              <h1 className="text-4xl md:text-6xl font-heading leading-tight mb-4">{room.title}</h1>
              <p className="text-muted text-lg">{room.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-4 lg:justify-end">
              <Button variant="primary" size="lg">
                Book This Room
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {room.images.slice(1).map((img, i) => (
                <div key={i} className="glass rounded-xl overflow-hidden aspect-[4/3]">
                  <img src={img} alt={`${room.title} view ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-heading mb-4">About This Suite</h2>
            <p className="text-muted leading-relaxed mb-8">{room.description}</p>

            <div className="glass rounded-2xl p-6 mb-8">
              <h3 className="text-sm font-heading tracking-wider uppercase text-gold mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Size</span>
                  <span>{room.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Capacity</span>
                  <span>{room.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Price</span>
                  <span className="text-gold font-heading">${room.price}/night</span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-heading mb-4">Amenities</h3>
            <div className="grid grid-cols-2 gap-3">
              {room.amenities.map((a) => (
                <div key={a} className="flex items-center gap-2 text-sm text-muted">
                  <Check size={14} className="text-gold shrink-0" />
                  {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

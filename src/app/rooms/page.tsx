import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROOMS } from "@/lib/constants";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Card, CardImage, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function RoomsPage() {
  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1920"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        <SectionHeader
          tag="Accommodations"
          title="Suites & Villas"
          subtitle="Each space is a private universe of luxury, designed to make you feel like the only soul in the desert."
        />
      </section>

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {ROOMS.map((room) => (
            <Card key={room.id}>
              <div className="md:flex">
                <div className="md:w-2/5">
                  <CardImage src={room.images[0]} alt={room.title} className="aspect-[4/3] md:aspect-square" />
                </div>
                <CardContent className="md:w-3/5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="gold">From ${room.price}/night</Badge>
                      <span className="text-xs text-muted">{room.size}</span>
                    </div>
                    <h3 className="text-2xl font-heading mb-2">{room.title}</h3>
                    <p className="text-muted text-sm mb-4">{room.description}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {room.amenities.slice(0, 4).map((a) => (
                        <span key={a} className="text-xs text-muted bg-white/5 px-3 py-1 rounded-full">
                          {a}
                        </span>
                      ))}
                      {room.amenities.length > 4 && (
                        <span className="text-xs text-muted bg-white/5 px-3 py-1 rounded-full">
                          +{room.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Sleeps {room.capacity}</span>
                    <Button variant="primary" size="sm" asChild>
                      <Link href={`/rooms/${room.id}`}>
                        View Details
                        <ArrowRight size={14} />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}

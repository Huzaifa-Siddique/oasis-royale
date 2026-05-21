"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROOMS } from "@/lib/constants";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Card, CardImage, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function FeaturedRooms() {
  const featured = ROOMS.slice(0, 3);

  return (
    <Section id="rooms" background="alt">
      <SectionHeader
        tag="Accommodations"
        title="Luxury Redefined"
        subtitle="Each suite and villa is a masterpiece of design, offering unparalleled comfort and breathtaking views of the endless desert."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {featured.map((room) => (
          <Card key={room.id}>
            <CardImage src={room.images[0]} alt={room.title} />
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="gold">From ${room.price}/night</Badge>
                <span className="text-xs text-muted">{room.size}</span>
              </div>
              <h3 className="text-xl font-heading mb-2">{room.title}</h3>
              <p className="text-muted text-sm mb-4 line-clamp-2">{room.description}</p>
              <Button variant="ghost" size="sm" className="w-full group" asChild>
                <Link href={`/rooms/${room.id}`}>
                  View Details
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center mt-12">
        <Button variant="outline" size="lg" asChild>
          <Link href="/rooms">
            View All Rooms
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </Section>
  );
}

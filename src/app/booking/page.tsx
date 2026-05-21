"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Shield, CreditCard, Calendar, Users, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button, Input, Card, Badge } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

const roomsMap: Record<string, { name: string; price: number }> = {
  "1": { name: "Royal Penthouse", price: 2500 },
  "2": { name: "Golden Suite", price: 1500 },
  "3": { name: "Desert Deluxe", price: 800 },
  "4": { name: "Oasis Standard", price: 400 },
};

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomId = searchParams.get("roomId") || "";
  const prefillCheckIn = searchParams.get("checkIn") || "";
  const prefillCheckOut = searchParams.get("checkOut") || "";
  const prefillGuests = Number(searchParams.get("guests")) || 1;

  const room = roomsMap[roomId];
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkIn, setCheckIn] = useState(prefillCheckIn);
  const [checkOut, setCheckOut] = useState(prefillCheckOut);
  const [guests, setGuests] = useState(prefillGuests);
  const [requests, setRequests] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const price = room ? room.price : 0;
  const subtotal = price * nights;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 sm:pt-32 pb-16 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-heading text-foreground mb-3">Booking Confirmed!</h1>
          <p className="text-foreground/50 mb-2">
            Your reservation at <span className="text-gold font-medium">{room?.name}</span> has been confirmed.
          </p>
          <p className="text-sm text-foreground/40 mb-8">
            A confirmation email has been sent to {guestEmail}.
          </p>
          <div className="space-y-2 mb-8">
            {[
              ["Check In", checkIn],
              ["Check Out", checkOut],
              ["Guests", `${guests} ${guests === 1 ? "Guest" : "Guests"}`],
              ["Total Charged", formatPrice(total)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm py-2 border-b border-white/5">
                <span className="text-foreground/50">{label}</span>
                <span className="text-foreground/80 font-medium">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button variant="secondary">Return Home</Button>
            </Link>
            <Link href="/rooms">
              <Button>Browse More Rooms</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen pt-32 text-center">
        <h1 className="text-2xl font-heading mb-4">No Room Selected</h1>
        <p className="text-foreground/50 mb-6">Please select a room to book.</p>
        <Link href="/rooms"><Button>Browse Rooms</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 sm:pt-32 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/rooms/${roomId}`}
          className="inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-gold transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Room
        </Link>

        <div className="mb-8">
          <Badge variant="info" className="mb-3">BOOKING</Badge>
          <h1 className="text-3xl sm:text-4xl font-heading text-foreground">
            Complete Your <span className="text-gold">Reservation</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-3 space-y-6">
              <Card className="space-y-4">
                <h2 className="text-lg font-heading text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold" /> Stay Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input id="checkIn" label="Check In" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
                  <Input id="checkOut" label="Check Out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground/80">Guests</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-foreground focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>
                    ))}
                  </select>
                </div>
              </Card>

              <Card className="space-y-4">
                <h2 className="text-lg font-heading text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-gold" /> Guest Information
                </h2>
                <Input id="name" label="Full Name" placeholder="John Doe" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
                <Input id="email" label="Email" type="email" placeholder="john@example.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required />
                <Input id="phone" label="Phone" type="tel" placeholder="+1 (555) 000-0000" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} required />
              </Card>

              <Card className="space-y-4">
                <h2 className="text-lg font-heading text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gold" /> Payment
                </h2>
                <Input id="card" label="Card Number" placeholder="4242 4242 4242 4242" />
                <div className="grid grid-cols-2 gap-4">
                  <Input id="expiry" label="Expiry" placeholder="MM/YY" />
                  <Input id="cvc" label="CVC" placeholder="123" />
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground/40">
                  <Shield className="w-3.5 h-3.5" />
                  Your payment information is encrypted and secure.
                </div>
              </Card>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground/80">Special Requests</label>
                <textarea
                  rows={3}
                  value={requests}
                  onChange={(e) => setRequests(e.target.value)}
                  placeholder="Any special requests? (optional)"
                  className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all resize-none"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Confirm Booking &mdash; {formatPrice(total)}
              </Button>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-28">
                <Card variant="elevated" className="space-y-4">
                  <h2 className="text-lg font-heading text-foreground">Booking Summary</h2>

                  <div className="flex gap-4 p-3 rounded-xl bg-white/5">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold/10 to-teal/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-heading text-gold/60">{room.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{room.name}</div>
                      <div className="text-xs text-foreground/40">Standard Room</div>
                      <div className="text-xs text-gold mt-1">{formatPrice(price)} / night</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      ["Subtotal", formatPrice(subtotal)],
                      ["Nights", `${nights} ${nights === 1 ? "night" : "nights"}`],
                      ["Service Fee", formatPrice(serviceFee)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-foreground/50">{label}</span>
                        <span className="text-foreground/70">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-base font-heading text-foreground pt-3 border-t border-white/10">
                      <span>Total</span>
                      <span className="text-gold">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-foreground/40 space-y-1 pt-2">
                    <p>&bull; Free cancellation within 24 hours</p>
                    <p>&bull; Check-in: 3:00 PM &mdash; Check-out: 12:00 PM</p>
                    <p>&bull; Includes complimentary breakfast</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 text-center text-foreground/50">Loading...</div>}>
      <BookingForm />
    </Suspense>
  );
}

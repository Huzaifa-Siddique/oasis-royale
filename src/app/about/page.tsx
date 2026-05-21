import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export default function AboutPage() {
  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        <SectionHeader
          tag="Our Story"
          title="Where the Desert Meets Opulence"
          subtitle="Discover the vision behind Oasis Royale — a sanctuary born from the golden sands."
        />
      </section>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
          <div className="glass rounded-2xl overflow-hidden aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"
              alt="Oasis Royale architecture"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-heading mb-6">A Vision Realized</h2>
            <div className="space-y-4 text-muted leading-relaxed">
              <p>
                Oasis Royale was born from a singular vision: to create a sanctuary where the raw beauty of the desert
                meets the pinnacle of human craftsmanship. Every detail, from the hand-laid gold mosaics to the
                curated art collection, tells a story of passion and precision.
              </p>
              <p>
                Our architecture draws inspiration from the ancient caravanserais that once dotted the Silk Road —
                places of rest, reflection, and wonder. We have reimagined this tradition for the modern traveler,
                blending timeless Arabian hospitality with contemporary luxury.
              </p>
              <p>
                With a team of world-renowned architects, designers, and artisans, we spent five years sculpting this
                vision from the dunes. The result is not just a hotel, but a destination that redefines what luxury
                means.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
          <div className="lg:order-2">
            <div className="glass rounded-2xl overflow-hidden aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800"
                alt="Desert Villa"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="lg:order-1">
            <h2 className="text-3xl font-heading mb-6">The Experience</h2>
            <div className="space-y-4 text-muted leading-relaxed">
              <p>
                At Oasis Royale, we believe luxury is not just about what you see — it is about how you feel. From the
                moment our private car arrives to collect you, every sense is engaged. The scent of oud and amber
                drifts through the air. The sound of water features creates a serene soundtrack.
              </p>
              <p>
                Our staff-to-guest ratio of 3:1 ensures that your every need is anticipated before you articulate it.
                Whether it is a sunrise camel trek, a private dinner in the dunes, or an in-suite spa treatment, we
                orchestrate each moment with quiet precision.
              </p>
              <p>
                We invite you to leave the world behind and step into a realm where time slows down and every detail
                has been considered.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center glass rounded-3xl p-12 md:p-20">
          <h2 className="text-3xl md:text-5xl font-heading mb-6">Begin Your Journey</h2>
          <p className="text-muted text-lg max-w-2xl mx-auto mb-8 text-balance">
            Let us write the next chapter of your story. The desert is waiting.
          </p>
          <Button variant="primary" size="lg" asChild>
            <Link href="/contact">
              Reserve Your Stay
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpenCheck, Users, ShieldCheck } from "lucide-react";
import Logo from "@/components/logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const features = [
  {
    icon: <BookOpenCheck className="w-8 h-8 text-primary" />,
    title: "Verified Skills",
    description: "Learn from peers whose skills are verified by our AI, ensuring quality and trust in every session.",
  },
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: "Peer-to-Peer Learning",
    description: "Exchange knowledge one-on-one. Teach what you know, learn what you don't, and grow together.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: "Secure & Trusted",
    description: "Restricted to .edu.in domains with student ID verification to create a safe learning community.",
  },
];

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === "landing-hero");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
          <h1 className="text-xl font-bold font-headline">SkillSwap Connect</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">
              Sign Up <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="relative py-20 md:py-32">
          <div
            aria-hidden="true"
            className="absolute inset-0 top-0 h-full w-full bg-background [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          ></div>
           <div
            aria-hidden="true"
            className="absolute inset-0 top-0 h-full w-full bg-gradient-to-br from-primary/20 via-transparent to-accent/20"
          ></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left">
                <span className="inline-block bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full text-sm mb-4">
                  Exclusively for University Students
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tighter leading-tight">
                  Learn & Teach Together.
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto md:mx-0">
                  Join a community of university students to exchange skills,
                  earn credits, and unlock your full potential.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Button size="lg" asChild>
                    <Link href="/signup">
                      Get Started for Free
                      <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative h-64 md:h-full w-full max-w-md mx-auto md:max-w-none">
                {heroImage && (
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    data-ai-hint={heroImage.imageHint}
                    fill
                    className="object-cover rounded-2xl shadow-2xl"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24 bg-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">Why SkillSwap Connect?</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                A unique platform designed for the academic community to foster collaborative growth and skill sharing.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center transform hover:-translate-y-2 transition-transform duration-300">
                  <CardContent className="p-8">
                    <div className="inline-block bg-primary/10 p-4 rounded-full mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} SkillSwap Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

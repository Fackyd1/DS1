import { MainExperience } from "@/components/layout/main-experience";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: "Gaspar Doval",
        alternateName: "DS1",
        jobTitle: ["Full Stack Developer", "Game Developer", "Creative Technologist"],
        url: "https://ds1-realm.dev",
      },
      {
        "@type": "CreativeWork",
        name: "DS1 - The Developer's Realm",
        creator: {
          "@type": "Person",
          name: "Gaspar Doval",
        },
        description: "Interactive portfolio, CV and game-powered technical showcase.",
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <MainExperience />
    </>
  );
}

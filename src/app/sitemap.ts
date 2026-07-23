import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ds1-realm.dev";

  const routes = [
    "",
    "/about",
    "/projects",
    "/skills",
    "/experience",
    "/contact",
    "/realm",
    "/realm/game",
    "/realm/leaderboard",
    "/realm/profile",
    "/admin",
  ];

  return routes.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
    lastModified: new Date(),
  }));
}

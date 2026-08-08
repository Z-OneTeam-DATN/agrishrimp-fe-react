import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/_next/static/", "/images/"],
        disallow: [
          "/admin",
          "/account",
          "/profile",
          "/edit-profile",
          "/address",
          "/orders",
          "/voucher",
          "/checkout",
          "/user/cart",
          "/user/checkout",
          "/chat",
          "/advisor",
          "/agronomist",
          "/api",
          "/login",
          "/signup",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
	const base = process.env.PUBLIC_BASE_URL || "https://tidymate.ca"
	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
		sitemap: `${base}/sitemap.xml`,
	}
}
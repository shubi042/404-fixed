import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
	const base = process.env.PUBLIC_BASE_URL || "https://tidymate.ca"
	const lastmod = new Date().toISOString()
	return [
		{ url: `${base}/`, lastModified: lastmod, changeFrequency: "weekly", priority: 1 },
		{ url: `${base}/services`, lastModified: lastmod, changeFrequency: "monthly", priority: 0.8 },
		{ url: `${base}/booking`, lastModified: lastmod, changeFrequency: "weekly", priority: 0.9 },
		{ url: `${base}/contact`, lastModified: lastmod, changeFrequency: "monthly", priority: 0.6 },
	]
}
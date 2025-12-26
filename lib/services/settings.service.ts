import { createClient } from "@/lib/supabase/client";

// Social link type
export interface SocialLink {
    url: string;
    enabled: boolean;
}

export interface SocialLinks {
    instagram: SocialLink;
    twitter: SocialLink;
    linkedin: SocialLink;
    facebook: SocialLink;
    youtube: SocialLink;
}

// Default social links (fallback if DB not set up yet)
const DEFAULT_SOCIAL_LINKS: SocialLinks = {
    instagram: { url: "https://instagram.com/backbenchers_official", enabled: true },
    twitter: { url: "https://twitter.com/backbenchers_in", enabled: true },
    linkedin: { url: "https://linkedin.com/company/backbenchers", enabled: true },
    facebook: { url: "", enabled: false },
    youtube: { url: "", enabled: false },
};

export const settingsService = {
    // Get social links from database (with fallback)
    async getSocialLinks(): Promise<SocialLinks> {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("site_settings")
                .select("value")
                .eq("key", "social_links")
                .single();

            if (error || !data) {
                console.log("Using default social links (table may not exist yet)");
                return DEFAULT_SOCIAL_LINKS;
            }

            return data.value as SocialLinks;
        } catch (error) {
            console.error("Error fetching social links:", error);
            return DEFAULT_SOCIAL_LINKS;
        }
    },

    // Update social links (admin only)
    async updateSocialLinks(links: SocialLinks): Promise<{ success: boolean; error?: string }> {
        try {
            const supabase = createClient();

            const { error } = await supabase
                .from("site_settings")
                .upsert({
                    key: "social_links",
                    value: links,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: "key"
                });

            if (error) {
                console.error("Error updating social links:", error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    // Get enabled social links only (for footer display)
    async getEnabledSocialLinks(): Promise<Array<{ platform: string; url: string }>> {
        const links = await this.getSocialLinks();
        const enabled: Array<{ platform: string; url: string }> = [];

        Object.entries(links).forEach(([platform, link]) => {
            if (link.enabled && link.url) {
                enabled.push({ platform, url: link.url });
            }
        });

        return enabled;
    }
};

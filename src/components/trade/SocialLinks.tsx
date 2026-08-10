"use client";

import React from "react";

interface SocialLink {
  name: string;
  url: string;
  icon: string;
  color: string;
}

const socialLinks: SocialLink[] = [
  {
    name: "Discord",
    url: "https://discord.gg/indieun",
    icon: "discord",
    color: "#5865F2",
  },
  {
    name: "YouTube",
    url: "https://youtube.com/@indieun",
    icon: "youtube",
    color: "#FF0000",
  },
  {
    name: "Roblox",
    url: "https://roblox.com/communities/35468297/Indieun-x-zv-u",
    icon: "roblox",
    color: "#000000",
  },
  {
    name: "Twitter",
    url: "https://twitter.com/@indieun",
    icon: "twitter",
    color: "#1DA1F2",
  },
];

export function SocialLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
      {socialLinks.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-follow group relative flex h-16 w-16 items-center justify-center md:h-20 md:w-20"
          aria-label={social.name}
          style={{
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        >
          {/* Icon - white by default, colored on hover */}
          <div 
            className="transition-transform duration-300 group-hover:scale-110"
            style={{
              color: "white",
              transition: "color 0.3s ease, transform 0.3s ease",
            }}
          >
            {getSocialIcon(social.icon)}
          </div>
        </a>
      ))}
    </div>
  );
}

/**
 * Returns the appropriate SVG icon for each social platform
 * Icons use currentColor so they inherit the text color
 */
function getSocialIcon(platform: string): React.ReactNode {
  const iconClass = "h-8 w-8 md:h-10 md:w-10";

  switch (platform) {
    case "discord":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 4.18 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      );

    case "youtube":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );

    case "roblox":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.485 21.093h-.062c-2.563 0-4.423-1.356-4.423-4.061V7.042c0-2.708 1.86-4.063 4.423-4.063h.062c2.02 0 3.49.638 4.423 1.913.933-1.275 2.402-1.913 4.423-1.913h.062c2.563 0 4.423 1.355 4.423 4.063v9.99c0 2.705-1.86 4.061-4.423 4.061h-.062c-2.02 0-3.49-.637-4.423-1.912-.933 1.275-2.403 1.912-4.423 1.912h-.062zm7.828-13.515c0-1.477-1.02-2.215-2.415-2.215h-2.815c-1.395 0-2.415.738-2.415 2.215v7.163c0 1.477 1.02 2.215 2.415 2.215h2.815c1.395 0 2.415-.738 2.415-2.215v-7.163zm-2.415 1.478v5.685h-1.2v-5.685h1.2zm-1.2 7.63c-.69 0-1.2-.368-1.2-.982s.51-.983 1.2-.983c.69 0 1.2.368 1.2.983s-.51.982-1.2.982zm4.815-1.478v-5.685h-1.2v5.685h1.2zm-1.2 1.478c-.69 0-1.2-.368-1.2-.982s.51-.983 1.2-.983c.69 0 1.2.368 1.2.983s-.51.982-1.2.982z" />
        </svg>
      );

    case "twitter":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );

    default:
      return null;
  }
}

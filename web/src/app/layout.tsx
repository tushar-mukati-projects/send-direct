import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SendDirect — browser-to-browser file transfer",
  description:
    "Move files browser-to-browser over an encrypted WebRTC channel. No upload, no cloud, nothing stored on a server.",
};

export const viewport: Viewport = {
  themeColor: "#06080a",
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html lang="en" className={`${spaceGrotesk.variable} ${plexMono.variable}`}>
    <body>
      {children}
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(16,21,27,.96)",
            border: "1px solid rgba(255,255,255,.1)",
            color: "#e6edf2",
            fontFamily: "var(--font-plex-mono), monospace",
            fontSize: "12px",
          },
        }}
      />
    </body>
  </html>
);

export default RootLayout;

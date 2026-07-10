interface SiteConfig {
  /** Framer project publish URL */
  framerUrl: string;
  /** Production domain — no trailing slash */
  domain: string;
  /** Site name appended to every page title: "Page | {name}" */
  name: string;
}

const siteConfig: SiteConfig = {
  framerUrl: "https://genuine-directions-237390.framer.app",
  domain: "https://lionashelest.com",
  name: "Liona Shelest",
};

export default siteConfig;

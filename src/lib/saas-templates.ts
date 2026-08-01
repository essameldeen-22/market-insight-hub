// Industry starter templates for the SaaS Audit module — a realistic
// starting stack per industry, offered when the user has no data yet.

import type { SaasTool } from "@/lib/persistence.functions";

export type TemplateKey = "tech" | "ecommerce" | "hospitality";

interface TemplateTool {
  name: string;
  category: string;
  cost: number;
  users: number;
  usage: number;
}

export interface StarterTemplate {
  key: TemplateKey;
  icon: string;
  label: { en: string; ar: string };
  desc: { en: string; ar: string };
  tools: TemplateTool[];
}

export const SAAS_TEMPLATES: StarterTemplate[] = [
  {
    key: "tech",
    icon: "🧑‍💻",
    label: { en: "SaaS / Tech company", ar: "شركة SaaS / تقنية" },
    desc: { en: "Product, engineering and design stack", ar: "أدوات المنتج والهندسة والتصميم" },
    tools: [
      { name: "Slack", category: "Communication", cost: 8, users: 20, usage: 90 },
      { name: "Notion", category: "Project Management", cost: 10, users: 20, usage: 65 },
      { name: "Figma", category: "Design", cost: 15, users: 6, usage: 80 },
      { name: "GitHub", category: "Development", cost: 21, users: 12, usage: 95 },
      { name: "Jira", category: "Project Management", cost: 8, users: 15, usage: 55 },
      { name: "Zoom", category: "Communication", cost: 16, users: 10, usage: 40 },
      { name: "Mixpanel", category: "Analytics", cost: 25, users: 4, usage: 50 },
    ],
  },
  {
    key: "ecommerce",
    icon: "🛒",
    label: { en: "E-commerce store", ar: "متجر إلكتروني" },
    desc: { en: "Marketing, support and analytics stack", ar: "أدوات التسويق والدعم والتحليلات" },
    tools: [
      { name: "Mailchimp", category: "Marketing", cost: 60, users: 3, usage: 70 },
      { name: "Klaviyo", category: "Marketing", cost: 45, users: 3, usage: 60 },
      { name: "Zendesk", category: "Support", cost: 55, users: 6, usage: 75 },
      { name: "Google Analytics", category: "Analytics", cost: 0, users: 4, usage: 85 },
      { name: "Hotjar", category: "Analytics", cost: 39, users: 2, usage: 35 },
      { name: "Canva", category: "Design", cost: 13, users: 5, usage: 60 },
      { name: "Dropbox", category: "Storage", cost: 18, users: 8, usage: 45 },
    ],
  },
  {
    key: "hospitality",
    icon: "🍽️",
    label: { en: "Restaurant / Hospitality", ar: "مطعم / ضيافة" },
    desc: { en: "Operations, scheduling and guest comms", ar: "أدوات التشغيل والجدولة والتواصل مع الضيوف" },
    tools: [
      { name: "Slack", category: "Communication", cost: 8, users: 12, usage: 55 },
      { name: "Trello", category: "Project Management", cost: 6, users: 10, usage: 40 },
      { name: "Mailchimp", category: "Marketing", cost: 35, users: 2, usage: 50 },
      { name: "Calendly", category: "Other", cost: 12, users: 4, usage: 45 },
      { name: "Google Drive", category: "Storage", cost: 12, users: 15, usage: 70 },
      { name: "Freshdesk", category: "Support", cost: 18, users: 4, usage: 40 },
    ],
  },
];

export function templateTools(key: TemplateKey): SaasTool[] {
  const tpl = SAAS_TEMPLATES.find((x) => x.key === key);
  if (!tpl) return [];
  return tpl.tools.map((tool) => ({ ...tool, id: crypto.randomUUID() }));
}

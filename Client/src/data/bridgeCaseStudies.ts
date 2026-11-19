const tanishqDigital = "/bridge-case-studies/tanishq-digital.jpg";
const wildcraftPrism = "/bridge-case-studies/wildcraft-prism.jpg";
const tanishqEmailers = "/bridge-case-studies/tanishq-personalized-customer-communication.png";
const tanishqSelfie = "/bridge-case-studies/tanishq-selfie.jpg";
const tanishqAppointment = "/bridge-case-studies/stores-new-ui-dsp.png";
const tanishqStoreListing = "/bridge-case-studies/tanishq-store-listing.jpg";
const storesNewUi = "/bridge-case-studies/stores-new-ui.png";
const titanEyePlus = "/bridge-case-studies/titan-eye-plus.jpg";
const miaVisibility = "/bridge-case-studies/mia-visibility.jpg";
const tanishqAiCommerce = "/bridge-case-studies/tanishq-ai-personalization-commerce.jpg";
const tanishqDiamondStorytellingFull = "/bridge-case-studies/tanishq-diamond-storytelling-full.png";
const tanishqPersonalizedFestiveEngagement = "/bridge-case-studies/tanishq-personalized-festive-engagement.png";

export type CaseStudyMeta = {
  client: string;
  industry: string;
  focusArea: string;
  duration: string;
};

export type ComparisonPair = {
  beforeTitle: string;
  afterTitle: string;
};

export type OutcomeCard = {
  title: string;
  description: string;
};

export type CaseStudyStat = {
  value: string;
  suffix?: string;
  label: string;
};

export type CaseStudy = {
  slug: string;
  title: string;
  intro: string;
  date: string;
  thumbnail: string;
  heroImage: string;
  meta: CaseStudyMeta;
  stats?: CaseStudyStat[];
  sectionTitle?: string;
  challenge?: string;
  comparisons?: ComparisonPair[];
  transformationTitle?: string;
  outcomes?: OutcomeCard[];
  quote?: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "tanishq-digital-experience",
    title:
      "Tanishq: Transforming Heritage Luxury Into a Personalised Digital Experience",
    intro:
      "Tanishq has built strong brand trust through craftsmanship, heritage, and emotional storytelling. However, as luxury consumers become increasingly digital-first, jewellery discovery is shifting from traditional browsing to personalised experiences.",
    date: "January 2026",
    thumbnail: tanishqDigital,
    heroImage: tanishqDigital,
    meta: {
      client: "Tanishq",
      industry: "Luxury Jewellery",
      focusArea: "Brand recall, Digital experience, Marketing performance",
      duration: "2 Months",
    },
    stats: [
      { value: "3.1", suffix: "x", label: "Revenue growth in 6 months" },
      { value: "34", suffix: "%", label: "Close rate improvement" },
    ],
    sectionTitle: "From tradition to meaningful connections",
    challenge:
      "The brand was not losing customers because of product relevance. It was losing them because the experience and communication were not creating an emotional connect with modern customers.",
    comparisons: [
      {
        beforeTitle: "Product focused communication",
        afterTitle: "Emotion led story telling",
      },
      {
        beforeTitle: "Generic browsing experience",
        afterTitle: "AI-guided discovery experience",
      },
      {
        beforeTitle: "Standard campaign creatives",
        afterTitle: "Personalised campaign system",
      },
    ],
    transformationTitle: "AI driven transformations",
    outcomes: [
      {
        title: "Brand communication and strategy",
        description:
          "Shifted from product led messaging to emotion led storytelling.",
      },
      {
        title: "Campaign design systems",
        description:
          "Created new visual language, storytelling frameworks and personalised campaign strategies.",
      },
    ],
    quote:
      "The brand was not losing customers because of product relevance. It was losing them because the experience and communication were not creating an emotional connect with modern customers.",
  },
  {
    slug: "wildcraft-prism-marketing",
    title: "Wildcraft's Journey to Smarter Audience Growth",
    intro:
      "Wildcraft partnered with Prism to gain deeper visibility into marketing performance, uncover growth opportunities, and optimize campaign reach across digital channels. By leveraging AI-powered marketing intelligence, the brand identified untapped audiences and improved overall campaign effectiveness.",
    date: "December 2025",
    thumbnail: wildcraftPrism,
    heroImage: wildcraftPrism,
    meta: {
      client: "Wildcraft",
      industry: "Apparel & Fashion",
      focusArea: "Brand recall, Digital experience, Marketing performance",
      duration: "2 Months",
    },
    stats: [
      { value: "3.1", suffix: "x", label: "Revenue growth in 6 months" },
      { value: "34", suffix: "%", label: "Close rate improvement" },
    ],

    transformationTitle: "Key actions taken",
    outcomes: [
      {
        title: "Unified performance dashboard",
        description:
          "Integrated campaign data from all channels into a single dashboard, providing a comprehensive view of marketing performance.",
      },
      {
        title: "Audience intelligence",
        description:
          "Identified high-potential audience segments with stronger engagement and purchase intent.",
      },
      {
        title: "Optimization recommendations",
        description:
          "Delivered clear, data-backed recommendations to optimize targeting, budget allocation, and creative performance.",
      },
    ],
    quote:
      "The brand was not losing customers because of product relevance. It was losing them because the experience and communication were not creating an emotional connect with modern customers.",
  },
  {
    slug: "tanishq-custom-emailers",
    title: "Tanishq's Journey to Personalized Customer Communication",
    intro:
      "Tanishq sought to create meaningful and timely customer interactions that extended beyond the store experience. Dechub developed custom-designed emailers tailored to campaigns, occasions, and customer journeys — reflecting the brand's premium identity while driving engagement and conversions.",
    date: "November 2025",
    thumbnail: tanishqEmailers,
    heroImage: tanishqEmailers,
    meta: {
      client: "Tanishq",
      industry: "Luxury Jewellery & Retail",
      focusArea: "Customer Engagement & Lifecycle Marketing",
      duration: "Ongoing",
    },
    sectionTitle: "The challenge",
    challenge:
      "The challenge wasn't sending emails — it was creating communications that felt personal, reflected Tanishq's luxury identity, and encouraged customers to engage with the brand.",
    transformationTitle: "AI driven transformations",
    outcomes: [
      {
        title: "Brand communication and strategy",
        description:
          "Shifted from product led messaging to emotion led storytelling.",
      },
      {
        title: "Campaign design systems",
        description:
          "Created new visual language, storytelling frameworks and personalised campaign strategies.",
      },
    ],
    quote:
      "The brand was not losing customers because of product relevance. It was losing them because the experience and communication were not creating an emotional connect with modern customers.",
  },
  {
    slug: "tanishq-selfie-creator",
    title: "Tanishq's Journey to Luxury Digital Storytelling",
    intro:
      "Tanishq sought to transform festive campaigns into interactive experiences that encouraged customer participation and strengthened brand connections. Dechub developed the Selfie Creator platform, enabling customers to create personalized, branded selfies through customized frames and messages.",
    date: "October 2025",
    thumbnail: tanishqDiamondStorytellingFull,
    heroImage: tanishqSelfie,
    meta: {
      client: "Tanishq",
      industry: "Luxury Jewellery",
      focusArea: "Customer Engagement & Experiential Marketing",
      duration: "2 Months",
    },
    stats: [
      { value: "3.1", suffix: "x", label: "Revenue growth in 6 months" },
      { value: "34", suffix: "%", label: "Close rate improvement" },
    ],
    sectionTitle: "From passive campaigns to interactive celebrations",
    challenge:
      "The challenge wasn't creating festive campaigns — it was finding a way to make customers actively participate in them. Traditional communication methods offered limited interaction and fewer opportunities for personalized engagement.",
    transformationTitle: "AI driven transformations",
    outcomes: [
      {
        title: "Personalized Festival Experiences",
        description:
          "Customized frames and messages create unique moments for every customer.",
      },
      {
        title: "Interactive Brand Engagement",
        description:
          "Transforms customers from passive viewers into active participants.",
      },
      {
        title: "Lead Generation Through Experience",
        description:
          "Collects valuable customer information through an engaging and enjoyable journey.",
      },
    ],
    quote:
      "The brand was not losing customers because of product relevance. It was losing them because the experience and communication were not creating an emotional connect with modern customers.",
  },
  {
    slug: "tanishq-appointment-booking",
    title: "Tanishq's Journey to Seamless Appointment Booking",
    intro:
      "Tanishq wanted to simplify the process of scheduling in-store consultations while creating a more personalized customer journey. Dechub developed a user-friendly Appointment Booking Web App that allows customers to effortlessly book appointments based on their preferred date and time while enabling the brand to capture valuable customer insights.",
    date: "September 2025",
    thumbnail: tanishqAppointment,
    heroImage: tanishqAppointment,
    meta: {
      client: "Tanishq",
      industry: "Luxury Jewellery",
      focusArea: "Customer Experience & Appointment Management",
      duration: "3 Months",
    },
    sectionTitle: "The challenge",
    challenge:
      "Customers needed a seamless way to schedule consultations without friction, while the brand needed to capture valuable customer insights at every touchpoint.",
    transformationTitle: "Key actions taken",
    outcomes: [
      {
        title: "Intuitive Appointment Scheduling",
        description:
          "Customers can book consultations in minutes with a clear, guided flow.",
      },
      {
        title: "Personalized customer journeys",
        description:
          "Appointment data enables tailored follow-ups and in-store experiences.",
      },
      {
        title: "Operational visibility",
        description:
          "Store teams gain structured insights into customer preferences and demand patterns.",
      },
    ],
    quote:
      "The brand was not losing customers because of product relevance. It was losing them because the experience and communication were not creating an emotional connect with modern customers.",
  },
  {
    slug: "tanishq-store-listing",
    title: "Tanishq's Journey to Smarter Store Discovery",
    intro:
      "Tanishq sought to make store discovery simpler and more intuitive for customers while strengthening its digital presence across multiple locations. Dechub developed a scalable Store Listing and Tracking Platform that enables customers to easily find nearby stores and access detailed information before visiting.",
    date: "August 2025",
    thumbnail: storesNewUi,
    heroImage: tanishqStoreListing,
    meta: {
      client: "Tanishq & Mia by Tanishq",
      industry: "Luxury Jewellery & Retail",
      focusArea: "Customer Experience & Store Discovery",
      duration: "4 Months",
    },
    sectionTitle: "The challenge",
    challenge:
      "With hundreds of stores nationwide, customers struggled to find the right boutique quickly — and the brand lacked unified visibility into how discovery translated to visits.",
    transformationTitle: "Key actions taken",
    outcomes: [
      {
        title: "Intelligent Store Discovery",
        description:
          "Customers find the nearest boutique with accurate location data and rich store details.",
      },
      {
        title: "AI-driven purchase guidance",
        description:
          "AI-driven purchase tips and FAQs guide customers throughout their journey.",
      },
      {
        title: "Data-Driven Store Management",
        description:
          "Centralized tracking helps teams monitor performance and optimize local presence.",
      },
    ],
    quote:
      "The brand was not losing customers because of product relevance. It was losing them because the experience and communication were not creating an emotional connect with modern customers.",
  },
  {
    slug: "tanishq-blogging-platform",
    title: "Tanishq's Journey to Personalized Festive Engagement",
    intro:
      "Tanishq sought to create a content platform that went beyond traditional blogging by blending brand storytelling with product discovery. Dechub developed a sophisticated, SEO-optimized blogging platform that reflects Tanishq's premium aesthetic while enhancing content engagement and discoverability.",
    date: "July 2025",
    thumbnail: tanishqPersonalizedFestiveEngagement,
    heroImage: tanishqPersonalizedFestiveEngagement,
    meta: {
      client: "Tanishq & Mia by Tanishq",
      industry: "Luxury Jewellery & Retail",
      focusArea: "Content, SEO & Brand Storytelling",
      duration: "3 Months",
    },
    sectionTitle: "The challenge",
    challenge:
      "Luxury content needed to feel editorial and premium while still driving product discovery and measurable engagement across search and social channels.",
    transformationTitle: "Key actions taken",
    outcomes: [
      {
        title: "Luxury-focused interface",
        description:
          "A luxury-focused interface reflects Tanishq's brand identity and elevates storytelling.",
      },
      {
        title: "SEO-optimized architecture",
        description:
          "Structured content improves discoverability and long-term organic reach.",
      },
      {
        title: "Story-to-product journeys",
        description:
          "Editorial narratives connect naturally to product exploration and conversion paths.",
      },
    ],
    quote:
      "The brand was not losing customers because of product relevance. It was losing them because the experience and communication were not creating an emotional connect with modern customers.",
  },
  {
    slug: "titan-eye-plus",
    title: "Titan Eye+'s Journey to a Smarter Digital Experience",
    intro:
      "Titan Eye+ partnered with Dechub to create a seamless digital experience that simplified eyewear discovery while reinforcing the brand's commitment to style, precision, and eye care. Through a customer-first design approach, the platform delivered an intuitive shopping journey across devices.",
    date: "June 2025",
    thumbnail: titanEyePlus,
    heroImage: titanEyePlus,
    meta: {
      client: "Titan Eye+",
      industry: "Eyewear & Lifestyle",
      focusArea: "Digital experience, Product discovery",
      duration: "4 Months",
    },
    sectionTitle: "The challenge",
    challenge:
      "Eyewear shoppers needed faster, more confident product discovery — with recommendations that reflected individual style, prescription needs, and browsing behaviour.",
    transformationTitle: "Key actions taken",
    outcomes: [
      {
        title: "Personalized recommendations",
        description:
          "Shifted from one-size-fits-all interactions to AI-driven recommendations tailored to individual browsing behaviour and purchase intent.",
      },
      {
        title: "Smarter search and filtering",
        description:
          "Enhanced search, filtering, and product recommendations using AI insights, helping customers find the right eyewear faster.",
      },
    ],
    quote:
      "The brand was not losing customers because of product relevance. It was losing them because the experience and communication were not creating an emotional connect with modern customers.",
  },
  {
    slug: "mia-visibility-search",
    title: "MIA by Tanishq: Expanding Its Presence in a Digital-First World",
    intro:
      "How Visibility helped MIA by Tanishq increase search presence, local discoverability, and store visits using AI intelligence — strengthening brand visibility and customer engagement through AI-powered search intelligence.",
    date: "May 2025",
    thumbnail: miaVisibility,
    heroImage: miaVisibility,
    meta: {
      client: "Mia by Tanishq",
      industry: "Luxury Retail",
      focusArea: "Brand recall, Digital experience, Marketing performance",
      duration: "2 Months",
    },
    stats: [
      { value: "3.1", suffix: "x", label: "Revenue growth in 6 months" },
      { value: "34", suffix: "%", label: "Close rate improvement" },
    ],
    sectionTitle: "The challenge",
    challenge:
      "MIA by Tanishq faced inconsistent local visibility, fragmented SEO, and limited search insights, impacting discoverability and growth.",
    transformationTitle: "Key actions taken",
    outcomes: [
      {
        title: "Competitive Visibility Analysis",
        description:
          "Monitored competitors and uncovered ranking opportunities across key markets.",
      },
      {
        title: "Improved Google Business Profiles",
        description:
          "Standardized information, updated imagery, optimized categories and relevance signals.",
      },
      {
        title: "Optimized Store Location Page",
        description:
          "Enhanced pages with relevant content, schema markup and localized keywords.",
      },
    ],
    quote:
      "The brand was not losing customers because of product relevance. It was losing them because the experience and communication were not creating an emotional connect with modern customers.",
  },
  {
    slug: "tanishq-ai-commerce",
    title: "How Tanishq Scaled Personalization and Profits Across Digital Channels with AI",
    intro:
      "DECHUB partnered with Tanishq to transform its digital shopping experience using AI-powered search, personalized recommendations, and customer engagement automation — improving product discovery, increasing conversions, and boosting online revenue.",
    date: "April 2025",
    thumbnail: tanishqAiCommerce,
    heroImage: tanishqAiCommerce,
    meta: {
      client: "Tanishq",
      industry: "Luxury Jewellery",
      focusArea: "AI Search, Personalization, Digital Commerce",
      duration: "5 Months",
    },
    sectionTitle: "The challenge",
    challenge:
      "Despite its strong brand presence, Tanishq faced digital commerce challenges — traditional keyword search made product discovery difficult, generic recommendations reduced personalization, and inconsistent cross-channel experiences led to higher cart abandonment.",
    transformationTitle: "Key actions taken",
    outcomes: [
      {
        title: "AI Search & Intent Understanding",
        description:
          "Smarter search understands customer intent and surfaces the most relevant products faster.",
      },
      {
        title: "Personalized recommendations",
        description:
          "Tailored product suggestions based on browsing behaviour, preferences, and purchase history.",
      },
      {
        title: "AI-powered engagement workflows",
        description:
          "AI-powered customer engagement workflows delivered personalized messages across the journey.",
      },
    ],
    quote:
      "The brand was not losing customers because of product relevance. It was losing them because the experience and communication were not creating an emotional connect with modern customers.",
  },
];

export function getCaseStudyBySlug(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}

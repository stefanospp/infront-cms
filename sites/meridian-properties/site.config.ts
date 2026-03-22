import type { SiteConfig } from '@agency/config';

const config: SiteConfig = {
  name: "Meridian Properties",
  tagline: "Luxury Real Estate in Limassol, Cyprus",
  url: "https://meridianproperties.cy",
  locale: 'en-GB',

  contact: {
      "email": "info@meridianproperties.cy",
      "phone": "+357 25 123 456",
      "address": {
          "street": "28th October Avenue 120",
          "city": "Limassol",
          "postcode": "3035",
          "country": "Cyprus"
      }
  },

  seo: {
      "defaultTitle": "Meridian Properties — Luxury Real Estate in Limassol",
      "titleTemplate": "%s | Meridian Properties",
      "defaultDescription": "Discover luxury properties in Limassol, Cyprus. Meridian Properties offers premium villas, apartments, and penthouses along the Mediterranean coast.",
      "defaultOgImage": "/og-default.jpg"
  },

  nav: {
      "items": [
          {
              "label": "Properties",
              "href": "/properties"
          },
          {
              "label": "About",
              "href": "/about"
          },
          {
              "label": "Team",
              "href": "/team"
          },
          {
              "label": "Contact",
              "href": "/contact"
          }
      ],
      "cta": {
          "label": "Schedule Viewing",
          "href": "/contact"
      }
  },

  footer: {
      "columns": [
          {
              "title": "Quick Links",
              "links": [
                  {
                      "label": "Properties",
                      "href": "/properties"
                  },
                  {
                      "label": "About Us",
                      "href": "/about"
                  },
                  {
                      "label": "Our Team",
                      "href": "/team"
                  },
                  {
                      "label": "Contact",
                      "href": "/contact"
                  }
              ]
          },
          {
              "title": "Property Types",
              "links": [
                  {
                      "label": "Luxury Villas",
                      "href": "/properties"
                  },
                  {
                      "label": "Penthouses",
                      "href": "/properties"
                  },
                  {
                      "label": "Beachfront",
                      "href": "/properties"
                  },
                  {
                      "label": "New Developments",
                      "href": "/properties"
                  }
              ]
          }
      ],
      "legalLinks": [
          { "label": "Privacy Policy", "href": "/privacy" },
          { "label": "Terms of Service", "href": "/terms" }
      ],
      "text": "\u00a9 2026 Meridian Properties. All rights reserved."
  },

  cms: {
    url: "https://cms.meridianproperties.cy",
  },

  theme: {
      "navStyle": "fixed",
      "footerStyle": "multi-column",
      "heroDefault": "split",
      "borderStyle": "rounded"
  },
};

export default config;

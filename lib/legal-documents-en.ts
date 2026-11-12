import {
  DINGRY_BRAND_NAME,
  DINGRY_COMPANY,
  DINGRY_CONTACT_EMAIL,
  DINGRY_CONTACT_PHONE,
  DINGRY_SITE_DOMAIN,
} from "@/lib/dingry-legal";
import type { LegalDocumentBundle } from "./legal-documents-types";

const vendorBlockEn = `${DINGRY_COMPANY.legalName}, ${DINGRY_COMPANY.legalForm}, share capital €${DINGRY_COMPANY.shareCapitalEur}, registered under SIREN ${DINGRY_COMPANY.siren} (${DINGRY_COMPANY.rcs}), registered office ${DINGRY_COMPANY.registeredOffice}, operates the ${DINGRY_BRAND_NAME} brand on ${DINGRY_SITE_DOMAIN}.`;

/** English legal copy (informational translation of French policies). */
export const EN_LEGAL_DOCUMENTS: LegalDocumentBundle = {
  mentions: {
    title: "Legal notice",
    subtitle: "DINGRY — dingry.fr",
    sections: [
      {
        heading: "1. Site publisher",
        body: `${vendorBlockEn} Contact: ${DINGRY_CONTACT_EMAIL} — ${DINGRY_CONTACT_PHONE}.`,
      },
      {
        heading: "2. Publication director",
        body:
          "The publication director is the President of RTS MUSIC (full name to be completed from the Kbis extract).",
      },
      {
        heading: "3. Hosting",
        body: "The site is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA (vercel.com).",
      },
      {
        heading: "4. Intellectual property",
        body:
          "All site elements (text, visuals, DINGRY logo, layout) are protected. Unauthorized reproduction is prohibited.",
      },
      {
        heading: "5. Personal data",
        body: `See the privacy policy (GDPR). Access and rectification: ${DINGRY_CONTACT_EMAIL}.`,
      },
    ],
  },
  cgv: {
    title: "Terms and conditions of sale",
    subtitle: "DINGRY — dingry.fr · Last updated: 06/11/2026",
    sections: [
      {
        heading: "1. Purpose",
        body:
          "These Terms and Conditions of Sale govern clothing and accessories sold by DINGRY on dingry.fr. Placing an order implies full acceptance of these terms.",
      },
      {
        heading: "2. Products and prices",
        body:
          "DINGRY offers streetwear items, often in limited runs. Products are shown with essential characteristics and visuals. Slight colour differences may occur on screen. Prices are in euros, incl. VAT, excluding shipping unless stated before checkout. DINGRY may change prices at any time; the price at order time applies.",
      },
      {
        heading: "3. Order and payment",
        body:
          "Orders are placed on dingry.fr. Payment is due immediately via PayPal (PayPal account or card when offered by PayPal). The order is final after payment confirmation and confirmation email. Stocks may be limited; orders cannot exceed available quantities.",
      },
      {
        heading: "4. Delivery",
        body: `Orders ship to the address provided at purchase. Estimated delivery is usually 3–7 business days in metropolitan France unless otherwise stated. Shipping is paid by the customer per destination and carrier, shown before final validation (see shipping fee policy). For delay, loss, or damage, contact DINGRY at ${DINGRY_CONTACT_EMAIL}. Transport risk transfers when the customer or their appointee takes possession of the parcel.`,
      },
      {
        heading: "5. Right of withdrawal and returns",
        body: `Under EU consumer law, you have 14 days from receipt to withdraw without giving a reason. Notify DINGRY at ${DINGRY_CONTACT_EMAIL} or use the on-site withdrawal flow. Items must be resaleable, unworn and unwashed beyond trying on. Return shipping is customer-paid unless defective goods or DINGRY error. Refunds follow legal time limits via the original payment method. Sale or limited items remain subject to statutory withdrawal rights.`,
      },
      {
        heading: "6. Legal guarantees",
        body:
          "Products benefit from applicable legal guarantees, including conformity (French Consumer Code) and hidden defects (French Civil Code), regardless of any commercial warranty.",
      },
      {
        heading: "7. Liability",
        body:
          "DINGRY is not liable for misuse or improper care by the customer. This does not limit statutory consumer rights.",
      },
      {
        heading: "8. Customer service and disputes",
        body: `Questions or claims: ${DINGRY_CONTACT_EMAIL}. Amicable resolution first; otherwise free consumer mediation (details on site). These terms are governed by French law; mandatory consumer protections apply. DINGRY — Pieces, not compromises.`,
      },
    ],
  },
  rgpd: {
    title: "Privacy policy",
    subtitle: "DINGRY — dingry.fr · Last updated: 06/11/2026",
    sections: [
      {
        heading: "1. Introduction",
        body:
          "DINGRY protects customers' and visitors' personal data. This policy explains what we collect on dingry.fr, why, and your GDPR rights.",
      },
      {
        heading: "2. Data collected",
        body:
          "When browsing or ordering we may collect: name; postal and email address; data needed to process and deliver orders; order history and support exchanges; technical browsing data including cookies. Card details are not stored by DINGRY when PayPal processes payment.",
      },
      {
        heading: "3. Use of data",
        body:
          "Data is used only to: process and ship orders; handle payments and refunds; respond to requests; improve the site; send marketing when legally permitted.",
      },
      {
        heading: "4. Sharing",
        body:
          "Data is not sold or rented. It may be shared with providers needed to operate: PayPal (payments), carriers (delivery), hosting and technical providers. They only access data required for their tasks.",
      },
      {
        heading: "5. Retention",
        body:
          "Data is kept for limited periods aligned with use and legal obligations. Order and billing data may be archived per legal requirements. Marketing data follows regulatory retention.",
      },
      {
        heading: "6. Cookies",
        body:
          "dingry.fr uses necessary cookies and, with consent, analytics or experience cookies. You may accept, refuse, or customise non-essential cookies via the site banner.",
      },
      {
        heading: "7. Your rights",
        body: `Under GDPR you have access, rectification, erasure (within legal limits), objection, restriction, and portability where applicable. Contact ${DINGRY_CONTACT_EMAIL}. You may complain to the CNIL: www.cnil.fr.`,
      },
      {
        heading: "8. Security",
        body:
          "DINGRY implements appropriate technical and organisational measures against unauthorised access, loss, or disclosure.",
      },
      {
        heading: "9. Changes",
        body:
          "DINGRY may update this policy for legal or technical changes. The current version is published on dingry.fr. DINGRY — dingry.fr. Pieces, not compromises.",
      },
    ],
  },
  retours: {
    title: "Returns and refunds policy",
    subtitle: `DINGRY — ${DINGRY_SITE_DOMAIN} · Last updated: 05/11/2026`,
    sections: [
      {
        heading: "1. Our policy",
        body:
          "We want you to be satisfied. If an item does not suit you, you may request a return under the conditions below.",
      },
      {
        heading: "2. Right of withdrawal — 14 days",
        body: `Under French law you have 14 calendar days from receipt to withdraw without justification, including sale and limited-edition items. Contact ${DINGRY_CONTACT_EMAIL} with your order number and items concerned.`,
      },
      {
        heading: "3. Return conditions",
        body:
          "Items must be resaleable, unworn, unwashed, not damaged beyond trying on. Original tags and packaging should be kept where possible. Excessive handling may reduce the refund per applicable rules.",
      },
      {
        heading: "4. Return shipping",
        body:
          "Unless stated otherwise, return shipping for withdrawal is customer-paid if disclosed before purchase. Defective, non-conforming, or wrongly shipped items: DINGRY covers return shipping.",
      },
      {
        heading: "5. Refunds",
        body:
          "After validation, refunds are issued within 14 days maximum. DINGRY may defer until goods are received or proof of shipment. Refund uses the original payment method unless agreed otherwise. Standard initial shipping is refunded on full withdrawal.",
      },
      {
        heading: "6. Defective or wrong items",
        body: `Contact ${DINGRY_CONTACT_EMAIL} quickly with order number and photos if possible. DINGRY will offer replacement, refund, or other remedy under legal guarantees. Return shipping is covered when the issue is DINGRY's responsibility.`,
      },
      {
        heading: "7. Non-returnable items",
        body:
          "Custom or made-to-order items may be excluded from withdrawal where law allows. Limited editions, sales, and special drops remain subject to statutory withdrawal and guarantee rights.",
      },
      {
        heading: "8. Contact",
        body: `Returns and refunds: ${DINGRY_CONTACT_EMAIL} · ${DINGRY_SITE_DOMAIN}. We aim to handle each request promptly. DINGRY — Pieces, not compromises.`,
      },
    ],
  },
  expedition: {
    title: "Delivery policy",
    subtitle: `DINGRY — ${DINGRY_SITE_DOMAIN} · Last updated: 12 November 2026`,
    sections: [
      {
        heading: "1. Scope",
        body:
          "This policy describes how DINGRY orders are shipped and received. It complements the Terms of Sale. Shipping fees are set out in the Shipping fees policy.",
      },
      {
        heading: "2. Service areas",
        body:
          "Orders ship to destinations available at checkout (metropolitan France, EU, and international where carriers allow). If a destination is not served, checkout cannot complete for that address.",
      },
      {
        heading: "3. Dispatch times",
        body:
          "After payment confirmation, orders are usually processed within 2–5 business days, excluding busy launch periods. Transit times apply in addition (typically 3–7 business days in metropolitan France depending on the option chosen). Displayed times are estimates.",
      },
      {
        heading: "4. Tracking and receipt",
        body:
          "When available, tracking is sent by email after dispatch. Check your parcel on delivery and report damage or missing items within 48 hours to DINGRY, with photos if possible.",
      },
      {
        heading: "5. Delay, loss, or damage",
        body: `For significant delay, loss, or damage, contact ${DINGRY_CONTACT_EMAIL} with your order number. DINGRY works with the carrier within applicable legal and contractual limits.`,
      },
      {
        heading: "6. Contact",
        body: `Delivery questions: ${DINGRY_CONTACT_EMAIL} · ${DINGRY_SITE_DOMAIN}.`,
      },
    ],
  },
  livraison: {
    title: "Shipping fees policy",
    subtitle: "DINGRY Paris — dingry.fr · Last updated: 10 November 2026",
    sections: [
      {
        heading: "1. General principles",
        body:
          "DINGRY offers shipping options by destination, price, and carrier availability. Shipping is paid by the customer and added to item prices. Free shipping is not systematic unless a specific promotion states otherwise.",
      },
      {
        heading: "2. Methods and carriers",
        body:
          "At checkout you see options for your destination. When several carriers or methods exist, you can compare fees and choose. Options may include home delivery or pickup points. Availability depends on destination and services at order time.",
      },
      {
        heading: "3. Calculation and display",
        body:
          "Fees depend on shipping solutions for the address entered. Each option's amount is shown before final validation. Fees are added to products in the order summary. No extra shipping charge after validation without your agreement.",
      },
      {
        heading: "4. Geographic zones",
        body:
          "DINGRY aims to ship to metropolitan France, served European countries, and other international destinations where possible. Options and rates vary by country. If no solution exists for a destination, the order cannot be completed there.",
      },
      {
        heading: "5. No automatic free shipping",
        body:
          "Shipping remains customer-paid regardless of order amount. DINGRY may occasionally run promotional free-or-reduced shipping; terms will be stated on site.",
      },
      {
        heading: "6. Fee changes",
        body:
          "DINGRY may update fees following carrier changes. The fee at validation applies; later changes do not affect confirmed orders.",
      },
      {
        heading: "7. Further information",
        body: `Dispatch, lead times, tracking, and receipt are detailed in the Delivery section of the Terms of Sale. Questions: ${DINGRY_CONTACT_EMAIL}. DINGRY — Pieces, not compromises.`,
      },
    ],
  },
};

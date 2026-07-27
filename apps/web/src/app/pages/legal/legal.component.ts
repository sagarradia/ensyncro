import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface LegalSection {
  heading: string;
  paragraphs: string[];
}
interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

/**
 * Privacy Policy and Terms of Service. One component renders either document,
 * selected by the route's `doc` data. The copy is standard SaaS/marketplace
 * boilerplate — a starting point, not legal advice (see the banner at the top).
 */
@Component({
  selector: 'app-legal',
  standalone: true,
  template: `
    @if (doc(); as d) {
      <section class="discover legal">
        <p class="alert info" data-testid="legal-disclaimer">
          <strong>Placeholder legal content.</strong> This document is standard boilerplate provided
          as a starting point and has not been reviewed by a lawyer. It should be reviewed and adapted
          by qualified legal counsel before any real users rely on it.
        </p>

        <h1 data-testid="legal-title">{{ d.title }}</h1>
        <p class="muted">Last updated: {{ d.updated }}</p>
        <p>{{ d.intro }}</p>

        @for (s of d.sections; track s.heading) {
          <h2>{{ s.heading }}</h2>
          @for (p of s.paragraphs; track p) {
            <p>{{ p }}</p>
          }
        }
      </section>
    }
  `,
  styles: [
    `
      .legal { max-width: 760px; }
      .legal h2 { margin-top: 1.75rem; font-size: 1.15rem; color: var(--color-text-primary); }
      .legal p { line-height: 1.7; color: var(--color-text-primary); }
    `,
  ],
})
export class LegalComponent {
  private readonly route = inject(ActivatedRoute);
  readonly doc = signal<LegalDoc | null>(null);

  constructor() {
    const which = this.route.snapshot.data['doc'] as 'privacy' | 'terms';
    this.doc.set(which === 'terms' ? TERMS : PRIVACY);
  }
}

const COMPANY = 'Ensyncro';

const PRIVACY: LegalDoc = {
  title: 'Privacy Policy',
  updated: '27 July 2026',
  intro:
    `This Privacy Policy explains how ${COMPANY} ("we", "us") collects, uses, shares and protects ` +
    'information about you when you use our funding-marketplace platform and website (the "Platform").',
  sections: [
    {
      heading: '1. Information we collect',
      paragraphs: [
        'Account information you provide when you register — such as your name, email address, mobile number, role (founder or investor) and password credentials.',
        'Profile and business information you choose to add — company details, financials, documents you upload to your data room, and any other content you submit.',
        'Usage information generated as you use the Platform — log data, device and browser information, and records of actions such as profile views, intro requests and document access.',
      ],
    },
    {
      heading: '2. How we use your information',
      paragraphs: [
        'To operate the Platform: create and maintain your account, present your profile to the counterparties you choose to engage, facilitate introductions and deal tracking, and generate documents (such as teasers and information memoranda) from information you provide.',
        'To secure the Platform: authenticate users, detect and prevent fraud or abuse, and maintain audit logs of access to gated information.',
        'To communicate with you about your account, security, and service updates.',
      ],
    },
    {
      heading: '3. How information is shared',
      paragraphs: [
        'With other users only as you direct: your public profile is visible to signed-in members, while gated commercial information (such as financials, cap tables and data-room documents) is disclosed only to counterparties you explicitly grant access to. Every such access is recorded.',
        'With service providers who process data on our behalf (for example hosting, database and file-storage providers) under appropriate confidentiality and data-protection obligations.',
        'Where required by law, regulation, legal process or enforceable governmental request, or to protect the rights, property or safety of ' + COMPANY + ', our users or others.',
        'We do not sell your personal information.',
      ],
    },
    {
      heading: '4. Data retention and security',
      paragraphs: [
        'We retain personal information for as long as your account is active and as needed to provide the Platform, comply with our legal obligations, resolve disputes and enforce our agreements.',
        'We use technical and organisational measures designed to protect your information, including encryption in transit, access controls and audit logging. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
      ],
    },
    {
      heading: '5. Your choices and rights',
      paragraphs: [
        'You may access and update much of your information directly in the Platform, and you may request deletion of your account. Depending on your location, you may have additional rights over your personal data, such as rights to access, correct, port or restrict processing.',
        'To exercise any of these rights, contact us using the details below. We may need to verify your identity before acting on a request.',
      ],
    },
    {
      heading: '6. International transfers',
      paragraphs: [
        'We and our service providers may process and store information in countries other than your own. Where we transfer personal data across borders, we take steps designed to ensure it receives an appropriate level of protection.',
      ],
    },
    {
      heading: '7. Changes and contact',
      paragraphs: [
        'We may update this Policy from time to time; material changes will be notified through the Platform. Continued use after an update constitutes acceptance of the revised Policy.',
        'Questions about this Policy can be directed to your ' + COMPANY + ' contact.',
      ],
    },
  ],
};

const TERMS: LegalDoc = {
  title: 'Terms of Service',
  updated: '27 July 2026',
  intro:
    `These Terms of Service ("Terms") govern your access to and use of the ${COMPANY} funding-marketplace ` +
    'platform (the "Platform"). By creating an account or using the Platform, you agree to these Terms.',
  sections: [
    {
      heading: '1. What Ensyncro is — and is not',
      paragraphs: [
        COMPANY + ' is a marketplace that helps founders and investors discover one another, share information and manage engagements. We are a neutral venue and technology provider.',
        'We are not a broker-dealer, investment adviser, underwriter, or a party to any transaction between users. Nothing on the Platform is an offer or solicitation to buy or sell any security, or investment, legal, tax or financial advice.',
        'We do not guarantee that any founder will raise capital, that any investor will find or complete an investment, or any particular outcome, timeline or valuation. Introductions and matches are informational only.',
      ],
    },
    {
      heading: '2. Eligibility and accounts',
      paragraphs: [
        'You must be able to form a legally binding contract to use the Platform, and you must provide accurate registration information and keep it up to date.',
        'You are responsible for safeguarding your account credentials and for all activity that occurs under your account. Notify us promptly of any unauthorised use.',
      ],
    },
    {
      heading: '3. User responsibilities and conduct',
      paragraphs: [
        'You are solely responsible for the content and information you submit, and you represent that you have the right to share it and that it is accurate and not misleading.',
        'You agree to conduct your own due diligence before entering into any transaction, and to comply with all applicable laws and regulations, including securities, anti-money-laundering and data-protection laws.',
        'You must not misuse the Platform — including by impersonating others, scraping data, attempting to gain unauthorised access, uploading malicious code, or using information obtained through the Platform for any purpose other than evaluating a potential engagement with the counterparty who shared it.',
      ],
    },
    {
      heading: '4. Confidential and gated information',
      paragraphs: [
        'Some information is disclosed only when a user grants access. When another user shares gated information with you, you agree to keep it confidential and to use it only to evaluate the relevant opportunity. Access to gated information is logged.',
      ],
    },
    {
      heading: '5. Fees',
      paragraphs: [
        'Fees, including any success fee applicable to a completed raise, are as described on the Platform or as otherwise agreed. Applicable fees are your responsibility as specified at the time.',
      ],
    },
    {
      heading: '6. Disclaimers and limitation of liability',
      paragraphs: [
        'The Platform is provided "as is" and "as available" without warranties of any kind, whether express or implied, including any warranties of merchantability, fitness for a particular purpose, accuracy or non-infringement.',
        'To the maximum extent permitted by law, ' + COMPANY + ' will not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits, revenues, data, goodwill or investment, arising out of or relating to your use of the Platform or any transaction between users.',
      ],
    },
    {
      heading: '7. Indemnification',
      paragraphs: [
        'You agree to indemnify and hold ' + COMPANY + ' harmless from claims, losses and expenses arising out of your content, your use of the Platform, or your breach of these Terms or of applicable law.',
      ],
    },
    {
      heading: '8. Suspension, termination and changes',
      paragraphs: [
        'We may suspend or terminate access to the Platform at any time if you breach these Terms or to protect the Platform or its users. You may stop using the Platform at any time.',
        'We may modify these Terms; material changes will be notified through the Platform, and continued use after an update constitutes acceptance of the revised Terms.',
      ],
    },
    {
      heading: '9. Governing law',
      paragraphs: [
        'These Terms are governed by the laws of the jurisdiction in which ' + COMPANY + ' is established, without regard to conflict-of-laws principles. The specific governing law and venue should be confirmed by legal counsel.',
      ],
    },
  ],
};

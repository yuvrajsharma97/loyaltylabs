import { Link } from 'react-router-dom';

// Fill these in before launch. They appear verbatim on the public page.
const COMPANY = {
  legalName: '[Company legal name] Ltd',
  companyNumber: '[Companies House number]',
  address: '[Registered office address]',
  icoNumber: '[ICO registration number]',
  contactEmail: '[privacy contact email]',
};

const LAST_UPDATED = '11 November 2026';

const Section = ({ title, children }) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-section text-text-primary">{title}</h2>
    <div className="flex flex-col gap-3 text-body text-text-secondary">{children}</div>
  </section>
);

const List = ({ items }) => (
  <ul className="flex list-disc flex-col gap-1.5 pl-5">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-canvas px-4 py-10 sm:px-10 sm:py-14">
    <article className="mx-auto flex max-w-[720px] flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link to="/" className="flex items-center gap-2 text-text-primary">
          <span className="block h-5 w-5 rounded-[6px] bg-primary" />
          <span className="text-card-title">LoyaltyLabs</span>
        </Link>
        <h1 className="text-page-title text-text-primary">Privacy policy</h1>
        <p className="text-body-sm text-text-muted">Last updated {LAST_UPDATED}</p>
        <p className="text-body text-text-secondary">
          This explains what LoyaltyLabs collects when you use it, as a customer collecting points or as a shop
          running a loyalty programme, why we collect it, and the rights you have under UK data protection law
          (UK GDPR and the Data Protection Act 2018).
        </p>
      </header>

      <Section title="Who we are">
        <p>
          LoyaltyLabs is run by {COMPANY.legalName} (company number {COMPANY.companyNumber}), {COMPANY.address}. We
          are the data controller for your account, and we are registered with the Information Commissioner&apos;s
          Office under number {COMPANY.icoNumber}.
        </p>
        <p>
          For anything about your data, email <span className="text-text-primary">{COMPANY.contactEmail}</span>.
        </p>
      </Section>

      <Section title="What we collect">
        <p>If you&apos;re a customer:</p>
        <List
          items={[
            'Your name, email address and, if you give it, your phone number.',
            'If you sign in with Google: your Google account ID and profile picture.',
            'The shop categories you say you are interested in.',
            'Your points balance at each shop, each time you earn or spend points, the purchase amount entered at the till, and the rewards you claim.',
          ]}
        />
        <p>If you run a shop:</p>
        <List
          items={[
            'Your name, email address and phone number, and your shop’s name, address, category and loyalty settings.',
            'Your plan, trial dates and the number of active customers, so we can bill you correctly.',
            'Employee till codes, so each scan can be linked to the member of staff who made it.',
          ]}
        />
        <p>
          For everyone: a hashed (unreadable) version of your password, sign-in sessions, and a record of important
          account actions. Our servers also see your IP address for security, for example to slow down repeated
          failed sign-ins.
        </p>
        <p>We do not collect payment card details. We do not sell your data or use it for advertising.</p>
      </Section>

      <Section title="Why we use it">
        <List
          items={[
            'To run your account and the loyalty programmes you take part in. This is necessary to provide the service you signed up for (contract).',
            'To keep the service secure and stop fraud, such as fake scans or misuse of reward codes (legitimate interests).',
            'To keep financial and billing records we are required to keep (legal obligation).',
          ]}
        />
      </Section>

      <Section title="Emails we send">
        <p>
          We only send emails about your account: confirming your email address, resetting your password, telling
          you about a new sign-in, and, for shops, telling you when you reach your plan&apos;s customer limit.
        </p>
        <p>
          We do not send marketing emails. If we ever offer them, for example a reminder that a reward is waiting for
          you, we will ask you first, and you will be able to turn them off at any time.
        </p>
      </Section>

      <Section title="What shops can see">
        <p>
          When you collect points at a shop, that shop can see your name, your points balance with them, your visits
          and purchase amounts at their shop, and the rewards you claim there. A shop cannot see your activity at
          other shops, your password or your email address.
        </p>
      </Section>

      <Section title="Who else handles your data">
        <p>We use a small number of providers to run LoyaltyLabs, each bound by a data processing agreement:</p>
        <List
          items={[
            'MongoDB Atlas, to store the database.',
            'Resend, to deliver our emails.',
            'Google, if you choose to sign in with Google.',
            'Our hosting providers, to run the website and servers.',
          ]}
        />
        <p>
          Some of these providers may process data outside the UK. Where they do, the transfer is covered by the UK
          International Data Transfer Agreement or an equivalent safeguard.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>We keep your account details while your account is open.</p>
        <p>
          You can delete your account at any time from your account settings. When you do, your name, email, phone
          number and QR code are removed from the app straight away. We keep a hidden copy of those details for up
          to six months, only to deal with disputes or fraud, and then delete it permanently.
        </p>
        <p>
          The record of points earned and spent stays, but anonymised: it shows as &quot;Deleted customer&quot; and
          can no longer be linked to you. This keeps each shop&apos;s totals correct.
        </p>
        <p>
          If a shop owner deletes their account, the shop closes. Customers&apos; unused reward codes for that shop
          are cancelled and the points given back.
        </p>
      </Section>

      <Section title="Storage on your device">
        <p>
          We store your sign-in session in your browser&apos;s local storage so you stay signed in. This is strictly
          necessary for the service to work. We do not use advertising or analytics cookies.
        </p>
      </Section>

      <Section title="Your rights">
        <p>You can ask us to:</p>
        <List
          items={[
            'give you a copy of your data,',
            'correct anything that is wrong,',
            'delete your account and data,',
            'restrict or object to how we use it, or',
            'send your data to you or another service in a portable format.',
          ]}
        />
        <p>
          You can delete your account yourself in your account settings. For anything else, email{' '}
          {COMPANY.contactEmail} and we will reply within one month. If you are unhappy with how we handle your
          data, you can complain to the Information Commissioner&apos;s Office at ico.org.uk or on 0303 123 1113.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If we change this policy in a way that affects you, we will tell you by email or in the app before the
          change takes effect.
        </p>
      </Section>
    </article>
  </div>
);

export default PrivacyPolicy;

export interface ChixusLawTenet {
  id: string;
  number: string;
  title: string;
  summary: string;
  fullRule: string;
}

export const CHIXUS_LAWS: ChixusLawTenet[] = [
  {
    id: 'law-1',
    number: '01',
    title: 'The Law of Irreversible Credentials',
    summary: 'No passwords or keys can ever be reset or replaced.',
    fullRule: 'Every operator must establish an indelible 4-digit sovereign code (such as your birth year or a permanent four-digit sequence). Under no circumstances will a replacement key be issued, generated, or granted. If lost, your node credentials and access authority are extinguished forever.'
  },
  {
    id: 'law-2',
    number: '02',
    title: 'The Law of Zero Custody',
    summary: 'No administrator override exists within the sovereign enclave.',
    fullRule: 'The network maintains no central recovery email, no master backdoor, and no human support desk capable of resetting node credentials. The operator bears sole, absolute custody over their 4-digit authorization sequence.'
  },
  {
    id: 'law-3',
    number: '03',
    title: 'The Law of Optical Integrity',
    summary: 'Verification data must represent raw solder geometry with zero falsification.',
    fullRule: 'Every optical solder inspection performed across surface-mount components, through-hole pins, and BGA arrays must strictly abide by IPC-A-610 standards. Telemetry readings must never be altered or forged.'
  },
  {
    id: 'law-4',
    number: '04',
    title: 'The Law of Sovereign Responsibility',
    summary: 'Every signed board inspection is permanently attributed to the operator node.',
    fullRule: 'Defect classifications, solder joint approvals, and rework flags are cryptographically sealed with the operator node identifier. The operator is fully accountable for hardware safety and verification accuracy.'
  }
];

export const CAUTION_DIRECTIVE = {
  header: 'CRITICAL OPERATOR MANDATE // IRREVERSIBLE KEY PROTOCOL',
  subheading: 'Mandatory Reading Before Node Enrollment',
  primaryWarning: 'NEVER FORGET YOUR PASSWORD OR ACCESS KEY. A NEW ONE CANNOT BE ISSUED UNDER ANY CIRCUMSTANCES.',
  keyGuidance: 'You must provide a 4-digit code—either your birth year, or any four-digit code you will permanently remember. This code will NEVER be replaced, reset, or recovered.',
  reasons: [
    {
      title: 'No Centralized Reset System',
      detail: 'The CHIXUS sovereign network maintains zero central databases with master keys. There is no "forgot password" button and no administrative override.'
    },
    {
      title: 'Permanent Node Binding',
      detail: 'Once your node callsign is minted with your 4-digit code, the cryptographic link is immutable.'
    },
    {
      title: 'Recommendation: Birth Year or Permanent 4-Digit Sequence',
      detail: 'Use a four-digit number with deep personal certainty—such as your birth year (e.g. 1994, 2001) or an indelible 4-digit PIN you will never erase from memory.'
    }
  ],
  checkboxLabel: "I have read it and I obey the Chixus law."
};

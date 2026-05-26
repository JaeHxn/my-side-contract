export type PiiRedactionType =
  | "EMAIL"
  | "PHONE"
  | "RESIDENT_ID"
  | "NAME"
  | "ADDRESS"
  | "BANK_ACCOUNT"
  | "BUSINESS_REG_NO"
  | "CREDIT_CARD";

export interface PiiRedaction {
  type: PiiRedactionType;
  count: number;
}

export interface PiiRedactionResult {
  redactedText: string;
  redactions: PiiRedaction[];
}

interface RedactionRule {
  type: PiiRedactionType;
  pattern: RegExp;
  replace: (match: string, ...groups: string[]) => string;
}

const directReplacement = (type: PiiRedactionType) => () => `[REDACTED:${type}]`;
const labeledReplacement =
  (type: PiiRedactionType) =>
  (_match: string, label: string) =>
    `${label}[REDACTED:${type}]`;

const redactionRules: RedactionRule[] = [
  {
    type: "EMAIL",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replace: directReplacement("EMAIL")
  },
  {
    type: "RESIDENT_ID",
    pattern: /\b\d{6}[-\s]?[1-8]\d{6}\b/g,
    replace: directReplacement("RESIDENT_ID")
  },
  {
    type: "PHONE",
    pattern:
      /(?<!\d)(?:\+82[-.\s]?)?(?:0?1[016789]|0[2-6][1-5]?|070|050\d)[-.\s]?\d{3,4}[-.\s]?\d{4}(?!\d)/g,
    replace: directReplacement("PHONE")
  },
  {
    type: "BANK_ACCOUNT",
    pattern:
      /((?:bank account|account|\uACC4\uC88C|\uC740\uD589)\s*[:\uff1a]?\s*)([0-9][0-9\s-]{5,}[0-9])/gi,
    replace: labeledReplacement("BANK_ACCOUNT")
  },
  {
    type: "NAME",
    pattern:
      /((?:\uC784\uB300\uC778|\uC784\uCC28\uC778|\uACC4\uC57D\uC790|\uB300\uB9AC\uC778|\uC131\uBA85|\uC774\uB984)\s*[:\uff1a]?\s*)([\uAC00-\uD7A3]{2,5})(?=\s|$|,|;|\)|\()/g,
    replace: labeledReplacement("NAME")
  },
  {
    type: "ADDRESS",
    pattern:
      /((?:\uBAA9\uC801\uBB3C\s*\uC18C\uC7AC\uC9C0|\uC784\uB300\uCC28\s*\uBAA9\uC801\uBB3C|\uC18C\uC7AC\uC9C0|\uC8FC\uC18C)\s*[:\uff1a]?\s*)([^\r\n]+)/g,
    replace: labeledReplacement("ADDRESS")
  },
  {
    type: "BUSINESS_REG_NO",
    pattern: /\b\d{3}-\d{2}-\d{5}\b/g,
    replace: directReplacement("BUSINESS_REG_NO")
  },
  {
    type: "CREDIT_CARD",
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replace: directReplacement("CREDIT_CARD")
  }
];

export function redactPii(text: string): PiiRedactionResult {
  const redactions: PiiRedaction[] = [];
  let redactedText = text;

  for (const rule of redactionRules) {
    let count = 0;
    redactedText = redactedText.replace(rule.pattern, (match: string, ...groups: string[]) => {
      count += 1;
      return rule.replace(match, ...groups);
    });

    if (count > 0) {
      redactions.push({ type: rule.type, count });
    }
  }

  return { redactedText, redactions };
}

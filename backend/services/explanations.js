// Hand-written explanations. These are the fallback AND the only source of facts for Gemini.
const TABLE = {
  ECHECK: {
    label: 'Pending, eCheck',
    why: "Nothing is wrong. The sender paid from a bank account, so PayPal is waiting for the bank.",
    sender: ['Nothing to do. Wait. Next time pay by balance or card.'],
    recipient: ['Nothing to do. Wait 3–5 business days.'],
  },
  UNILATERAL: {
    label: 'Pending, email not confirmed',
    why: 'The email this was sent to has no confirmed PayPal account.',
    sender: ["Check the address with the recipient. If it's wrong, cancel and resend."],
    recipient: ['Add and confirm this exact email in your PayPal account.'],
  },
  RECEIVING_PREFERENCE_MANDATES_MANUAL_ACTION: {
    label: 'Pending, needs acceptance',
    why: "The recipient's account is set to review this kind of payment by hand.",
    sender: ['Tell the recipient it is waiting for them.'],
    recipient: ['Open the payment in PayPal and choose Accept.'],
  },
  VERIFICATION_REQUIRED: {
    label: 'Pending, account not verified',
    why: "The recipient's PayPal account isn't verified yet.",
    sender: ['Nothing to do. Wait.'],
    recipient: ['Finish verification in PayPal, then accept the payment.'],
  },
  PENDING_REVIEW: {
    label: 'Pending, under review',
    why: 'PayPal is reviewing this payment. This usually ends within 24 hours.',
    sender: ['Nothing to do. Wait. Answer PayPal if it emails you.'],
    recipient: ['Nothing to do. Wait.'],
  },
  INTERNATIONAL_WITHDRAWAL: {
    label: 'Pending, international',
    why: "The recipient's country requires them to accept the payment by hand.",
    sender: ['Tell the recipient it is waiting for them.'],
    recipient: ['Open the payment in PayPal and choose Accept.'],
  },
  UNCLAIMED: {
    label: 'Unclaimed',
    why: "The recipient hasn't claimed it. They may have no PayPal account under this email.",
    sender: ['Confirm the address. Unclaimed money returns to you after 30 days.'],
    recipient: ['Sign up or log in with this exact email to claim it.'],
  },
  ONHOLD: {
    label: 'On hold',
    why: 'PayPal has paused this payout for review.',
    sender: ['Check your PayPal Resolution Centre for a request.'],
    recipient: ['Nothing to do. Wait.'],
  },
  COMPLETED: {
    label: 'Completed',
    why: "This payment went through. The money is in the recipient's PayPal account.",
    sender: ['Nothing to do.'],
    recipient: ['Nothing to do.'],
  },
  OTHER: {
    label: 'Pending',
    why: "PayPal hasn't given a specific reason.",
    sender: ['Open the payment in PayPal for details.'],
    recipient: ['Ask the sender to check the payment in PayPal.'],
  },
};

// Recorded/demo payments so a judge can try it with no payment ID.
const FIXTURES = {
  'DEMO-UNCLAIMED': { status: 'UNCLAIMED', reasonCode: 'UNCLAIMED' },
  'DEMO-ECHECK': { status: 'PENDING', reasonCode: 'ECHECK' },
  'DEMO-MANUAL': { status: 'PENDING', reasonCode: 'RECEIVING_PREFERENCE_MANDATES_MANUAL_ACTION' },
  'DEMO-COMPLETED': { status: 'COMPLETED', reasonCode: 'COMPLETED' },
};

function lookupEntry(reasonCode) {
  return TABLE[reasonCode] || TABLE.OTHER;
}

module.exports = { TABLE, FIXTURES, lookupEntry };
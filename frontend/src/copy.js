
export const FIELD_ERRORS = {
  recipientEmail: {
    required: "Enter the recipient's email address.",
    invalid_email: "That doesn't look like an email address. Check for a missing @ or dot.",
  },
  amount: {
    required: "Enter the amount you want to send.",
    invalid_amount: "Enter an amount between 0.01 and 60,000, for example 250.00.",
  },
  balance: {
    invalid_balance: "Enter your balance as a number, for example 100.00, or leave it empty.",
  },
  paymentId: {
    required: "Enter the payment ID from your PayPal receipt.",
    invalid_id: "A payment ID is 8 to 36 letters and numbers, with no spaces.",
  },
};

export const VERDICT = {
  low: {
    title: "No issues found by our checks.",
    text: "The email looks right and your funding source pays instantly.",
  },
  medium: { title: "This payment may be delayed.", text: "" },
  high: { title: "This payment is likely to get stuck.", text: "" },
};

export function reasonText(r) {
  switch (r.code) {
    case "EMAIL_TYPO_DOMAIN":
      return `Did you mean ${r.suggestion}? That email domain looks like a typo.`;
    case "FUNDING_BANK_ECHECK":
      return "Paying from a bank account is sent as an eCheck. It usually takes 3–5 business days to clear.";
    case "AMOUNT_OVER_BALANCE":
      return "The amount is more than the balance you entered. PayPal will pull the rest from your bank, which can add days.";
    case "CROSS_BORDER":
      return "This payment crosses a border. PayPal may hold it for an extra review.";
    default:
      return "Something may delay this payment.";
  }
}

export const SKIPPED = {
  BALANCE: "We skipped the balance check because you didn't enter a balance.",
  CROSS_BORDER: "We skipped the cross-border check because a country is missing.",
};

export function errorMessage(status, which) {
  if (status === -1)
    return "You're offline. Reconnect and try again. Your details are still in the form.";
  if (status === 429)
    return "Too many checks in a short time. Wait a minute and try again.";
  if (status === 404)
    return "We could not find that payment. Check the ID and try again.";
  if (status === 502)
    return "We can't reach PayPal right now. Your details are still in the form. Try again in a minute.";

  return which === "check"
    ? "We couldn't run the check. Your details are still in the form. Try again."
    : "We couldn't look up that payment. Your payment ID is still in the form. Try again.";
}

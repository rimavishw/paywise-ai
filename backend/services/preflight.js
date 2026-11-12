
const supabase = require("../supabase");

async function runPreflight(userId, payment) {
  const { recipient_email, amount, currency = "USD" } = payment;

  const issues = [];
  const warnings = [];

  // 1. Validate payment details
  if (
    typeof recipient_email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient_email.trim())
  ) {
    return {
      can_proceed: false,
      risk_level: "high",
      issues: ["Invalid recipient email address"],
      warnings: []
    };
  }

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return {
      can_proceed: false,
      risk_level: "high",
      issues: ["Payment amount must be greater than zero"],
      warnings: []
    };
  }

  const email = recipient_email.trim().toLowerCase();

  // 2. Get sender profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("sandbox_balance, currency, paypal_verified")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!profile) {
    throw new Error("Sender profile not found");
  }

  // 3. Check saved recipient
  const { data: recipient, error: recipientError } = await supabase
    .from("recipients")
    .select("id, name, email")
    .eq("owner_id", userId)
    .eq("email", email)
    .maybeSingle();

  if (recipientError) throw recipientError;

  if (!recipient) {
    warnings.push(
      "This email is not in your saved recipients. Verify it before sending."
    );
  }

  // 4. Check sender verification status
  if (!profile.paypal_verified) {
    warnings.push(
      "Your PayPal verification status has not been confirmed in PayWise AI."
    );
  }

  // 5. Check balance only when currencies match
  const balance = Number(profile.sandbox_balance);
  const senderCurrency = profile.currency || "USD";

  if (senderCurrency === currency) {
    if (Number.isFinite(balance) && amount > balance) {
      issues.push("Insufficient sandbox balance for this payment.");
    }
  } else {
    warnings.push(
      "Balance was not checked because the payment currency differs from your profile currency."
    );
  }

  // 6. Determine risk
  let risk_level = "low";

  if (issues.length > 0) {
    risk_level = "high";
  } else if (warnings.length > 0) {
    risk_level = "medium";
  }

  return {
    can_proceed: issues.length === 0,
    risk_level,
    issues,
    warnings,
    recipient_found: Boolean(recipient),
    recipient_name: recipient?.name || null,
    sender_balance: balance,
    sender_currency: senderCurrency,
    checked_amount: amount,
    checked_currency: currency
  };
}

module.exports = runPreflight;

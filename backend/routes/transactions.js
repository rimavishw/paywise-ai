
const express = require("express");
const router = express.Router();

const supabase = require("../supabase");
const authenticateUser = require("../middleware/auth");
const runPreflight = require("../services/preflight");

// POST: Analyze payment and create simulated transaction
router.post("/", authenticateUser, async (req, res) => {
  try {
    const {
      recipient_email,
      amount,
      currency = "USD",
      note
    } = req.body;

    // 1. Validate payment details
    if (
      typeof recipient_email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient_email.trim()) ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Valid recipient email and positive numeric amount are required"
      });
    }

    if (
      typeof currency !== "string" ||
      !/^[A-Z]{3}$/.test(currency)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Currency must be a 3-letter uppercase code"
      });
    }

    if (note !== undefined && typeof note !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Note must be text"
      });
    }

    // 2. Run Pre-flight Engine
    const preflight = await runPreflight(req.user.id, {
      recipient_email,
      amount,
      currency
    });

    // 3. Stop if blocking issues are detected
    if (!preflight.can_proceed) {
      return res.status(422).json({
        status: "blocked",
        message: "Payment blocked by Pre-flight analysis",
        preflight
      });
    }

    // 4. Generate an issue code when warnings exist
    const issueCode = preflight.warnings.length > 0
      ? "PREFLIGHT_WARNING"
      : null;

    // 5. Save transaction and analysis in Supabase
    const { data, error } = await supabase
      .from("transactions")
      .insert([{
        sender_id: req.user.id,
        recipient_email: recipient_email.trim().toLowerCase(),
        amount,
        currency,
        note: note || null,
        status: "pending",
        is_simulated: true,
        preflight,
        risk_level: preflight.risk_level,
        issue_code: issueCode,
        explanation: {
          issues: preflight.issues,
          warnings: preflight.warnings,
          summary: preflight.can_proceed
            ? "Pre-flight checks passed. Simulated transaction created."
            : "Pre-flight checks blocked this payment."
        }
      }])
      .select()
      .single();

    if (error) throw error;

    // 6. Return saved transaction
    res.status(201).json({
      status: "success",
      message: "Pre-flight analysis completed and transaction created!",
      preflight,
      transaction: data
    });

  } catch (error) {
    console.error("Transaction creation error:", error.message);

    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// GET: All transactions belonging to logged-in user
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("sender_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      status: "success",
      transactions: data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// GET: One transaction belonging to logged-in user
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", req.params.id)
      .eq("sender_id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        status: "error",
        message: "Transaction not found"
      });
    }

    res.json({
      status: "success",
      transaction: data
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

module.exports = router;

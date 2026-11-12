
const express = require("express");
const router = express.Router();

const supabase = require("../supabase");
const authenticateUser = require("../middleware/auth");

// GET: Retrieve events belonging to a transaction
router.get("/transaction/:transactionId", authenticateUser, async (req, res) => {
  try {
    const { transactionId } = req.params;

    // First verify that this transaction belongs to the logged-in user
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("id")
      .eq("id", transactionId)
      .eq("sender_id", req.user.id)
      .maybeSingle();

    if (transactionError) throw transactionError;

    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Transaction not found"
      });
    }

    // Retrieve the transaction's event history
    const { data: events, error: eventsError } = await supabase
      .from("payment_events")
      .select("*")
      .eq("transaction_id", transactionId)
      .order("created_at", { ascending: false });

    if (eventsError) throw eventsError;

    res.json({
      status: "success",
      events
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

module.exports = router;

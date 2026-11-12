
const express = require("express");
const router = express.Router();

const supabase = require("../supabase");
const authenticateUser = require("../middleware/auth");

// ======================================
// GET ALL RECIPIENTS
// ======================================

router.get("/", authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("recipients")
      .select("*")
      .eq("owner_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      status: "success",
      recipients: data
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// ======================================
// ADD NEW RECIPIENT
// ======================================

router.post("/", authenticateUser, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        status: "error",
        message: "Name and email are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from("recipients")
      .insert([{
        owner_id: req.user.id,
        name: name.trim(),
        email: normalizedEmail
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      status: "success",
      message: "Recipient added successfully!",
      recipient: data
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.code === "23505"
        ? "This recipient already exists"
        : error.message
    });
  }
});

// ======================================
// DELETE RECIPIENT
// ======================================

router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("recipients")
      .delete()
      .eq("id", id)
      .eq("owner_id", req.user.id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Recipient not found"
      });
    }

    res.json({
      status: "success",
      message: "Recipient deleted successfully!"
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

module.exports = router;

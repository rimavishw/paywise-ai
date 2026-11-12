
const express = require("express");
const router = express.Router();
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../../.env")
});

const { createClient } = require("@supabase/supabase-js");
const supabase = require("../supabase");
const authenticateUser = require("../middleware/auth");

// Use the publishable/anon key for user authentication.
// Do not use the service-role key for login sessions.
function createAuthClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

// ======================================
// 1. USER SIGNUP
// ======================================

router.post("/signup", async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Name, email and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: "error",
        message: "Password must contain at least 8 characters"
      });
    }

    const authClient = createAuthClient();

    const { data, error } = await authClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: full_name.trim()
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          full_name: full_name.trim(),
          role: "sender"
        }, {
          onConflict: "id"
        });

      if (profileError) {
        console.error("Profile creation error:", profileError.message);
        return res.status(500).json({
          status: "error",
          message: "Account created, but profile setup failed."
        });
      }
    }

    res.status(201).json({
      status: "success",
      message: data.session
        ? "Account created successfully!"
        : "Account created. Please verify your email before logging in.",
      user: data.user,
      session: data.session
    });

  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message
    });
  }
});

// ======================================
// 2. USER LOGIN
// ======================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required"
      });
    }

    const authClient = createAuthClient();

    const { data, error } =
      await authClient.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

    if (error) throw error;

    res.json({
      status: "success",
      message: "Login successful!",
      user: data.user,
      session: data.session
    });

  } catch (error) {
    res.status(401).json({
      status: "error",
      message: error.message
    });
  }
});

// ======================================
// 3. GET CURRENT USER
// ======================================

router.get("/me", authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    res.json({
      status: "success",
      user: req.user,
      profile: data
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

module.exports = router;

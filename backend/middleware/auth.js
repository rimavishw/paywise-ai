
const supabase = require("../supabase");

async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authentication token is required"
      });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired authentication token"
      });
    }

    req.user = data.user;

    next();

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Authentication failed"
    });
  }
}

module.exports = authenticateUser;

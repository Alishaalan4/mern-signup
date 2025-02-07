const User = require("../models/userModel");
const validator = require('validator');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const signToken = (id, res) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // Set the JWT as a cookie
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, res);

  console.log("Cookies Set:", res.getHeaders()["set-cookie"]);
  res.status(statusCode).json({
    status: "Success",
    token,
    data: {
      user,
    }
  });
};

exports.signup = async (req, res) => {
  const { firstName, lastName, email, username, password, passwordConfirm, role } = req.body;

  try {
    // Check if email is already in use
    const emailCheck = await User.findOne({ email });
    if (emailCheck) {
      return res.status(409).json({ message: "Email is in use." });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid Email." });
    }

    // Create a new user instance
    const newUser = new User({
      firstName,
      lastName,
      email,
      username,
      password,
      passwordConfirm,
      role,
    });

    // Explicitly validate the document
    await newUser.validate();

    // Save the user to the database
    await newUser.save();

    // Send response with token
    createSendToken(newUser, 201, res);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
    console.error("Error in signup:", err);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!(await user.checkPassword(password, user.password))) {
      return res.status(401).json({ message: "Incorrect Email or Password" });
    }

    createSendToken(user, 200, res);
    console.log("Logged in");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.logout = async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  console.log("Logged out");
  res.status(200).json({ message: "Logged out successfully" });
};

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ message: "Not logged in" });
    }

    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid Token" });
      } else if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Your session token is expired, Login again!" });
      }
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ message: "The token owner no longer exists" });
    }

    if (currentUser.passwordChangedAfterTokenIssued(decoded.iat)) {
      return res.status(401).json({ message: "Your password has been changed, login again!" });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
}; 
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please enter your first name"],
      minLength: 3,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Please enter your last name"],
      minLength: 3,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: [true, "Please enter your email"],
    },
    username: {
      type: String,
      unique: true,
      trim: true,
      required: [true, "Please enter your username"],
    },
    password: {
      type: String,
      minLength: 8,
      trim: true,
      required: [true, "Please enter your password"],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return value === this.password;
        },
        message: "Passwords do not match!",
      },
    },
    passwordChangedAt: Date,
    role: {
      type: String,
      default: "user",
      enum: ["admin", "user"],
    },
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();

    // Hash the password
    this.password = await bcrypt.hash(this.password, 12);

    // Remove the passwordConfirm field
    this.passwordConfirm = undefined;

    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.checkPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfterTokenIssued = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangeTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return passwordChangeTime > JWTTimestamp;
  }
  return false;
};

module.exports = mongoose.model("User", userSchema);

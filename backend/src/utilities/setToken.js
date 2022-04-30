const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const jwt = require("jsonwebtoken");

const setToken = (user, res) => {
  const token = jwt.sign(
    {
      upi: user.upi,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    },
    config.jwt_secret,
    {
      expiresIn: "24h",
      issuer: "crowdcaptions.raa.amazon.auckland.ac.nz",
      audience: "api.crowdcaptions.raa.amazon.auckland.ac.nz",
    }
  );
  res.cookie("jwt-auth", token, {
    // maxAge: 86400,
    secure: true,
    httpOnly: true,
    sameSite: "strict",
  });
};
module.exports = setToken;

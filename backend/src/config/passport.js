const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2").Strategy;
// var OpenIdOAuth2Strategy = require("passport-openid-oauth20").Strategy;
//import all database as constants
const {
  sequelize,
  CaptionFile,
  CaptionSentence,
  Edit,
  Report,
  User,
  Vote,
} = require("../models");

let PanoptoStrategy = new OAuth2Strategy(
  {
    authorizationURL: `https://${process.env.panopto_host}/Panopto/oauth2/connect/authorize`,
    tokenURL: `https://${process.env.panopto_host}/Panopto/oauth2/connect/token`,
    clientID: process.env.panopto_clientId,
    clientSecret: process.env.panopto_clientSecret,
    callbackURL: "http://localhost:8000/auth/callback",
    scope: ["api", "openid", "profile", "email"],
  },
  async function (accessToken, refreshToken, profile, done) {
    const [user, created] = await User.findOrCreate({
      where: { upi: profile.id, access: 0 },
    });
    return done(null, { ...user.get({ plain: true }), accessToken });
  }
);

// https://github.com/Accelery/passport-openid-oauth20/blob/master/src/profile/openid.ts
let parse = function (json) {
  if ("string" == typeof json) {
    json = JSON.parse(json);
  }

  var profile = {};

  profile.id = json.sub;
  profile.displayName = json.name;
  if (json.family_name || json.given_name) {
    profile.name = {
      familyName: json.family_name,
      givenName: json.given_name,
    };
  }
  if (json.email) {
    profile.emails = [
      {
        value: json.email,
        verified: json.email_verified,
      },
    ];
  }
  if (json.picture) {
    profile.photos = [
      {
        value: json.picture,
      },
    ];
  }

  return profile;
};

PanoptoStrategy.userProfile = function (accessToken, done) {
  // Need to ovveride here to use auth headers
  this._oauth2.useAuthorizationHeaderforGET(true);
  this._oauth2.get(
    `https://${process.env.panopto_host}/Panopto/oauth2/connect/userinfo`,
    accessToken,
    (err, body) => {
      //   Source: https://github.com/Accelery/passport-openid-oauth20/blob/ff731f674317f43a1e185458d4d4eeab9d5dfac6/src/strategy.ts#L75
      let json;
      if (err) {
        return done(
          new Error(
            `failed to fetch user profile: https://${
              process.env.panopto_host
            }/Panopto/oauth2/connect/userinfo ${JSON.stringify(
              err
            )}, ${JSON.stringify(body)} ${accessToken}`
          )
        );
      }

      try {
        json = JSON.parse(body);
      } catch (e) {
        return done(new Error("Failed to parse user profile"));
      }

      let profile = parse(json);

      profile._raw = body;
      profile._json = json;

      done(null, profile);
    }
  );
};

passport.use(PanoptoStrategy);

passport.serializeUser(function (user, done) {
  done(null, `${user.upi}::${user.accessToken}`);
});

passport.deserializeUser(async function (serial, done) {
  const [upi, accessToken] = serial.split("::");
  const u = await User.findByPk(upi);
  if (!u) {
    return done("Please log in again", false);
  }
  done(null, { ...u.get({ plain: true }), accessToken });
});

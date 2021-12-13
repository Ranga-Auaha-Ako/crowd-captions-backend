const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");
var OpenIdOAuth2Strategy = require("passport-openid-oauth20").Strategy;
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
    // userProfileURL: `https://${process.env.panopto_host}/Panopto/oauth2/connect/userinfo`,
    clientID: process.env.panopto_clientId,
    clientSecret: process.env.panopto_clientSecret,
    callbackURL: "http://localhost:8000/auth/callback",
    scope: ["api", "openid", "profile", "email"],
  },
  function (accessToken, refreshToken, profile, done) {
    console.log("profile");
    console.log(profile);
    console.log("accessToken");
    console.log(accessToken);
    User.findOrCreate({ where: { upi: profile.id, access: 0 } }).then(function (
      user,
      created
    ) {
      return done(null, user);
      //   return done(null, user);
    });
  }
);

PanoptoStrategy.userProfile = function (accessToken, done) {
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
  done(null, user.id);
});

passport.deserializeUser(function (upi, done) {
  User.findByPk(upi, function (err, user) {
    done(err, user);
  });
});

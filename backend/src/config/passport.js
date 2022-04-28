const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2").Strategy;
const refresh = require("passport-oauth2-refresh");

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
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];

const SUPERADMIN_IDS = [
  "a47fa57c-d8ef-4433-8b9b-adaa00556393",
  "fd68c42d-6c99-4673-922e-ad9b0041c4b9",
  "1c3cc1b3-575b-4dd9-980b-adb800112247",
];
const COURSEADMIN_IDS = ["a47fa57c-d8ef-4433-8b9b-adaa00556393"];
const BANNED_IDS = [];

let PanoptoStrategy = new OAuth2Strategy(
  {
    authorizationURL: `https://${process.env.panopto_host}/Panopto/oauth2/connect/authorize`,
    tokenURL: `https://${process.env.panopto_host}/Panopto/oauth2/connect/token`,
    clientID: process.env.panopto_clientId,
    clientSecret: process.env.panopto_clientSecret,
    callbackURL: "/auth/callback",
    proxy: true,
    scope: ["api", "openid", "profile", "email", "offline_access"],
  },
  async function (accessToken, refreshToken, profile, done) {
    // First attempt to find user
    let user = await User.findByPk(profile.id);
    if (!user) {
      // Determine permission level
      // 0=Student, 1=CourseAdmin, 2=SuperAdmin, -1=Disabled User
      let access = 0;
      if (BANNED_IDS.includes(profile.id)) {
        access = -1;
      } else if (SUPERADMIN_IDS.includes(profile.id)) {
        access = 2;
      } else if (COURSEADMIN_IDS.includes(profile.id)) {
        access = 1;
      }
      // Create user
      user = User.create({
        upi: profile.id,
        access: access,
        email: profile._json.emailaddress,
        name: profile.displayName,
        username: profile._json.preferred_username,
      });
    } else {
      // User exists, get it.
      user = user.get({ plain: true });
    }
    return done(null, { ...user, accessToken, refreshToken });
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
refresh.use(PanoptoStrategy);

passport.serializeUser(function (user, done) {
  done(null, `${user.upi}::${user.accessToken}::${user.refreshToken}`);
});

passport.deserializeUser(async function (serial, done) {
  const [upi, accessToken, refreshToken] = serial.split("::");
  const u = await User.findByPk(upi);
  if (!u) {
    return done("Please log in again", false);
  }
  console.log("refreshToken", refreshToken);
  done(null, { ...u.get({ plain: true }), accessToken, refreshToken });
});

// JWT for API
const JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;

const ApiStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwt_secret,
    issuer: "crowdcaptions.raa.amazon.auckland.ac.nz",
    audience: "api.crowdcaptions.raa.amazon.auckland.ac.nz",
  },
  async (jwt_payload, done) => {
    console.log(jwt_payload.upi);
    const u = await User.findByPk(jwt_payload.upi);
    if (!u) {
      return done("Please log in again", false);
    }
    done(null, {
      ...u.get({ plain: true }),
      accessToken: jwt_payload.accessToken,
      refreshToken: jwt_payload.refreshToken,
    });
  }
);

passport.use(ApiStrategy);

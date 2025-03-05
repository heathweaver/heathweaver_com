import { createHelpers, createTwitterOAuthConfig, createGoogleOAuthConfig, getRequiredEnv } from "kv-oauth";
import { OAuth2Client } from "oauth2";

// Provider Configuration
const PROVIDERS = {
  google: {
    clientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
    clientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: {
      signup: getRequiredEnv("GOOGLE_SIGNUP_REDIRECT_URI"),
      signin: getRequiredEnv("GOOGLE_SIGNIN_REDIRECT_URI")
    },
    scopes: ["openid", "profile", "email"] as string[]
  },
  linkedin: {
    clientId: getRequiredEnv("LINKEDIN_CLIENT_ID"),
    clientSecret: getRequiredEnv("LINKEDIN_CLIENT_SECRET"),
    redirectUri: getRequiredEnv("LINKEDIN_REDIRECT_URI"),
    scopes: ["r_liteprofile", "r_emailaddress", "w_member_social"] as string[]
  }
};

const cookieOptions = {
  name: "session",
  sameSite: "Lax" as const,
  secure: true,
  path: "/"
};

// Google Configuration
const googleSignupConfig = createGoogleOAuthConfig({
  redirectUri: PROVIDERS.google.redirectUri.signup,
  scope: PROVIDERS.google.scopes
});

const googleSigninConfig = createGoogleOAuthConfig({
  redirectUri: PROVIDERS.google.redirectUri.signin,
  scope: PROVIDERS.google.scopes
});

// LinkedIn Configuration
const linkedinConfig = {
  clientId: PROVIDERS.linkedin.clientId,
  clientSecret: PROVIDERS.linkedin.clientSecret,
  authorizationEndpointUri: "https://www.linkedin.com/oauth/v2/authorization",
  tokenUri: "https://www.linkedin.com/oauth/v2/accessToken",
  defaults: {
    scope: PROVIDERS.linkedin.scopes,
  },
};

const linkedinSignupConfig = {
  ...linkedinConfig,
  redirectUri: "http://localhost:8001/api/connect/linkedin-callback",
};

const linkedinSigninConfig = {
  ...linkedinConfig,
  redirectUri: PROVIDERS.linkedin.redirectUri,
};

// Google helpers
export const googleSignupHelpers = createHelpers(googleSignupConfig, { cookieOptions });
export const googleSigninHelpers = createHelpers(googleSigninConfig, { cookieOptions });

// LinkedIn helpers
export const linkedinSignupHelpers = createHelpers(linkedinSignupConfig, { cookieOptions });
export const linkedinSigninHelpers = createHelpers(linkedinSigninConfig, { cookieOptions });

// Google exports
export const { 
  signIn: signInWithGoogleSignup, 
  handleCallback: handleGoogleSignupCallback 
} = googleSignupHelpers;

export const { 
  signIn: signInWithGoogleSignin, 
  handleCallback: handleGoogleSigninCallback 
} = googleSigninHelpers;

// LinkedIn exports
export const { 
  signIn: signInWithLinkedInSignup, 
  handleCallback: handleLinkedInSignupCallback 
} = linkedinSignupHelpers;

export const { 
  signIn: signInWithLinkedInSignin, 
  handleCallback: handleLinkedInSigninCallback 
} = linkedinSigninHelpers;

// Export provider configuration for use in other parts of the app
export { PROVIDERS };

// Twitter Configuration
const twitterSignupConfig = createTwitterOAuthConfig({
  redirectUri: "http://localhost:8001/auth/api/signup/twitter-callback",
  scope: ["tweet.read", "users.read"]
});

const twitterSigninConfig = createTwitterOAuthConfig({
  redirectUri: "http://localhost:8001/auth/api/signin/twitter-callback",
  scope: ["tweet.read", "users.read", "users.read:email", "offline.access"],
});

// Twitter helpers
export const twitterSignupHelpers = createHelpers(twitterSignupConfig, { cookieOptions });
export const twitterSigninHelpers = createHelpers(twitterSigninConfig, { cookieOptions });

// Twitter exports
export const { 
  signIn: signInWithTwitterSignup, 
  handleCallback: handleTwitterSignupCallback 
} = twitterSignupHelpers;

export const { 
  signIn: signInWithTwitterSignin, 
  handleCallback: handleTwitterSigninCallback 
} = twitterSigninHelpers;

/* Apple Authentication - Commented out until Apple Developer Account is set up
// Make sure Apple env vars are set before creating config
const APPLE_CLIENT_ID = Deno.env.get("APPLE_CLIENT_ID");
const APPLE_TEAM_ID = Deno.env.get("APPLE_TEAM_ID");
const APPLE_KEY_ID = Deno.env.get("APPLE_KEY_ID");
const APPLE_PRIVATE_KEY = Deno.env.get("APPLE_PRIVATE_KEY");

// Apple Configuration
function createAppleOAuthConfig(options: { redirectUri: string; scope: string[] }) {
  return new OAuth2Client({
    clientId: getRequiredEnv("APPLE_CLIENT_ID"),
    clientSecret: generateAppleClientSecret(), // We need to generate this dynamically
    authorizationEndpointUri: "https://appleid.apple.com/auth/authorize",
    tokenUri: "https://appleid.apple.com/auth/token",
    redirectUri: options.redirectUri,
    defaults: {
      scope: options.scope,
    },
  });
}

// Function to generate Apple client secret (JWT)
async function generateAppleClientSecret() {
  const header = {
    alg: "ES256",
    kid: getRequiredEnv("APPLE_KEY_ID"),
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: getRequiredEnv("APPLE_TEAM_ID"),
    iat: now,
    exp: now + 15777000, // 6 months
    aud: "https://appleid.apple.com",
    sub: getRequiredEnv("APPLE_CLIENT_ID"),
  };

  const key = getRequiredEnv("APPLE_PRIVATE_KEY");
  
  // You'll need to implement JWT signing with ES256
  // This is a placeholder - you'll need to implement actual JWT signing
  throw new Error("JWT signing not implemented");
}

const appleSignupConfig = createAppleOAuthConfig({
  redirectUri: "http://localhost:8001/auth/api/signup/apple-callback",
  scope: ["name", "email"]
});

const appleSigninConfig = createAppleOAuthConfig({
  redirectUri: "http://localhost:8001/auth/api/signin/apple-callback",
  scope: ["name", "email"]
});

// Apple helpers
export const appleSignupHelpers = createHelpers(appleSignupConfig, { cookieOptions });
export const appleSigninHelpers = createHelpers(appleSigninConfig, { cookieOptions });

// Apple exports
export const { 
  signIn: signInWithAppleSignup, 
  handleCallback: handleAppleSignupCallback 
} = appleSignupHelpers;

export const { 
  signIn: signInWithAppleSignin, 
  handleCallback: handleAppleSigninCallback 
} = appleSigninHelpers;
*/
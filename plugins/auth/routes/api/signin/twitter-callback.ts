import { Handlers } from "$fresh/server.ts";
import { signInWithTwitterSignin, handleTwitterSigninCallback } from "../../../lib/kv_oauth.ts";

async function generateCodeVerifier() {
  const rando = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...rando))
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 128);
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export const handler: Handlers = {
  async GET(req, ctx) {
    return await signInWithTwitterSignin(req);
  }
}; 
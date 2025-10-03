const LINKEDIN_API_URL = "https://api.linkedin.com/v2";

export async function getLinkedInProfile(accessToken: string) {
  const response = await fetch(`${LINKEDIN_API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch LinkedIn profile");
  }

  return await response.json();
}

export async function getLinkedInPositions(accessToken: string) {
  const response = await fetch(`${LINKEDIN_API_URL}/positions`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch LinkedIn positions");
  }

  return await response.json();
}

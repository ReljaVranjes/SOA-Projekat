interface JWTPayload {
  id: string;
  email: string;
  role: string;
  exp: number;
}

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    //separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];

    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);

    const decodedPayload = JSON.parse(atob(paddedPayload));

    return decodedPayload as JWTPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

export const getTokenClaims = (token: string): JWTPayload | null => {
  if (isTokenExpired(token)) {
    return null;
  }
  return decodeJWT(token);
};
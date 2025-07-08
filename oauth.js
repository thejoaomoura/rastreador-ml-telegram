require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const tokenPath = './.token.json';

async function loadToken() {
  if (!fs.existsSync(tokenPath)) throw new Error('Token não encontrado. Faça login primeiro.');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
  return token;
}

async function saveToken(data) {
  const payload = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000)
  };
  fs.writeFileSync(tokenPath, JSON.stringify(payload, null, 2));
}

async function refreshAccessToken(refresh_token) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', process.env.ML_CLIENT_ID);
  params.append('client_secret', process.env.ML_CLIENT_SECRET);
  params.append('refresh_token', refresh_token);

  const { data } = await axios.post('https://api.mercadolibre.com/oauth/token', params);
  await saveToken(data);
  return data.access_token;
}

async function getValidAccessToken() {
  const token = await loadToken();
  if (Date.now() < token.expires_at - 60000) {
    return token.access_token; // ainda é válido
  } else {
    console.log("🔄 Token expirado. Renovando...");
    return await refreshAccessToken(token.refresh_token);
  }
}

module.exports = {
    loadToken,
    getValidAccessToken,
    saveToken
};

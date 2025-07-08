require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MAX_PRICE = parseFloat(process.env.MAX_PRICE);
const KEYWORD = process.env.KEYWORD;

const enviadosPath = './enviados.json';
let enviados = [];

if (fs.existsSync(enviadosPath)) {
  enviados = JSON.parse(fs.readFileSync(enviadosPath, 'utf-8'));
}

async function buscarProdutos() {
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(KEYWORD)}`;
    const { data } = await axios.get(url);

    const novosProdutos = data.results.filter(prod => 
      prod.price <= MAX_PRICE && !enviados.includes(prod.id)
    );

    for (const produto of novosProdutos) {
      const mensagem = `🔔 *Novo produto encontrado!*\n\n📦 *${produto.title}*\n💰 *R$${produto.price}*\n🔗 [Ver no Mercado Livre](${produto.permalink})`;

      await enviarTelegram(mensagem);
      enviados.push(produto.id);
    }

    fs.writeFileSync(enviadosPath, JSON.stringify(enviados, null, 2));
    console.log(`[${new Date().toLocaleTimeString()}] Verificação concluída: ${novosProdutos.length} novo(s) produto(s) enviado(s).`);

  } catch (err) {
    console.error("Erro ao buscar produtos:", err.message);
  }
}

async function enviarTelegram(mensagem) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: mensagem,
      parse_mode: "Markdown"
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem no Telegram:", error.message);
  }
}

// 🔁 Executa a cada 30 minutos
cron.schedule('*/30 * * * *', buscarProdutos);

// Executa imediatamente ao iniciar
buscarProdutos();

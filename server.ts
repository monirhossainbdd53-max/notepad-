import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, '.data');
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');

type BillingPlan = 'monthly' | 'yearly';
type PaymentProvider = 'sslcommerz' | 'binance_pay';

interface PurchaseRecord {
  tranId: string;
  provider: PaymentProvider;
  plan: BillingPlan;
  amount: string;
  currency: 'BDT' | 'USDT';
  email: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  valId?: string;
  prepayId?: string;
  receiptToken?: string;
  createdAt: string;
  verifiedAt?: string;
  expiresAt?: string;
}

const PLAN_PRICING: Record<
  BillingPlan,
  { label: string; bdtAmount: string; usdtAmount: string; durationDays: number }
> = {
  monthly: {
    label: 'Notes Premium (Monthly)',
    bdtAmount: '590.00',
    usdtAmount: '4.99',
    durationDays: 31,
  },
  yearly: {
    label: 'Notes Premium (Yearly)',
    bdtAmount: '4790.00',
    usdtAmount: '39.99',
    durationDays: 366,
  },
};

function getSigningSecret(): string {
  return (
    process.env.BILLING_SIGNING_SECRET ||
    process.env.SSLCOMMERZ_STORE_PASSWD ||
    process.env.BINANCE_PAY_SECRET_KEY ||
    'notes-local-ephemeral-signing-secret'
  );
}

function createReceiptToken(record: PurchaseRecord): string {
  const payload = JSON.stringify({
    tranId: record.tranId,
    provider: record.provider,
    plan: record.plan,
    email: record.email,
    expiresAt: record.expiresAt,
  });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function loadPurchases(): PurchaseRecord[] {
  try {
    if (!fs.existsSync(PURCHASES_FILE)) return [];
    const raw = fs.readFileSync(PURCHASES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PurchaseRecord[]) : [];
  } catch {
    return [];
  }
}

function savePurchases(records: PurchaseRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PURCHASES_FILE, JSON.stringify(records, null, 2));
  } catch {
    // Ignore filesystem errors in read-only runtimes
  }
}

function upsertPurchase(record: PurchaseRecord): void {
  const records = loadPurchases();
  const idx = records.findIndex((r) => r.tranId === record.tranId);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.unshift(record);
  }
  savePurchases(records.slice(0, 500));
}

function findPurchase(tranId: string): PurchaseRecord | undefined {
  return loadPurchases().find((r) => r.tranId === tranId);
}

function getBaseUrl(req: Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function getSslCommerzBaseUrl(): string {
  return process.env.SSLCOMMERZ_IS_LIVE === 'true'
    ? 'https://securepay.sslcommerz.com'
    : 'https://sandbox.sslcommerz.com';
}

function isSslCommerzConfigured(): boolean {
  const id = process.env.SSLCOMMERZ_STORE_ID || '';
  const pw = process.env.SSLCOMMERZ_STORE_PASSWD || '';
  return Boolean(id && pw && !id.startsWith('MY_') && !pw.startsWith('MY_'));
}

function isBinancePayConfigured(): boolean {
  const key = process.env.BINANCE_PAY_API_KEY || '';
  const secret = process.env.BINANCE_PAY_SECRET_KEY || '';
  return Boolean(key && secret && !key.startsWith('MY_') && !secret.startsWith('MY_'));
}

async function validateSslCommerzTransaction(
  valId: string,
  expectedAmount: string
): Promise<boolean> {
  const storeId = process.env.SSLCOMMERZ_STORE_ID || '';
  const storePass = process.env.SSLCOMMERZ_STORE_PASSWD || '';
  if (!storeId || !storePass || !valId) return false;

  const url = `${getSslCommerzBaseUrl()}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(
    valId
  )}&store_id=${encodeURIComponent(storeId)}&store_passwd=${encodeURIComponent(
    storePass
  )}&format=json`;

  const response = await fetch(url);
  if (!response.ok) return false;
  const data = (await response.json()) as {
    status?: string;
    amount?: string;
    currency_type?: string;
  };

  const validStatus = data.status === 'VALID' || data.status === 'VALIDATED';
  const amountMatches =
    Math.abs(Number(data.amount || 0) - Number(expectedAmount)) < 1;

  return validStatus && amountMatches;
}

function signBinancePayPayload(
  timestamp: string,
  nonce: string,
  bodyString: string,
  secretKey: string
): string {
  const payload = `${timestamp}\n${nonce}\n${bodyString}\n`;
  return crypto
    .createHmac('sha512', secretKey)
    .update(payload)
    .digest('hex')
    .toUpperCase();
}

async function queryBinancePayOrder(merchantTradeNo: string): Promise<{
  paid: boolean;
  status: string;
}> {
  const apiKey = process.env.BINANCE_PAY_API_KEY || '';
  const secretKey = process.env.BINANCE_PAY_SECRET_KEY || '';
  if (!apiKey || !secretKey) {
    return { paid: false, status: 'UNCONFIGURED' };
  }

  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(16).toString('hex');
  const bodyObj = { merchantTradeNo };
  const bodyString = JSON.stringify(bodyObj);
  const signature = signBinancePayPayload(timestamp, nonce, bodyString, secretKey);

  const response = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v2/order/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'BinancePay-Timestamp': timestamp,
      'BinancePay-Nonce': nonce,
      'BinancePay-Certificate-SN': apiKey,
      'BinancePay-Signature': signature,
    },
    body: bodyString,
  });

  if (!response.ok) {
    return { paid: false, status: 'ERROR' };
  }

  const json = (await response.json()) as {
    status?: string;
    data?: { status?: string };
  };
  const orderStatus = json.data?.status || '';
  return {
    paid: json.status === 'SUCCESS' && orderStatus === 'PAID',
    status: orderStatus || json.status || 'UNKNOWN',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Allow mobile Capacitor origin & web origins to call billing API cleanly
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/billing/config', (_req: Request, res: Response) => {
    res.json({
      sslcommerzEnabled: isSslCommerzConfigured(),
      sslcommerzMode: process.env.SSLCOMMERZ_IS_LIVE === 'true' ? 'live' : 'sandbox',
      binancePayEnabled: isBinancePayConfigured(),
      plans: {
        monthly: {
          bdt: PLAN_PRICING.monthly.bdtAmount,
          usdt: PLAN_PRICING.monthly.usdtAmount,
        },
        yearly: {
          bdt: PLAN_PRICING.yearly.bdtAmount,
          usdt: PLAN_PRICING.yearly.usdtAmount,
        },
      },
    });
  });

  app.post('/api/billing/sslcommerz/init', async (req: Request, res: Response) => {
    try {
      if (!isSslCommerzConfigured()) {
        res.status(503).json({
          error:
            'SSLCommerz merchant credentials (SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWD) are not configured on the server.',
        });
        return;
      }

      const plan: BillingPlan = req.body?.plan === 'monthly' ? 'monthly' : 'yearly';
      const email = String(req.body?.email || '').trim().toLowerCase();
      const customerName = String(req.body?.name || 'Notes User').trim() || 'Notes User';
      const returnOrigin = String(req.body?.returnOrigin || '').trim();

      if (!email || !email.includes('@')) {
        res.status(400).json({ error: 'Please sign in with Google or provide a valid email first.' });
        return;
      }

      const pricing = PLAN_PRICING[plan];
      const tranId = `NOTES_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const baseUrl = getBaseUrl(req);
      const clientOrigin =
        returnOrigin && returnOrigin.startsWith('http') ? returnOrigin.replace(/\/+$/, '') : baseUrl;

      const callbackBase = `${baseUrl}/api/billing/sslcommerz/callback?returnOrigin=${encodeURIComponent(
        clientOrigin
      )}`;

      const form = new URLSearchParams({
        store_id: process.env.SSLCOMMERZ_STORE_ID || '',
        store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD || '',
        total_amount: pricing.bdtAmount,
        currency: 'BDT',
        tran_id: tranId,
        success_url: `${callbackBase}&outcome=success`,
        fail_url: `${callbackBase}&outcome=failed`,
        cancel_url: `${callbackBase}&outcome=cancelled`,
        ipn_url: `${baseUrl}/api/billing/sslcommerz/ipn`,
        shipping_method: 'NO',
        product_name: pricing.label,
        product_category: 'Digital Subscription',
        product_profile: 'non-physical-goods',
        cus_name: customerName,
        cus_email: email,
        cus_add1: 'Dhaka',
        cus_city: 'Dhaka',
        cus_country: 'Bangladesh',
        cus_phone: '01700000000',
        value_a: email,
        value_b: plan,
      });

      const sslRes = await fetch(`${getSslCommerzBaseUrl()}/gwprocess/v4/api.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });

      const sslJson = (await sslRes.json()) as {
        status?: string;
        GatewayPageURL?: string;
        failedreason?: string;
      };

      if (sslJson.status !== 'SUCCESS' || !sslJson.GatewayPageURL) {
        res.status(502).json({
          error: sslJson.failedreason || 'SSLCommerz checkout initialization failed.',
        });
        return;
      }

      upsertPurchase({
        tranId,
        provider: 'sslcommerz',
        plan,
        amount: pricing.bdtAmount,
        currency: 'BDT',
        email,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });

      res.json({
        tranId,
        checkoutUrl: sslJson.GatewayPageURL,
      });
    } catch {
      res.status(500).json({ error: 'Unable to connect to SSLCommerz gateway.' });
    }
  });

  app.post('/api/billing/sslcommerz/callback', async (req: Request, res: Response) => {
    const outcome = String(req.query.outcome || 'failed');
    const returnOrigin = String(req.query.returnOrigin || getBaseUrl(req)).replace(/\/+$/, '');
    const tranId = String(req.body?.tran_id || '');
    const valId = String(req.body?.val_id || '');

    const record = tranId ? findPurchase(tranId) : undefined;

    if (outcome === 'success' && record && valId) {
      const verified = await validateSslCommerzTransaction(valId, record.amount).catch(() => false);
      if (verified) {
        const expiresAt = new Date(
          Date.now() + PLAN_PRICING[record.plan].durationDays * 24 * 60 * 60 * 1000
        ).toISOString();
        const updated: PurchaseRecord = {
          ...record,
          status: 'PAID',
          valId,
          verifiedAt: new Date().toISOString(),
          expiresAt,
        };
        updated.receiptToken = createReceiptToken(updated);
        upsertPurchase(updated);
        res.redirect(
          302,
          `${returnOrigin}/?billing_status=success&provider=sslcommerz&tran_id=${encodeURIComponent(
            tranId
          )}`
        );
        return;
      }
    }

    if (record) {
      upsertPurchase({
        ...record,
        status: outcome === 'cancelled' ? 'CANCELLED' : 'FAILED',
      });
    }

    res.redirect(
      302,
      `${returnOrigin}/?billing_status=${encodeURIComponent(
        outcome === 'cancelled' ? 'cancelled' : 'failed'
      )}&provider=sslcommerz&tran_id=${encodeURIComponent(tranId)}`
    );
  });

  app.post('/api/billing/sslcommerz/ipn', async (req: Request, res: Response) => {
    const tranId = String(req.body?.tran_id || '');
    const valId = String(req.body?.val_id || '');
    const record = tranId ? findPurchase(tranId) : undefined;

    if (record && valId && record.status !== 'PAID') {
      const verified = await validateSslCommerzTransaction(valId, record.amount).catch(() => false);
      if (verified) {
        const expiresAt = new Date(
          Date.now() + PLAN_PRICING[record.plan].durationDays * 24 * 60 * 60 * 1000
        ).toISOString();
        const updated: PurchaseRecord = {
          ...record,
          status: 'PAID',
          valId,
          verifiedAt: new Date().toISOString(),
          expiresAt,
        };
        updated.receiptToken = createReceiptToken(updated);
        upsertPurchase(updated);
      }
    }
    res.status(200).json({ received: true });
  });

  app.post('/api/billing/binance/create', async (req: Request, res: Response) => {
    try {
      if (!isBinancePayConfigured()) {
        res.status(503).json({
          error:
            'Binance Pay API credentials (BINANCE_PAY_API_KEY, BINANCE_PAY_SECRET_KEY) are not configured on the server.',
        });
        return;
      }

      const plan: BillingPlan = req.body?.plan === 'monthly' ? 'monthly' : 'yearly';
      const email = String(req.body?.email || '').trim().toLowerCase();
      const returnOrigin = String(req.body?.returnOrigin || '').trim();

      if (!email || !email.includes('@')) {
        res.status(400).json({ error: 'Please sign in with Google or provide a valid email first.' });
        return;
      }

      const pricing = PLAN_PRICING[plan];
      const merchantTradeNo = `NOTES${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const baseUrl = getBaseUrl(req);
      const clientOrigin =
        returnOrigin && returnOrigin.startsWith('http') ? returnOrigin.replace(/\/+$/, '') : baseUrl;

      const bodyObj = {
        env: { terminalType: 'WEB' },
        merchantTradeNo,
        orderAmount: Number(pricing.usdtAmount),
        currency: 'USDT',
        goods: {
          goodsType: '02',
          goodsCategory: '6000',
          referenceGoodsId: `notes_premium_${plan}`,
          goodsName: pricing.label,
        },
        returnUrl: `${clientOrigin}/?billing_status=verify_binance&provider=binance_pay&tran_id=${encodeURIComponent(
          merchantTradeNo
        )}`,
        cancelUrl: `${clientOrigin}/?billing_status=cancelled&provider=binance_pay&tran_id=${encodeURIComponent(
          merchantTradeNo
        )}`,
      };

      const bodyString = JSON.stringify(bodyObj);
      const timestamp = String(Date.now());
      const nonce = crypto.randomBytes(16).toString('hex');
      const signature = signBinancePayPayload(
        timestamp,
        nonce,
        bodyString,
        process.env.BINANCE_PAY_SECRET_KEY || ''
      );

      const bpRes = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v3/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'BinancePay-Timestamp': timestamp,
          'BinancePay-Nonce': nonce,
          'BinancePay-Certificate-SN': process.env.BINANCE_PAY_API_KEY || '',
          'BinancePay-Signature': signature,
        },
        body: bodyString,
      });

      const bpJson = (await bpRes.json()) as {
        status?: string;
        errorMessage?: string;
        data?: { prepayId?: string; checkoutUrl?: string; universalUrl?: string };
      };

      if (bpJson.status !== 'SUCCESS' || !bpJson.data?.checkoutUrl) {
        res.status(502).json({
          error: bpJson.errorMessage || 'Binance Pay order creation failed.',
        });
        return;
      }

      upsertPurchase({
        tranId: merchantTradeNo,
        provider: 'binance_pay',
        plan,
        amount: pricing.usdtAmount,
        currency: 'USDT',
        email,
        status: 'PENDING',
        prepayId: bpJson.data.prepayId,
        createdAt: new Date().toISOString(),
      });

      res.json({
        tranId: merchantTradeNo,
        checkoutUrl: bpJson.data.checkoutUrl,
      });
    } catch {
      res.status(500).json({ error: 'Unable to connect to Binance Pay.' });
    }
  });

  app.get('/api/billing/verify', async (req: Request, res: Response) => {
    const tranId = String(req.query.tran_id || '').trim();
    if (!tranId) {
      res.status(400).json({ verified: false, error: 'Missing transaction ID' });
      return;
    }

    const record = findPurchase(tranId);
    if (!record) {
      res.status(404).json({ verified: false, error: 'Transaction not found' });
      return;
    }

    if (record.provider === 'binance_pay' && record.status !== 'PAID') {
      const bpCheck = await queryBinancePayOrder(tranId);
      if (bpCheck.paid) {
        const expiresAt = new Date(
          Date.now() + PLAN_PRICING[record.plan].durationDays * 24 * 60 * 60 * 1000
        ).toISOString();
        const updated: PurchaseRecord = {
          ...record,
          status: 'PAID',
          verifiedAt: new Date().toISOString(),
          expiresAt,
        };
        updated.receiptToken = createReceiptToken(updated);
        upsertPurchase(updated);
        res.json({ verified: true, purchase: updated });
        return;
      }
    }

    if (record.status === 'PAID') {
      res.json({ verified: true, purchase: record });
      return;
    }

    res.json({ verified: false, status: record.status });
  });

  app.post('/api/billing/restore', async (req: Request, res: Response) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const transactionId = String(req.body?.transactionId || '').trim();

    if (!email && !transactionId) {
      res.status(400).json({
        restored: false,
        error: 'Sign in with Google or enter a verified Transaction ID to restore.',
      });
      return;
    }

    const records = loadPurchases();
    const now = Date.now();

    let match = records.find(
      (r) =>
        r.status === 'PAID' &&
        (!r.expiresAt || new Date(r.expiresAt).getTime() > now) &&
        ((transactionId && r.tranId === transactionId) || (email && r.email === email))
    );

    // If user provided a Binance Pay pending trade ID, re-query Binance Pay directly
    if (!match && transactionId) {
      const pending = records.find((r) => r.tranId === transactionId);
      if (pending && pending.provider === 'binance_pay') {
        const bpCheck = await queryBinancePayOrder(transactionId);
        if (bpCheck.paid) {
          const expiresAt = new Date(
            Date.now() + PLAN_PRICING[pending.plan].durationDays * 24 * 60 * 60 * 1000
          ).toISOString();
          match = {
            ...pending,
            status: 'PAID',
            verifiedAt: new Date().toISOString(),
            expiresAt,
          };
          match.receiptToken = createReceiptToken(match);
          upsertPurchase(match);
        }
      }
    }

    if (!match) {
      res.json({
        restored: false,
        message: 'No active verified purchase found for this account or transaction ID.',
      });
      return;
    }

    res.json({
      restored: true,
      purchase: match,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Notes server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();

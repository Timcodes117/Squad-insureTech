#!/usr/bin/env node
'use strict';

/**
 * scripts/seedDemo.js
 *
 * Wipes user-facing collections and reseeds a known demo state:
 *   - Hospital "BetaHealth Demo Clinic" (verified)
 *   - PoolWallet with ₦500,000 float
 *   - User A: mature user (₦10,000 wallet, past cooldown, ready to claim)
 *   - User B: fresh user (₦500 wallet, inside 72h cooldown — proves rejection)
 *   - User C: zero-balance user (proves pay-to-activate live on stage)
 *
 * Refuses to run with NODE_ENV=production.
 *
 * Usage:  node scripts/seedDemo.js     OR     npm run seed:demo
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const config = require('../src/config/env');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const PoolWallet = require('../src/models/PoolWallet');
const Hospital = require('../src/models/Hospital');
const Claim = require('../src/models/Claim');
const Notification = require('../src/models/Notification');
const { mapOccupationToRiskTier, weeklyPremiumForTier } = require('../src/utils/riskMapping');

if (config.env === 'production') {
  // eslint-disable-next-line no-console
  console.error('seedDemo: refusing to run with NODE_ENV=production');
  process.exit(1);
}

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 10);
const PASSWORD = 'demo1234';

async function wipe() {
  await Promise.all([
    User.deleteMany({}),
    Wallet.deleteMany({}),
    PoolWallet.deleteMany({}),
    Hospital.deleteMany({}),
    Claim.deleteMany({}),
    Notification.deleteMany({}),
  ]);
}

async function seedPool() {
  const pool = await PoolWallet.findOneAndUpdate(
    { key: 'MAIN_POOL' },
    {
      $set: {
        key: 'MAIN_POOL',
        balance: 50_000_000,
        platformBalance: 0,
        ledger: [
          {
            type: 'credit',
            amount: 50_000_000,
            category: 'funding',
            bucket: 'pool',
            reference: 'SEED_DEMO',
            description: 'Demo seed: initial pool float',
            balanceAfter: 50_000_000,
            createdAt: new Date(),
          },
        ],
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return pool;
}

async function seedHospital() {
  const apiKey = `hosp_demo_${nanoid()}${nanoid()}`;
  const hospital = await Hospital.create({
    name: 'BetaHealth Demo Clinic',
    contactPhone: '08099000001',
    email: 'demo-clinic@betahealth.test',
    address: '1 Demo Plaza, Lagos',
    bankCode: '000013',
    accountNumber: '0123456789',
    accountName: 'BETAHEALTH DEMO CLINIC LTD',
    isVerified: true,
    isActive: true,
    apiKey,
  });
  return hospital;
}

async function createUser({ label, email, phone, occupation, gender, virtualAccountNumber }) {
  const riskTier = mapOccupationToRiskTier(occupation);
  const weeklyPremium = weeklyPremiumForTier(riskTier);

  const user = new User({
    email,
    phone,
    passwordHash: PASSWORD, // pre-save hook hashes
    fullName: label,
    dob: new Date('1995-04-12'),
    bvn: '12345678901',
    occupation,
    gender,
    address: 'Lagos',
    riskTier,
    weeklyPremium,
    squadCustomerIdentifier: `MBC_${nanoid()}`,
    virtualAccountNumber,
    virtualAccountBankCode: '000013',
    virtualAccountBankName: 'GTBank',
  });
  await user.save();

  const wallet = await Wallet.create({ userId: user._id, balance: 0, ledger: [] });
  return { user, wallet };
}

async function creditWalletDirect(user, amount, description) {
  await Wallet.credit({
    userId: user._id,
    amount,
    category: 'funding',
    reference: `SEED_${user.id}_${Date.now()}`,
    description,
  });
}

async function seedUsers() {
  const now = Date.now();
  const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);
  const sixDaysAgo = new Date(now - 6 * 24 * 60 * 60 * 1000);

  // User A — mature: funded, past cooldown, ready to claim.
  const a = await createUser({
    label: 'Adaeze Mature',
    email: 'demo-a@betahealth.test',
    phone: '08099000010',
    occupation: 'teacher', // low tier → ₦500/wk
    gender: 'female',
    virtualAccountNumber: '9988800010',
  });
  await creditWalletDirect(a.user, 1_000_000, 'Demo seed: pre-funded ₦10,000');
  a.user.isActive = true;
  a.user.firstPremiumAt = tenDaysAgo;
  a.user.lastPremiumBurnAt = sixDaysAgo;
  await a.user.save();

  // User B — fresh: just burned first premium, inside 72h cooldown.
  const b = await createUser({
    label: 'Bola Fresh',
    email: 'demo-b@betahealth.test',
    phone: '08099000020',
    occupation: 'teacher', // low tier → ₦500/wk
    gender: 'male',
    virtualAccountNumber: '9988800020',
  });
  await creditWalletDirect(b.user, 50_000, 'Demo seed: ₦500 remaining after first burn');
  b.user.isActive = true;
  b.user.firstPremiumAt = new Date(); // right now — inside cooldown
  b.user.lastPremiumBurnAt = new Date();
  await b.user.save();

  // User C — zero balance: registered, inactive, proves pay-to-activate live.
  const c = await createUser({
    label: 'Chika Empty',
    email: 'demo-c@betahealth.test',
    phone: '08099000030',
    occupation: 'trader', // medium tier → ₦750/wk
    gender: 'female',
    virtualAccountNumber: '9988800030',
  });
  // isActive default is false; balance 0; firstPremiumAt null. No further setup.

  return { a, b, c };
}

function printSummary({ pool, hospital, users }) {
  const naira = (k) => `₦${(k / 100).toLocaleString()}`;
  const line = (label, ...vals) =>
    // eslint-disable-next-line no-console
    console.log(`  ${label.padEnd(22)} ${vals.join('  ')}`);

  /* eslint-disable no-console */
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('  BetaHealth demo seed complete');
  console.log('────────────────────────────────────────────────────────────\n');
  console.log('  Pool wallet');
  line('balance', naira(pool.balance));
  line('platformBalance', naira(pool.platformBalance));
  console.log('\n  Hospital');
  line('name', hospital.name);
  line('id', hospital.id);
  line('apiKey', hospital.apiKey);
  line('bank', `${hospital.bankCode}/${hospital.accountNumber}`);

  const printUser = (key, u, note) => {
    console.log(`\n  User ${key} — ${note}`);
    line('email', u.user.email);
    line('password', PASSWORD);
    line('phone', u.user.phone);
    line('virtualAccountNumber', u.user.virtualAccountNumber);
    line('weeklyPremium', naira(u.user.weeklyPremium));
    line('isActive', String(u.user.isActive));
    line('firstPremiumAt', u.user.firstPremiumAt ? new Date(u.user.firstPremiumAt).toISOString() : 'null');
    line('balance', naira(u.wallet ? u.wallet.balance : 0));
  };
  printUser('A', users.a, 'mature, ready to claim');
  printUser('B', users.b, 'fresh, inside 72h cooldown');
  printUser('C', users.c, 'zero balance, pay-to-activate target');

  console.log('\n────────────────────────────────────────────────────────────');
  console.log("  Demo ready — run `npm run dev` and follow the demo script");
  console.log('────────────────────────────────────────────────────────────\n');
  /* eslint-enable no-console */
}

(async () => {
  try {
    // eslint-disable-next-line no-console
    console.log(`seedDemo: connecting to ${config.mongo.uri.replace(/\/\/.*@/, '//***@')}`);
    await mongoose.connect(config.mongo.uri);
    // eslint-disable-next-line no-console
    console.log('seedDemo: wiping User/Wallet/PoolWallet/Hospital/Claim/Notification');
    await wipe();
    const pool = await seedPool();
    const hospital = await seedHospital();
    const users = await seedUsers();

    // Refetch wallets for accurate balance display.
    users.a.wallet = await Wallet.findOne({ userId: users.a.user._id }).select('balance');
    users.b.wallet = await Wallet.findOne({ userId: users.b.user._id }).select('balance');
    users.c.wallet = await Wallet.findOne({ userId: users.c.user._id }).select('balance');

    printSummary({ pool, hospital, users });
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('seedDemo: FAILED', err);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
})();

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
export const stripe = require("stripe")(STRIPE_KEY);

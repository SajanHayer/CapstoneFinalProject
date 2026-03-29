import { Router } from "express";
import { db } from "../db/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import {stripe} from "../services/stripe";

export const stripeRouter = Router();


stripeRouter.post('/verfify', async (req, res) =>{
    try{
        const {user, paymentMethodId} = req.body;
        if (!paymentMethodId){
            return res.status(400).json({message: 'Missing payment method'});
        }
        if (!user){
            return res.status(400).json({message: 'Missing User Info'});
        }

        // Check if user exists in database
        console.log(user);
        const existing = await db
            .select({
                id: users.id,
                customer_id: users.customer_id})
            .from(users)
            .where(eq(users.email, user.email));
        
        if (existing.length <= 0) {
            return res.status(409).json({ message: "User does not exist" });
        }
        // if user exists we attach the payment method and do a verification charge
        const customer_id=existing[0].customer_id;
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer_id,
        });
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 100, // $1.00 CAD
            currency: "cad",
            customer: customer_id,
            payment_method: paymentMethodId,
            confirm: true,
            capture_method: "manual", 
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never",
            },
        });
        await stripe.paymentIntents.cancel(paymentIntent.id);
        // update if this passes 
        await db
                .update(users)
                .set({ is_verified: true })
                .where(eq(users.id, user.id));
        res.status(201).json({ message: 'succes' })        

    } catch (err){
        console.error("Verification Error", err);
        res.status(500).json({message: 'Server Error'});
    }

});





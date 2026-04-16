#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, String, Vec, Symbol, vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentLog {
    pub id: String,
    pub from: String,
    pub to: String,
    pub amount: String,
    pub date: u64,
}

#[contracttype]
pub enum DataKey {
    Payments,
}

#[contract]
pub struct DebtrixContract;

#[contractimpl]
impl DebtrixContract {
    pub fn record_payment(env: Env, payment: PaymentLog) {
        // Read existing payments
        let mut payments: Vec<PaymentLog> = env.storage().instance().get(&DataKey::Payments).unwrap_or(vec![&env]);
        
        // Push new record
        payments.push_back(payment.clone());
        
        // Save
        env.storage().instance().set(&DataKey::Payments, &payments);
        
        // Emit an event for real-time tracking
        env.events().publish(
            (Symbol::new(&env, "PaymentSent"),),
            payment
        );
    }

    pub fn get_payments(env: Env) -> Vec<PaymentLog> {
        env.storage().instance().get(&DataKey::Payments).unwrap_or(vec![&env])
    }
}

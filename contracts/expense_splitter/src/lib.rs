#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec, Symbol, vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentLog {
    pub id: String,
    pub from: Address, // changed to Address to allow auth
    pub to: String,
    pub amount: String,
    pub date: u64,
}

#[contracttype]
pub enum DataKey {
    Payments,
    RewardToken,
}

#[contract]
pub struct DebtrixContract;

#[contractimpl]
impl DebtrixContract {
    /// Set the reward token contract address
    pub fn set_reward_token(env: Env, token_addr: Address) {
        env.storage().instance().set(&DataKey::RewardToken, &token_addr);
    }

    pub fn record_payment(env: Env, payment: PaymentLog) {
        // Require auth from the sender
        payment.from.require_auth();

        // Read existing payments
        let mut payments: Vec<PaymentLog> = env.storage().instance().get(&DataKey::Payments).unwrap_or(vec![&env]);
        
        // Push new record
        payments.push_back(payment.clone());
        
        // Save
        env.storage().instance().set(&DataKey::Payments, &payments);
        
        // Emit an event for real-time tracking
        env.events().publish(
            (Symbol::new(&env, "PaymentSent"),),
            payment.clone()
        );

        // Inter-contract call to reward token to mint points for the sender
        if let Some(token_addr) = env.storage().instance().get::<_, Address>(&DataKey::RewardToken) {
            // Give 10 DBTX points per payment as a reward
            let reward_amount: i128 = 10;
            use soroban_sdk::IntoVal;
            env.invoke_contract::<()>(
                &token_addr,
                &Symbol::new(&env, "mint"),
                vec![&env, payment.from.to_val(), reward_amount.into_val(&env)]
            );
        }
    }

    pub fn get_payments(env: Env) -> Vec<PaymentLog> {
        env.storage().instance().get(&DataKey::Payments).unwrap_or(vec![&env])
    }
}

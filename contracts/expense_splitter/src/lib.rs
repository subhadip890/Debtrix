#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, String, Vec, Symbol, vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Expense {
    pub id: String,
    pub description: String,
    pub amount: String,
    pub paid_by: String,
    pub participants: Vec<String>,
    pub date: u64,
}

#[contracttype]
pub enum DataKey {
    Expenses,
}

#[contract]
pub struct DebtrixContract;

#[contractimpl]
impl DebtrixContract {
    pub fn add_expense(env: Env, expense: Expense) {
        // Read existing
        let mut expenses: Vec<Expense> = env.storage().instance().get(&DataKey::Expenses).unwrap_or(vec![&env]);
        
        // Push new
        expenses.push_back(expense.clone());
        
        // Save
        env.storage().instance().set(&DataKey::Expenses, &expenses);
        
        // Emit an event for real-time tracking
        env.events().publish(
            (Symbol::new(&env, "ExpenseAdded"),),
            expense
        );
    }

    pub fn get_expenses(env: Env) -> Vec<Expense> {
        env.storage().instance().get(&DataKey::Expenses).unwrap_or(vec![&env])
    }
}

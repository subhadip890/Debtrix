import { useState, useCallback } from 'react'

const STORAGE_KEY = 'debtrix_expenses'

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveExpenses(expenses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  } catch {}
}

/**
 * Debt calculation engine.
 * Returns array of { from, to, amount } representing simplified debts.
 */
function calculateDebts(expenses) {
  // Net balance per address (positive = owed money, negative = owes money)
  const netBalance = {}

  for (const exp of expenses) {
    const { paidBy, participants, amount, splitType, manualSplits } = exp
    const total = parseFloat(amount)

    if (!paidBy || !participants?.length || isNaN(total)) continue

    // Credit payer
    netBalance[paidBy] = (netBalance[paidBy] || 0) + total

    // Debit each participant their share
    if (splitType === 'equal') {
      const share = total / participants.length
      for (const p of participants) {
        netBalance[p] = (netBalance[p] || 0) - share
      }
    } else {
      // manual splits
      for (const p of participants) {
        const share = parseFloat(manualSplits?.[p] || 0)
        netBalance[p] = (netBalance[p] || 0) - share
      }
    }
  }

  // Simplify debts (greedy two-pointer algorithm)
  const creditors = [] // owe money to
  const debtors = []   // owe money

  for (const [address, balance] of Object.entries(netBalance)) {
    if (balance > 0.0001) creditors.push({ address, amount: balance })
    else if (balance < -0.0001) debtors.push({ address, amount: -balance })
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const settlements = []
  let i = 0, j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    const settleAmount = Math.min(creditor.amount, debtor.amount)

    if (settleAmount > 0.0001) {
      settlements.push({
        from: debtor.address,
        to: creditor.address,
        amount: parseFloat(settleAmount.toFixed(7)),
      })
    }

    creditor.amount -= settleAmount
    debtor.amount -= settleAmount

    if (creditor.amount < 0.0001) i++
    if (debtor.amount < 0.0001) j++
  }

  return settlements
}

export function useExpenses() {
  const [expenses, setExpenses] = useState(loadExpenses)

  const addExpense = useCallback((expense) => {
    const newExpense = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...expense,
    }
    setExpenses((prev) => {
      const updated = [newExpense, ...prev]
      saveExpenses(updated)
      return updated
    })
    return newExpense
  }, [])

  const removeExpense = useCallback((id) => {
    setExpenses((prev) => {
      const updated = prev.filter((e) => e.id !== id)
      saveExpenses(updated)
      return updated
    })
  }, [])

  const clearAllExpenses = useCallback(() => {
    setExpenses([])
    saveExpenses([])
  }, [])

  const debts = calculateDebts(expenses)

  return {
    expenses,
    debts,
    addExpense,
    removeExpense,
    clearAllExpenses,
  }
}

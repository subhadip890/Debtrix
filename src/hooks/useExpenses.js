import { useState, useCallback, useEffect } from 'react'
import * as StellarSdk from '@stellar/stellar-sdk'
import { CONTRACT_ID } from './useContract'

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

  const addExpenseLocally = useCallback((expense) => {
    setExpenses((prev) => {
      // Prevent duplicates from event stream
      if (prev.some(e => e.id === expense.id)) return prev;
      const updated = [expense, ...prev].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
      saveExpenses(updated)
      return updated
    })
  }, [])

  const addExpense = useCallback((expense) => {
    const newExpense = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...expense,
    }
    // We update UI optimistically, actual on-chain persistence should be 
    // handled by calling submitExpenseToChain from useContract in the component.
    addExpenseLocally(newExpense)
    return newExpense
  }, [addExpenseLocally])

  const removeExpense = useCallback((id) => {
    setExpenses((prev) => {
      const updated = prev.filter((e) => e.id !== id)
      saveExpenses(updated)
      return updated
    })
  }, [])

  // Real-time Event Synchronization
  useEffect(() => {
    if (!CONTRACT_ID || CONTRACT_ID.startsWith('CACAA')) return; // Skip if placeholder

    const server = new StellarSdk.SorobanRpc.Server('https://soroban-testnet.stellar.org')
    let lastLedger = 0;

    const pollEvents = async () => {
      try {
        if (lastLedger === 0) {
           const latest = await server.getLatestLedger()
           lastLedger = latest.sequence
        }

        const eventsResponse = await server.getEvents({
          startLedger: lastLedger,
          filters: [
            {
              type: 'contract',
              contractIds: [CONTRACT_ID]
            }
          ],
          limit: 100
        })

        if (eventsResponse.events && eventsResponse.events.length > 0) {
          for (const ev of eventsResponse.events) {
             const topics = ev.topic
             // Check if topic matches ExpenseAdded
             if (topics[0] && topics[0].value() === 'ExpenseAdded') {
                const scVal = ev.value
                // Assuming scVal is a map structured identically to our Expense struct
                // In a production scenario, we parse ScVal safely
                const data = StellarSdk.scValToNative(scVal)
                const newExpense = {
                   id: data.id,
                   description: data.description,
                   amount: data.amount,
                   paidBy: data.paid_by,
                   participants: data.participants,
                   createdAt: new Date(Number(data.date)).toISOString(),
                   splitType: 'equal',
                }
                addExpenseLocally(newExpense)
             }
          }
          lastLedger = eventsResponse.latestLedger
        }
      } catch (err) {
        console.warn('Event sync error:', err)
      }
    }

    const interval = setInterval(pollEvents, 10000)
    return () => clearInterval(interval)
  }, [addExpenseLocally])

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

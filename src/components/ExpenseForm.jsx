import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Users, DollarSign, SplitSquareHorizontal } from 'lucide-react'
import * as StellarSdk from '@stellar/stellar-sdk'

function isValidStellarAddress(addr) {
  try {
    return StellarSdk.StrKey.isValidEd25519PublicKey(addr)
  } catch {
    return false
  }
}

const EMPTY_FORM = {
  description: '',
  amount: '',
  paidBy: '',
  splitType: 'equal',
  participants: [''],
  manualSplits: {},
}

export default function ExpenseForm({ onAdd, onClose, myPublicKey }) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    paidBy: myPublicKey || '',
    participants: [myPublicKey || ''],
  })
  const [errors, setErrors] = useState({})

  // Pre-fill when wallet connects
  useEffect(() => {
    if (myPublicKey) {
      setForm((f) => ({
        ...f,
        paidBy: f.paidBy || myPublicKey,
        participants: f.participants[0] === '' ? [myPublicKey] : f.participants,
      }))
    }
  }, [myPublicKey])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const validate = () => {
    const e = {}
    if (!form.description.trim()) e.description = 'Description is required.'
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = 'Enter a valid positive amount.'

    if (!form.paidBy.trim()) {
      e.paidBy = 'Paid-by address is required.'
    } else if (!isValidStellarAddress(form.paidBy)) {
      e.paidBy = 'Must be a valid Stellar G… address.'
    }

    const validParticipants = form.participants.filter((p) => p.trim())
    if (validParticipants.length === 0) {
      e.participants = 'Add at least one participant.'
    } else {
      const invalidP = validParticipants.find((p) => !isValidStellarAddress(p))
      if (invalidP) e.participants = `Invalid address: ${invalidP.slice(0, 10)}…`
    }

    if (form.splitType === 'manual') {
      const totalManual = validParticipants.reduce(
        (sum, p) => sum + parseFloat(form.manualSplits[p] || 0),
        0
      )
      if (Math.abs(totalManual - amt) > 0.0001) {
        e.manual = `Manual splits must sum to ${amt} XLM (currently ${totalManual.toFixed(4)}).`
      }
    }

    if (!form.participants.includes(form.paidBy)) {
      e.paidBy = 'Payer must be in the participants list.'
    }

    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const validParticipants = form.participants.filter((p) => p.trim())
    onAdd({
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      paidBy: form.paidBy,
      splitType: form.splitType,
      participants: validParticipants,
      manualSplits: form.splitType === 'manual' ? form.manualSplits : {},
    })
    onClose()
  }

  const addParticipant = () => {
    setForm((f) => ({ ...f, participants: [...f.participants, ''] }))
  }

  const removeParticipant = (idx) => {
    setForm((f) => {
      const updated = f.participants.filter((_, i) => i !== idx)
      return { ...f, participants: updated.length ? updated : [''] }
    })
  }

  const updateParticipant = (idx, val) => {
    setForm((f) => {
      const updated = [...f.participants]
      updated[idx] = val
      return { ...f, participants: updated }
    })
  }

  const updateManualSplit = (addr, val) => {
    setForm((f) => ({
      ...f,
      manualSplits: { ...f.manualSplits, [addr]: val },
    }))
  }

  const totalAmount = parseFloat(form.amount) || 0
  const validParticipants = form.participants.filter((p) => p.trim())
  const equalShare =
    validParticipants.length > 0 ? (totalAmount / validParticipants.length).toFixed(4) : '0'

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Add Expense"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Add Expense
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Split a bill with your group
            </p>
          </div>
          <button
            id="btn-close-expense-form"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.5rem', borderRadius: '8px' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Description */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="exp-description">
              Description
            </label>
            <input
              id="exp-description"
              className="input"
              placeholder="e.g. Dinner, Netflix, Groceries"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={80}
            />
            {errors.description && (
              <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                {errors.description}
              </p>
            )}
          </div>

          {/* Amount */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="exp-amount">
              Total Amount (XLM)
            </label>
            <div style={{ position: 'relative' }}>
              <DollarSign
                size={15}
                style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="exp-amount"
                className="input"
                style={{ paddingLeft: '2.25rem' }}
                type="number"
                min="0"
                step="0.0001"
                placeholder="0.0000"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            {errors.amount && (
              <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                {errors.amount}
              </p>
            )}
          </div>

          {/* Paid By */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="label" htmlFor="exp-paidBy">
              Paid By (Stellar Address)
            </label>
            <input
              id="exp-paidBy"
              className="input"
              placeholder="G… Stellar address"
              value={form.paidBy}
              onChange={(e) => setForm((f) => ({ ...f, paidBy: e.target.value }))}
              style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
            {errors.paidBy && (
              <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                {errors.paidBy}
              </p>
            )}
          </div>

          {/* Split Type */}
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Split Type</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['equal', 'manual'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, splitType: type }))}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    borderRadius: '8px',
                    border: `1px solid ${form.splitType === type ? 'var(--accent-from)' : 'var(--border)'}`,
                    background:
                      form.splitType === type
                        ? 'rgba(124, 58, 237, 0.15)'
                        : 'var(--bg-surface)',
                    color:
                      form.splitType === type ? '#a78bfa' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <SplitSquareHorizontal size={14} />
                  {type === 'equal' ? 'Equal Split' : 'Manual Split'}
                </button>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <label className="label" style={{ margin: 0 }}>
                <Users size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Participants
              </label>
              {form.splitType === 'equal' && totalAmount > 0 && validParticipants.length > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                  {equalShare} XLM each
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {form.participants.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      id={`participant-${idx}`}
                      className="input"
                      placeholder="G… Stellar address"
                      value={p}
                      onChange={(e) => updateParticipant(idx, e.target.value)}
                      style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                    />
                    {form.splitType === 'manual' && p.trim() && (
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.0001"
                        placeholder="Share (XLM)"
                        value={form.manualSplits[p] || ''}
                        onChange={(e) => updateManualSplit(p, e.target.value)}
                        style={{ marginTop: '0.375rem', fontSize: '0.8rem' }}
                      />
                    )}
                  </div>
                  {form.participants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(idx)}
                      className="btn-danger"
                      style={{ padding: '0.5rem', borderRadius: '8px', marginTop: '0.125rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {errors.participants && (
              <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                {errors.participants}
              </p>
            )}
            {errors.manual && (
              <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                {errors.manual}
              </p>
            )}

            <button
              type="button"
              onClick={addParticipant}
              className="btn-secondary"
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              <Plus size={14} />
              Add Participant
            </button>
          </div>

          <div className="divider" />

          {/* Submit */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" id="btn-submit-expense" className="btn-primary">
              <Plus size={14} />
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

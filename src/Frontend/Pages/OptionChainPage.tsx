import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import './OptionChainPage.css'

interface OptionChainApiResponse {
  success: boolean
  data: any
}

interface OptionChainRow {
  strikePrice: number
  call?: Record<string, any> | null
  put?: Record<string, any> | null
}

const deriveRows = (payload: any): OptionChainRow[] => {
  if (!payload) {
    return []
  }

  const data = payload?.data ?? payload
  const candidates =
    data?.optionsChain ||
    data?.chains ||
    data?.option_chain ||
    data?.items ||
    (Array.isArray(data) ? data : [])

  if (!Array.isArray(candidates)) {
    return []
  }

  const byStrike = new Map<number, OptionChainRow>()

  candidates.forEach((item: any) => {
    const optionType = item?.option_type || item?.optionType || item?.type
    const strike =
      item?.strike_price ??
      item?.strikePrice ??
      item?.strike ??
      item?.strike_price_ce ??
      item?.strike_price_pe

    if (typeof strike !== 'number' || optionType === '' || optionType === undefined) {
      return
    }

    if (!byStrike.has(strike)) {
      byStrike.set(strike, { strikePrice: strike, call: null, put: null })
    }
    const record = byStrike.get(strike)!
    if (optionType === 'CE') {
      record.call = item
    } else if (optionType === 'PE') {
      record.put = item
    }
  })

  return Array.from(byStrike.values()).sort((a, b) => a.strikePrice - b.strikePrice)
}

const getNextThursdays = (count: number = 5) => {
  const dates = []
  const today = new Date()
  // Start checking from today
  let current = new Date(today)

  while (dates.length < count) {
    // 4 is Thursday (Sunday is 0)
    if (current.getDay() === 4) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

const OptionChainPage = () => {
  const [symbols, setSymbols] = useState<any[]>([])
  const [symbol, setSymbol] = useState('')
  const [strikecount, setStrikecount] = useState(5)
  const [expiryDate, setExpiryDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSymbols, setLoadingSymbols] = useState(true)
  const [symbolError, setSymbolError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<OptionChainApiResponse | null>(null)

  const expiryDates = useMemo(() => getNextThursdays(8), [])

  const rows = useMemo(() => deriveRows(response?.data), [response])
  const lastUpdated =
    response?.data?.timestamp || response?.data?.ts || response?.data?.last_updated || ''

  useEffect(() => {
    fetchSymbols()
  }, [])

  const fetchSymbols = async () => {
    try {
      setLoadingSymbols(true)
      setSymbolError(null)
      const res = await api.get('/api/master/dropdown')
      if (res.data.success && Array.isArray(res.data.data)) {
        setSymbols(res.data.data)
        if (res.data.data.length > 0) {
          setSymbol(res.data.data[0].value)
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch symbols:', err)
      setSymbolError(err?.response?.data?.detail || err?.message || 'Failed to load symbols')
    } finally {
      setLoadingSymbols(false)
    }
  }

  const fetchOptionChain = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault()
      if (!symbol) return

      setLoading(true)
      setError(null)
      try {
        // Convert expiry date to unix timestamp if selected
        let timestampParam = undefined
        if (expiryDate) {
          const date = new Date(expiryDate)
          // Set time to 15:30:00 for end of trading day approximation or just use the date
          // Usually API expects epoch seconds.
          // Let's use the start of the day or specific time based on API requirement.
          // Assuming standard unix epoch seconds.
          timestampParam = Math.floor(date.getTime() / 1000).toString()
        }

        const res = await api.get<OptionChainApiResponse>('/api/fyers/option-chain', {
          params: {
            symbol: symbol.trim(),
            strikecount,
            timestamp: timestampParam,
          },
        })
        setResponse(res.data)
      } catch (err: any) {
        const message = err?.response?.data?.detail || err?.message || 'Failed to fetch option chain'
        setError(message)
        setResponse(null)
      } finally {
        setLoading(false)
      }
    },
    [symbol, strikecount, expiryDate]
  )

  useEffect(() => {
    if (symbol) {
      fetchOptionChain()
    }
  }, [fetchOptionChain, symbol])

  return (
    <div className="option-chain-page">
      <div className="option-chain-header">
        <div>
          <h1>Option Chain</h1>
          <p>View live strikes powered by Fyers</p>
        </div>
        <form className="option-chain-form" onSubmit={fetchOptionChain}>
          <label>
            Symbol
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
              disabled={loadingSymbols || !!symbolError}
            >
              {loadingSymbols ? (
                <option>Loading symbols...</option>
              ) : symbolError ? (
                <option>Error loading symbols</option>
              ) : (
                symbols.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))
              )}
            </select>
            {symbolError && <span style={{ fontSize: '0.75rem', color: 'var(--color-bearish)' }}>{symbolError}</span>}
          </label>
          <label>
            Expiry Date
            <select
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            >
              <option value="">Current / Monthly</option>
              {expiryDates.map((date) => (
                <option key={date.toISOString()} value={date.toISOString()}>
                  {date.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    weekday: 'short'
                  })}
                </option>
              ))}
            </select>
          </label>
          <label>
            Strike Count
            <input
              type="number"
              min={1}
              max={50}
              value={strikecount}
              onChange={(e) => setStrikecount(Number(e.target.value))}
              required
            />
          </label>
          <button type="submit" disabled={loading || loadingSymbols}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </form>
      </div>

      {error && (
        <div className="option-chain-error">
          <span role="img" aria-label="error">
            ⚠️
          </span>
          {error}
        </div>
      )}

      <div className="option-chain-meta">
        <div>
          <span className="label">Status</span>
          <strong
            style={{
              color:
                response?.success
                  ? 'var(--color-bullish)'
                  : 'var(--text-muted)',
            }}
          >
            {response?.success ? 'Connected' : '---'}
          </strong>
        </div>
        <div>
          <span className="label">Rows</span>
          <strong>{rows.length}</strong>
        </div>
        <div>
          <span className="label">Last Updated</span>
          <strong>{lastUpdated || '---'}</strong>
        </div>
      </div>

      <div className="option-chain-table-wrapper">
        {rows.length === 0 ? (
          <div className="option-chain-empty">
            {loading ? (
              <>
                <div className="spinner"></div>
                <p>Fetching option chain data...</p>
              </>
            ) : (
              <>
                <span style={{ fontSize: '2rem' }}>📭</span>
                <p>No strikes returned for this symbol.</p>
              </>
            )}
          </div>
        ) : (
          <table className="option-chain-table">
            <thead>
              <tr>
                <th>Strike</th>
                <th>Call LTP</th>
                <th>Call IV</th>
                <th>Call OI</th>
                <th>Put LTP</th>
                <th>Put IV</th>
                <th>Put OI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row.strikePrice}-${idx}`}>
                  <td>{row.strikePrice}</td>
                  <td style={{ color: 'var(--color-bullish)' }}>{row.call?.ltp ?? '-'}</td>
                  <td>{row.call?.iv ?? '-'}</td>
                  <td>{row.call?.oi ?? row.call?.open_interest ?? '-'}</td>
                  <td style={{ color: 'var(--color-bearish)' }}>{row.put?.ltp ?? '-'}</td>
                  <td>{row.put?.iv ?? '-'}</td>
                  <td>{row.put?.oi ?? row.put?.open_interest ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {response && (
        <details className="option-chain-raw">
          <summary>Raw response</summary>
          <pre>{JSON.stringify(response.data, null, 2)}</pre>
        </details>
      )}
    </div>
  )
}

export default OptionChainPage



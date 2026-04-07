import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'number-tracker-records-v1'
const NUMBER_OPTIONS = Array.from({ length: 49 }, (_, index) => index + 1)
const today = new Date().toISOString().slice(0, 10)
const ZODIAC_GROUPS = [
  { name: '鼠', numbers: [7, 19, 31, 43] },
  { name: '牛', numbers: [6, 18, 30, 42] },
  { name: '虎', numbers: [5, 17, 29, 41] },
  { name: '兔', numbers: [4, 16, 28, 40] },
  { name: '龙', numbers: [3, 15, 27, 39] },
  { name: '蛇', numbers: [2, 14, 26, 38] },
  { name: '马', numbers: [1, 13, 25, 37, 49] },
  { name: '羊', numbers: [12, 24, 35, 47] },
  { name: '猴', numbers: [11, 23, 35, 47] },
  { name: '鸡', numbers: [10, 22, 34, 46] },
  { name: '狗', numbers: [9, 21, 33, 45] },
  { name: '猪', numbers: [8, 20, 32, 44] },
]

const demoRecords = [
  { id: crypto.randomUUID(), number: 1, amount: 300, date: today, note: '上午' },
  { id: crypto.randomUUID(), number: 2, amount: 300, date: today, note: '中午' },
  { id: crypto.randomUUID(), number: 1, amount: 200, date: today, note: '补单' },
  { id: crypto.randomUUID(), number: 5, amount: 800, date: today, note: '晚上' },
  { id: crypto.randomUUID(), number: 12, amount: 450, date: today, note: '加单' },
  { id: crypto.randomUUID(), number: 5, amount: 260, date: today, note: '回补' },
  { id: crypto.randomUUID(), number: 3, amount: 180, date: '2026-03-28', note: '昨天' },
  { id: crypto.randomUUID(), number: 8, amount: 520, date: '2026-03-28', note: '昨天' },
  { id: crypto.randomUUID(), number: 1, amount: 120, date: '2026-03-27', note: '前天' },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateLabel(value) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

function getDailyGroups(records) {
  const map = new Map()

  records.forEach((record) => {
    if (!map.has(record.date)) {
      map.set(record.date, {
        date: record.date,
        total: 0,
        entries: new Map(),
      })
    }

    const day = map.get(record.date)
    day.total += record.amount
    day.entries.set(record.number, (day.entries.get(record.number) ?? 0) + record.amount)
  })

  return [...map.values()]
    .map((day) => ({
      date: day.date,
      total: day.total,
      entries: [...day.entries.entries()]
        .map(([number, amount]) => ({ number, amount }))
        .sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

function getNumberTotals(records) {
  return NUMBER_OPTIONS.map((number) => {
    const amount = records
      .filter((record) => record.number === number)
      .reduce((sum, record) => sum + record.amount, 0)

    return {
      number,
      amount,
    }
  })
}

function Chart({ items, color, emptyText, valueFormatter }) {
  const maxValue = Math.max(...items.map((item) => item.value), 0)

  if (!items.length || maxValue === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const width = Math.max((item.value / maxValue) * 100, item.value > 0 ? 10 : 0)

        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{valueFormatter(item.value)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200/70">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function App() {
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : demoRecords
    } catch {
      return demoRecords
    }
  })
  const [form, setForm] = useState({
    number: 1,
    amount: '',
    date: today,
    note: '',
  })
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentMessage, setAdjustmentMessage] = useState('')
  const [selectedZodiac, setSelectedZodiac] = useState(null)
  const [zodiacAmount, setZodiacAmount] = useState('')
  const [zodiacMessage, setZodiacMessage] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  const numberTotals = useMemo(() => getNumberTotals(records), [records])
  const sortedNumberTotals = useMemo(
    () => [...numberTotals].sort((a, b) => b.amount - a.amount),
    [numberTotals],
  )
  const dailyGroups = useMemo(() => getDailyGroups(records), [records])

  const totalAmount = records.reduce((sum, record) => sum + record.amount, 0)
  const activeNumbers = numberTotals.filter((item) => item.amount > 0).length
  const topNumber = sortedNumberTotals.find((item) => item.amount > 0)
  const todayTotal =
    dailyGroups.find((group) => group.date === form.date)?.total ??
    dailyGroups.find((group) => group.date === today)?.total ??
    0
  const selectedNumberTotal = selectedNumber
    ? numberTotals.find((item) => item.number === selectedNumber)?.amount ?? 0
    : 0
  const selectedZodiacGroup = selectedZodiac
    ? ZODIAC_GROUPS.find((group) => group.name === selectedZodiac) ?? null
    : null

  function handleSubmit(event) {
    event.preventDefault()

    const amount = Number(form.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      return
    }

    const nextRecord = {
      id: crypto.randomUUID(),
      number: Number(form.number),
      amount,
      date: form.date,
      note: form.note.trim(),
    }

    setRecords((current) => [nextRecord, ...current])
    setForm((current) => ({
      ...current,
      note: '',
    }))
  }

  function applyNumberAdjustment(direction) {
    const amount = Number(adjustmentAmount)

    if (!selectedNumber) {
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setAdjustmentMessage('请输入大于 0 的金额。')
      return
    }

    if (direction === 'subtract' && amount > selectedNumberTotal) {
      setAdjustmentMessage('删除金额不能大于当前号码累计金额。')
      return
    }

    const signedAmount = direction === 'add' ? amount : -amount
    const note = direction === 'add' ? '总览增加' : '总览删除'

    setRecords((current) => [
      {
        id: crypto.randomUUID(),
        number: selectedNumber,
        amount: signedAmount,
        date: form.date,
        note,
      },
      ...current,
    ])

    setAdjustmentAmount('')
    setAdjustmentMessage(
      direction === 'add'
        ? `已给 ${selectedNumber} 号增加 ${formatCurrency(amount)}`
        : `已给 ${selectedNumber} 号删除 ${formatCurrency(amount)}`,
    )
  }

  function applyZodiacAdjustment(direction) {
    const amount = Number(zodiacAmount)

    if (!selectedZodiacGroup) {
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setZodiacMessage('请输入大于 0 的金额。')
      return
    }

    if (amount % selectedZodiacGroup.numbers.length !== 0) {
      setZodiacMessage(
        `当前生肖有 ${selectedZodiacGroup.numbers.length} 个号码，金额必须能整除，才能平均分配。`,
      )
      return
    }

    const perNumberAmount = amount / selectedZodiacGroup.numbers.length

    if (
      direction === 'subtract' &&
      selectedZodiacGroup.numbers.some((number) => {
        const total = numberTotals.find((item) => item.number === number)?.amount ?? 0
        return total < perNumberAmount
      })
    ) {
      setZodiacMessage('有号码当前金额不足，不能按这个金额删除。')
      return
    }

    const note = direction === 'add' ? `${selectedZodiac}生效增加` : `${selectedZodiac}生效删除`
    const signedAmount = direction === 'add' ? perNumberAmount : -perNumberAmount

    setRecords((current) => [
      ...selectedZodiacGroup.numbers.map((number) => ({
        id: crypto.randomUUID(),
        number,
        amount: signedAmount,
        date: form.date,
        note,
      })),
      ...current,
    ])

    setZodiacAmount('')
    setZodiacMessage(
      direction === 'add'
        ? `已给 ${selectedZodiac} 平均增加 ${formatCurrency(amount)}，每个号码 ${formatCurrency(
            perNumberAmount,
          )}`
        : `已给 ${selectedZodiac} 平均删除 ${formatCurrency(amount)}，每个号码 ${formatCurrency(
            perNumberAmount,
          )}`,
    )
  }

  function removeRecord(id) {
    setRecords((current) => current.filter((record) => record.id !== id))
  }

  function resetToDemo() {
    setRecords(demoRecords)
  }

  function clearAll() {
    setRecords([])
  }

  const topChartItems = sortedNumberTotals
    .filter((item) => item.amount > 0)
    .slice(0, 10)
    .map((item) => ({
      label: `${item.number} 号`,
      value: item.amount,
    }))

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.2),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-amber-700 uppercase">
                Number Ledger Demo
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                1-49 号码记账统计
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                你可以手动录入每一笔，例如“1号 300、2号 300、1号 200、5号
                800”。页面会自动汇总每天、每个号码的金额，并生成图表。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-3xl bg-slate-950 px-4 py-3 text-white">
                <p className="text-xs text-white/70">总金额</p>
                <p className="mt-2 text-lg font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="rounded-3xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">总笔数</p>
                <p className="mt-2 text-lg font-bold">{records.length}</p>
              </div>
              <div className="rounded-3xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">活跃号码</p>
                <p className="mt-2 text-lg font-bold">{activeNumbers}</p>
              </div>
              <div className="rounded-3xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">最高号码</p>
                <p className="mt-2 text-lg font-bold">
                  {topNumber ? `${topNumber.number}号` : '暂无'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">新增记录</h2>
                  <p className="text-sm text-slate-500">手机上单手也能快速录入</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                  <p className="text-xs text-emerald-700">今日金额</p>
                  <p className="text-sm font-bold text-emerald-900">
                    {formatCurrency(todayTotal)}
                  </p>
                </div>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">号码</span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-amber-400 focus:bg-white"
                    value={form.number}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        number: Number(event.target.value),
                      }))
                    }
                  >
                    {NUMBER_OPTIONS.map((number) => (
                      <option key={number} value={number}>
                        {number} 号
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">金额</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-amber-400 focus:bg-white"
                    inputMode="numeric"
                    min="0"
                    placeholder="例如 300"
                    type="number"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">日期</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-amber-400 focus:bg-white"
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    备注
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-amber-400 focus:bg-white"
                    placeholder="可选，例如 上午、补单"
                    type="text"
                    value={form.note}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                  />
                </label>

                <button
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
                  type="submit"
                >
                  添加这笔记录
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  type="button"
                  onClick={resetToDemo}
                >
                  载入示例数据
                </button>
                <button
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                  type="button"
                  onClick={clearAll}
                >
                  清空全部
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">最近记录</h2>
                  <p className="text-sm text-slate-500">每条都可以删掉重记</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {records.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    还没有记录，先录入一笔看看。
                  </p>
                ) : (
                  records.slice(0, 10).map((record) => (
                    <article
                      key={record.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-bold text-slate-900">
                            {record.number} 号
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{record.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-emerald-700">
                            {formatCurrency(record.amount)}
                          </p>
                          <button
                            className="mt-2 text-sm text-rose-600"
                            type="button"
                            onClick={() => removeRecord(record.id)}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      {record.note ? (
                        <p className="mt-3 text-sm text-slate-600">{record.note}</p>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur">
                <h2 className="text-lg font-bold text-slate-950">号码金额排行</h2>
                <p className="mt-1 text-sm text-slate-500">自动找出金额最高的号码</p>
                <div className="mt-5">
                  <Chart
                    color="bg-gradient-to-r from-amber-400 to-orange-500"
                    emptyText="还没有数据，图表会在录入后自动出现。"
                    items={topChartItems}
                    valueFormatter={formatCurrency}
                  />
                </div>
              </article>

              <article className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur">
                <h2 className="text-lg font-bold text-slate-950">12 生效码表</h2>
                <p className="mt-1 text-sm text-slate-500">
                  选中生肖后，金额会平均分到对应号码；除不尽时不允许操作
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {ZODIAC_GROUPS.map((group) => (
                    <button
                      key={group.name}
                      className={`rounded-3xl border px-4 py-4 text-left transition ${
                        selectedZodiac === group.name
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                      type="button"
                      onClick={() => {
                        setSelectedZodiac(group.name)
                        setZodiacMessage('')
                      }}
                    >
                      <p
                        className={`text-sm font-bold ${
                          selectedZodiac === group.name ? 'text-white' : 'text-slate-950'
                        }`}
                      >
                        {group.name}
                      </p>
                      <p
                        className={`mt-2 text-xs leading-5 ${
                          selectedZodiac === group.name ? 'text-white/75' : 'text-slate-500'
                        }`}
                      >
                        {group.numbers.join(' ')}
                      </p>
                    </button>
                  ))}
                </div>

                {selectedZodiacGroup ? (
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      当前生效：{selectedZodiacGroup.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      对应号码：{selectedZodiacGroup.numbers.join('、')}
                    </p>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="block flex-1">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          生效金额
                        </span>
                        <input
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-amber-400"
                          inputMode="numeric"
                          min="0"
                          placeholder="例如 200"
                          type="number"
                          value={zodiacAmount}
                          onChange={(event) => setZodiacAmount(event.target.value)}
                        />
                      </label>

                      <button
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                        type="button"
                        onClick={() => applyZodiacAdjustment('add')}
                      >
                        增加金额
                      </button>

                      <button
                        className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
                        type="button"
                        onClick={() => applyZodiacAdjustment('subtract')}
                      >
                        删除金额
                      </button>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      当前按 {selectedZodiacGroup.numbers.length} 个号码平均分配，记录日期使用{' '}
                      {form.date}。
                    </p>

                    {zodiacMessage ? (
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {zodiacMessage}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            </section>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">1-49 号码总览</h2>
                  <p className="text-sm text-slate-500">每个号码一眼看到累计金额</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
                {numberTotals.map((item) => (
                  <button
                    key={item.number}
                    className={`rounded-3xl border px-4 py-4 text-left transition ${
                      item.amount > 0
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200 bg-slate-50'
                    } ${
                      selectedNumber === item.number
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : ''
                    }`}
                    type="button"
                    onClick={() => {
                      setSelectedNumber(item.number)
                      setAdjustmentMessage('')
                    }}
                  >
                    <p
                      className={`text-xs ${
                        selectedNumber === item.number ? 'text-white/70' : 'text-slate-500'
                      }`}
                    >
                      {item.number} 号
                    </p>
                    <p
                      className={`mt-2 text-lg font-bold ${
                        selectedNumber === item.number ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      {formatCurrency(item.amount)}
                    </p>
                    <p
                      className={`mt-2 text-xs ${
                        selectedNumber === item.number ? 'text-white/75' : 'text-slate-500'
                      }`}
                    >
                      点我修改
                    </p>
                  </button>
                ))}
              </div>

              {selectedNumber ? (
                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        正在修改 {selectedNumber} 号
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        当前累计 {formatCurrency(selectedNumberTotal)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          修改金额
                        </span>
                        <input
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-amber-400"
                          inputMode="numeric"
                          min="0"
                          placeholder="例如 200"
                          type="number"
                          value={adjustmentAmount}
                          onChange={(event) => setAdjustmentAmount(event.target.value)}
                        />
                      </label>

                      <button
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                        type="button"
                        onClick={() => applyNumberAdjustment('add')}
                      >
                        增加金额
                      </button>

                      <button
                        className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
                        type="button"
                        onClick={() => applyNumberAdjustment('subtract')}
                      >
                        删除金额
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    这次修改会按当前日期 {form.date} 记入一条新记录，方便后面统计。
                  </p>

                  {adjustmentMessage ? (
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {adjustmentMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">每日明细统计</h2>
                  <p className="text-sm text-slate-500">按日期查看当天哪些号码有金额</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {dailyGroups.length === 0 ? (
                  <p className="rounded-3xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    暂无每日统计。
                  </p>
                ) : (
                  dailyGroups.map((group) => (
                    <article
                      key={group.date}
                      className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-bold text-slate-950">
                            {formatDateLabel(group.date)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{group.date}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white">
                          {formatCurrency(group.total)}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {group.entries.map((entry) => (
                          <span
                            key={`${group.date}-${entry.number}`}
                            className="rounded-full bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200"
                          >
                            {entry.number}号 {formatCurrency(entry.amount)}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_10px_40px_rgba(15,23,42,0.2)]">
              <h2 className="text-lg font-bold">手机像 App 一样使用</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                这个 demo 部署到网站后，会有固定网址。安卓 Chrome
                可以“添加到主屏幕”，iPhone Safari 可以“添加到主屏幕”，点开后就会很像一个独立 App。
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App

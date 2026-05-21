import React from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface BarDataItem {
  month: string
  income: number
  expenses: number
}

interface BarChartProps {
  data: BarDataItem[]
}

export function BarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RechartsBarChart data={data} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `৳${v}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text-primary)',
            fontSize: '0.8rem',
          }}
          formatter={(value: number) => [`৳${value.toLocaleString()}`, '']}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}
        />
        <Bar dataKey="income" name="Income" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

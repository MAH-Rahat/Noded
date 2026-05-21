import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DonutSlice {
  name: string
  value: number
  color: string
  overBudget?: boolean
}

interface DonutChartProps {
  data: DonutSlice[]
}

const RADIAN = Math.PI / 180

export function DonutChart({ data }: DonutChartProps) {
  if (!data.length) return null

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.overBudget ? 'var(--color-danger)' : entry.color}
              stroke="var(--color-surface)"
              strokeWidth={2}
            />
          ))}
        </Pie>
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
      </PieChart>
    </ResponsiveContainer>
  )
}

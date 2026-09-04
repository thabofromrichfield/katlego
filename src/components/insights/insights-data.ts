/* Sample dataset for the Katlego Insights dashboard.
   Structured so live RPC / query data can be swapped in later without
   touching the layout components. */

export interface KpiSample {
  id: string
  label: string
  value: string
  delta: number
  deltaLabel: string
  spark: number[]
  tone: 'navy' | 'orange' | 'green' | 'sky'
}

export interface TrendPoint {
  date: Date
  shipments: number
  onTime: number
}

export interface ModeDatum {
  label: string
  value: number
  color: string
}

export interface LaneDatum {
  label: string
  value: number
}

export interface AgentRow {
  id: string
  name: string
  role: string
  initials: string
  hue: number
  stat: string
  statLabel: string
  score: number // 0..100 for the little progress bar
}

export interface ShipmentRow {
  id: string
  ref: string
  customer: string
  route: string
  mode: 'Air' | 'Sea' | 'Road'
  status: 'In Transit' | 'At Customs' | 'Cleared' | 'Delivered' | 'Awaiting Docs'
  value: string
  date: string
}

export const kpis: KpiSample[] = [
  {
    id: 'shipments',
    label: 'Total Shipments',
    value: '1 284',
    delta: 12.4,
    deltaLabel: 'vs last month',
    spark: [46, 54, 49, 62, 58, 71, 66, 79, 74, 88, 83, 96, 91, 104, 99, 112, 108, 121, 116, 129, 124, 136, 131, 142, 138, 150, 146, 157, 152, 164],
    tone: 'navy',
  },
  {
    id: 'intransit',
    label: 'In Transit Now',
    value: '86',
    delta: 6.1,
    deltaLabel: 'shipments moving',
    spark: [28, 33, 30, 38, 36, 42, 40, 47, 44, 52, 50, 58, 54, 62, 60, 66, 63, 72, 69, 78, 74, 82, 79, 86],
    tone: 'orange',
  },
  {
    id: 'ontime',
    label: 'On-Time Delivery',
    value: '96.8%',
    delta: 1.4,
    deltaLabel: 'vs last month',
    spark: [91, 92, 91.5, 93, 92.4, 93.8, 93.1, 94.2, 93.6, 94.9, 94.2, 95.3, 94.7, 95.8, 95.1, 96.1, 95.5, 96.4, 95.8, 96.8],
    tone: 'green',
  },
  {
    id: 'util',
    label: 'Fleet Utilisation',
    value: '74%',
    delta: 3.2,
    deltaLabel: 'vs last month',
    spark: [58, 61, 60, 64, 62, 66, 65, 69, 67, 70, 68, 72, 70, 73, 71, 74],
    tone: 'sky',
  },
]

export function trendSeries(days = 30): TrendPoint[] {
  const out: TrendPoint[] = []
  const base = new Date(Date.UTC(2026, 7, 6))
  // realistic-looking weekdays-up pattern
  const seed = [52, 61, 48, 44, 57, 63, 38, 55, 64, 50, 46, 60, 66, 41, 58, 66, 52, 49, 63, 69, 43, 60, 69, 54, 51, 65, 72, 46, 62, 71]
  for (let i = 0; i < days; i++) {
    const d = new Date(base)
    d.setUTCDate(base.getUTCDate() + i)
    const s = seed[i % seed.length] + Math.round(Math.sin(i / 3) * 6)
    const onTime = Math.round(s * (0.9 + (i % 7) / 70))
    out.push({ date: d, shipments: s, onTime })
  }
  return out
}

export const modesInTransit: ModeDatum[] = [
  { label: 'Sea Freight', value: 48, color: '#203040' },
  { label: 'Road Freight', value: 26, color: '#f07000' },
  { label: 'Air Freight', value: 12, color: '#2fc48c' },
]

export const lanes: LaneDatum[] = [
  { label: 'JHB → DBN', value: 212 },
  { label: 'DBN → JHB', value: 187 },
  { label: 'CPT → JHB', value: 141 },
  { label: 'JHB → CPT', value: 98 },
  { label: 'DBN → CPT', value: 74 },
  { label: 'JHB → NMP', value: 61 },
]

export const agents: AgentRow[] = [
  { id: 'a1', name: 'Lerato Mokoena', role: 'Customs Clearance Lead', initials: 'LM', hue: 22, stat: '4.9', statLabel: 'client rating', score: 96 },
  { id: 'a2', name: 'Thabo Ndlovu', role: 'Senior Forwarder · Road', initials: 'TN', hue: 203, stat: '98%', statLabel: 'on-time', score: 92 },
  { id: 'a3', name: 'Aisha Patel', role: 'Air Freight Operations', initials: 'AP', hue: 263, stat: '127', statLabel: 'shipments', score: 84 },
  { id: 'a4', name: 'Pieter van der Merwe', role: 'Sea Freight & Warehousing', initials: 'PV', hue: 152, stat: '94%', statLabel: 'customs cleared', score: 89 },
]

export const recentShipments: ShipmentRow[] = [
  { id: 's1', ref: 'KGL-2608-1142', customer: 'Bluprnt (Pty) Ltd', route: 'Johannesburg → Durban', mode: 'Road', status: 'In Transit', value: 'R 84 200', date: '04 Sep 2026' },
  { id: 's2', ref: 'KGL-2608-1138', customer: 'Marais Wine Estate', route: 'Cape Town → Hamburg', mode: 'Sea', status: 'At Customs', value: 'R 612 400', date: '03 Sep 2026' },
  { id: 's3', ref: 'KGL-2608-1131', customer: 'Sizwe Medical Supplies', route: 'OR Tambo → Nairobi', mode: 'Air', status: 'Cleared', value: 'R 148 900', date: '02 Sep 2026' },
  { id: 's4', ref: 'KGL-2608-1127', customer: 'AgriNova Exports', route: 'Durban → Maputo', mode: 'Road', status: 'Delivered', value: 'R 96 300', date: '02 Sep 2026' },
  { id: 's5', ref: 'KGL-2608-1121', customer: 'Eskom Contractors', route: 'JHB → Zambia (LUS)', mode: 'Road', status: 'In Transit', value: 'R 204 750', date: '01 Sep 2026' },
  { id: 's6', ref: 'KGL-2608-1114', customer: 'Cape Robotics', route: 'Cape Town → Rotterdam', mode: 'Sea', status: 'Awaiting Docs', value: 'R 1 240 000', date: '01 Sep 2026' },
]

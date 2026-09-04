import { InsightsDashboard } from '@/components/insights/insights-shell'

/* Public, auth-free preview of the Katlego Insights dashboard
   (lives under /diag which the proxy treats as public). */
export default function InsightsPreviewPage() {
  return <InsightsDashboard standalone />
}

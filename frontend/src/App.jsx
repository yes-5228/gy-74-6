import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
  Sparkles,
  Users,
} from 'lucide-react'
import { api } from './api/client'
import { AppShell } from './components/AppShell'
import { Dashboard } from './pages/Dashboard'
import { ServiceItemsPage } from './pages/ServiceItemsPage'
import { PackagesPage } from './pages/PackagesPage'
import { TreatmentPlansPage } from './pages/TreatmentPlansPage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { RemindersPage } from './pages/RemindersPage'
import { CustomersPage } from './pages/CustomersPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'

const navItems = [
  { key: 'dashboard', label: '经营总览', icon: LayoutDashboard },
  { key: 'customers', label: '客户档案', icon: Users },
  { key: 'services', label: '套餐项目', icon: Sparkles },
  { key: 'packages', label: '护理套餐', icon: Package },
  { key: 'plans', label: '疗程次数', icon: ClipboardList },
  { key: 'appointments', label: '预约服务', icon: CalendarDays },
  { key: 'reminders', label: '到期提醒', icon: Bell },
]

export default function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [viewingCustomerId, setViewingCustomerId] = useState(null)
  const [data, setData] = useState({
    customers: [],
    serviceItems: [],
    packages: [],
    treatmentPlans: [],
    appointments: [],
    reminders: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = async () => {
    setError('')
    const [customers, serviceItems, packages, treatmentPlans, appointments, reminders] = await Promise.all([
      api.listCustomers(),
      api.listServiceItems(),
      api.listPackages(),
      api.listTreatmentPlans(),
      api.listAppointments(),
      api.listReminders(30),
    ])
    setData({ customers, serviceItems, packages, treatmentPlans, appointments, reminders })
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleViewCustomer = (customerId) => {
    setViewingCustomerId(customerId)
  }

  const handleBackFromDetail = () => {
    setViewingCustomerId(null)
  }

  const pageProps = useMemo(
    () => ({ data, refresh, setError, onViewCustomer: handleViewCustomer }),
    [data]
  )

  let content

  if (viewingCustomerId) {
    content = (
      <CustomerDetailPage
        customerId={viewingCustomerId}
        onBack={handleBackFromDetail}
        setError={setError}
        refresh={refresh}
      />
    )
  } else {
    content = {
      dashboard: <Dashboard data={data} />,
      customers: <CustomersPage {...pageProps} onViewDetail={handleViewCustomer} />,
      services: <ServiceItemsPage {...pageProps} />,
      packages: <PackagesPage {...pageProps} />,
      plans: <TreatmentPlansPage {...pageProps} />,
      appointments: <AppointmentsPage {...pageProps} />,
      reminders: <RemindersPage data={data} refresh={refresh} />,
    }[activeView]
  }

  return (
    <AppShell
      navItems={navItems}
      activeView={activeView}
      onNavigate={(key) => {
        setActiveView(key)
        setViewingCustomerId(null)
      }}
      loading={loading}
      error={error}
    >
      {content}
    </AppShell>
  )
}

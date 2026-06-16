import { useState } from 'react'
import { MinusCircle, Eye } from 'lucide-react'
import { api } from '../api/client'
import { SelectInput, SubmitButton, TextInput } from '../components/Forms'
import { SectionHeader } from '../components/SectionHeader'

const initialForm = {
  customer_id: '',
  package_id: '',
  sessions_total: 6,
  expires_at: '',
}

export function TreatmentPlansPage({ data, refresh, setError, onViewCustomer }) {
  const [form, setForm] = useState(initialForm)

  const selectedCustomer = data.customers.find((c) => c.id === Number(form.customer_id))

  const submit = async (event) => {
    event.preventDefault()
    try {
      const customer = data.customers.find((c) => c.id === Number(form.customer_id))
      await api.createTreatmentPlan({
        customer_id: Number(form.customer_id),
        customer_name: customer?.name || '',
        customer_phone: customer?.phone || '',
        package_id: Number(form.package_id),
        sessions_total: Number(form.sessions_total),
        sessions_used: 0,
        expires_at: new Date(form.expires_at).toISOString(),
        status: 'active',
      })
      setForm(initialForm)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-stack">
      <SectionHeader title="疗程次数管理" description="给客户开通疗程卡，跟踪总次数、已用次数和到期时间。" />
      <form className="form-grid panel" onSubmit={submit}>
        <SelectInput label="选择客户" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required>
          <option value="">请选择客户</option>
          {data.customers.map((customer) => (
            <option value={customer.id} key={customer.id}>
              {customer.name} - {customer.phone}
            </option>
          ))}
        </SelectInput>
        {selectedCustomer && (
          <TextInput label="客户信息" value={`${selectedCustomer.name} ${selectedCustomer.phone}`} disabled />
        )}
        {!selectedCustomer && <div></div>}
        <SelectInput label="套餐" value={form.package_id} onChange={(e) => setForm({ ...form, package_id: e.target.value })} required>
          <option value="">选择套餐</option>
          {data.packages.map((pkg) => (
            <option value={pkg.id} key={pkg.id}>{pkg.name}</option>
          ))}
        </SelectInput>
        <TextInput label="总次数" type="number" min="1" value={form.sessions_total} onChange={(e) => setForm({ ...form, sessions_total: e.target.value })} />
        <TextInput label="到期日" type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} required />
        <SubmitButton>开通疗程</SubmitButton>
      </form>

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>客户</th>
              <th>套餐</th>
              <th>次数</th>
              <th>到期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data.treatmentPlans.map((plan) => (
              <tr key={plan.id}>
                <td>
                  {plan.customer_name}<small>{plan.customer_phone}</small>
                </td>
                <td>{plan.package?.name}</td>
                <td>
                  <strong>{plan.sessions_remaining}</strong>/{plan.sessions_total}
                  <small>已用 {plan.sessions_used} 次</small>
                </td>
                <td>
                  {new Date(plan.expires_at).toLocaleDateString('zh-CN')}
                  {(() => {
                    const daysLeft = Math.ceil((new Date(plan.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
                    if (daysLeft < 0) return <small className="badge danger">已过期 {Math.abs(daysLeft)} 天</small>
                    if (daysLeft <= 7) return <small className="badge danger">剩余 {daysLeft} 天</small>
                    if (daysLeft <= 14) return <small className="badge">剩余 {daysLeft} 天</small>
                    return null
                  })()}
                </td>
                <td><span className="badge">{plan.status === 'active' ? '进行中' : plan.status === 'completed' ? '已完成' : plan.status}</span></td>
                <td>
                  <div className="action-buttons">
                    {onViewCustomer && plan.customer_id && (
                      <button
                        className="secondary-button"
                        onClick={() => onViewCustomer(plan.customer_id)}
                        title="查看客户"
                      >
                        <Eye size={15} />
                      </button>
                    )}
                    <button
                      className="secondary-button"
                      onClick={async () => {
                        await api.consumeTreatmentSession(plan.id)
                        await refresh()
                      }}
                      disabled={plan.sessions_remaining <= 0 || plan.status !== 'active'}
                    >
                      <MinusCircle size={15} />
                      <span>扣次</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

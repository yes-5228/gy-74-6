import { useState } from 'react'
import { Clock, Eye } from 'lucide-react'
import { api } from '../api/client'
import { SelectInput, SubmitButton, TextArea, TextInput } from '../components/Forms'
import { SectionHeader } from '../components/SectionHeader'

const initialForm = {
  customer_id: '',
  service_item_id: '',
  treatment_plan_id: '',
  scheduled_at: '',
  beautician: '',
  notes: '',
}

export function AppointmentsPage({ data, refresh, setError, onViewCustomer }) {
  const [form, setForm] = useState(initialForm)

  const selectedCustomer = data.customers.find((c) => c.id === Number(form.customer_id))

  const availablePlans = form.customer_id
    ? data.treatmentPlans.filter((p) => p.customer_id === Number(form.customer_id) && p.status === 'active')
    : []

  const submit = async (event) => {
    event.preventDefault()
    try {
      const customer = data.customers.find((c) => c.id === Number(form.customer_id))
      await api.createAppointment({
        ...form,
        customer_id: Number(form.customer_id),
        customer_name: customer?.name || '',
        customer_phone: customer?.phone || '',
        service_item_id: Number(form.service_item_id),
        treatment_plan_id: form.treatment_plan_id ? Number(form.treatment_plan_id) : null,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        status: 'booked',
      })
      setForm(initialForm)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleComplete = async (appointmentId) => {
    try {
      await api.updateAppointment(appointmentId, { status: 'completed' })
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-stack">
      <SectionHeader title="预约服务" description="登记客户护理预约，关联项目、疗程卡和美容师。" />
      <form className="form-grid panel" onSubmit={submit}>
        <SelectInput label="选择客户" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value, treatment_plan_id: '' })} required>
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
        <SelectInput label="护理项目" value={form.service_item_id} onChange={(e) => setForm({ ...form, service_item_id: e.target.value })} required>
          <option value="">选择项目</option>
          {data.serviceItems.map((item) => (
            <option value={item.id} key={item.id}>{item.name}</option>
          ))}
        </SelectInput>
        <SelectInput
          label="关联疗程"
          value={form.treatment_plan_id}
          onChange={(e) => setForm({ ...form, treatment_plan_id: e.target.value })}
          disabled={!form.customer_id}
        >
          <option value="">不关联</option>
          {availablePlans.map((plan) => (
            <option value={plan.id} key={plan.id}>
              {plan.package?.name} (剩余{plan.sessions_remaining}次)
            </option>
          ))}
        </SelectInput>
        <TextInput label="预约时间" type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required />
        <TextInput label="美容师" value={form.beautician} onChange={(e) => setForm({ ...form, beautician: e.target.value })} />
        <TextArea label="备注" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <SubmitButton>创建预约</SubmitButton>
      </form>

      <div className="timeline panel">
        {data.appointments.map((appointment) => (
          <article className="timeline-item" key={appointment.id}>
            <time>{new Date(appointment.scheduled_at).toLocaleString('zh-CN')}</time>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>{appointment.customer_name}</strong>
                {onViewCustomer && appointment.customer_id && (
                  <button
                    className="secondary-button"
                    style={{ padding: '2px 8px', minHeight: 'auto' }}
                    onClick={() => onViewCustomer(appointment.customer_id)}
                    title="查看客户"
                  >
                    <Eye size={12} />
                  </button>
                )}
              </div>
              <span>{appointment.service_item?.name} · {appointment.beautician || '未分配'}</span>
              {appointment.treatment_plan_id && <small>关联疗程卡 #{appointment.treatment_plan_id}</small>}
              <p>{appointment.notes || '无备注'}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
              <span className={`badge ${appointment.status === 'completed' ? '' : appointment.status === 'booked' ? '' : 'danger'}`}>
                {appointment.status === 'booked' ? '待服务' : appointment.status === 'completed' ? '已完成' : appointment.status}
              </span>
              {appointment.status === 'booked' && (
                <button className="secondary-button" onClick={() => handleComplete(appointment.id)}>
                  <Clock size={14} />
                  <span>完成</span>
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

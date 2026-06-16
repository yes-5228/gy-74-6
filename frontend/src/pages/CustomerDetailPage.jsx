import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, Clock, CreditCard, MinusCircle, User, AlertTriangle } from 'lucide-react'
import { api } from '../api/client'
import { SectionHeader } from '../components/SectionHeader'

const riskLabels = {
  high: { label: '高风险', class: 'risk-high' },
  medium: { label: '中风险', class: 'risk-medium' },
  normal: { label: '正常', class: 'risk-normal' },
}

export function CustomerDetailPage({ customerId, onBack, setError, refresh }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('plans')

  useEffect(() => {
    loadDetail()
  }, [customerId])

  const loadDetail = async () => {
    setLoading(true)
    try {
      const data = await api.getCustomerDetail(customerId)
      setDetail(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConsume = async (planId) => {
    try {
      await api.consumeTreatmentSession(planId)
      await loadDetail()
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      await api.updateAppointment(appointmentId, { status: 'completed' })
      await loadDetail()
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading || !detail) {
    return <div className="panel">加载中...</div>
  }

  const risk = riskLabels[detail.risk_level] || riskLabels.normal

  return (
    <div className="page-stack">
      <div className="customer-detail-header">
        <div>
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>返回列表</span>
          </button>
        </div>
        <span className={`badge ${risk.class}`}>
          <AlertTriangle size={14} />
          {risk.label}
        </span>
      </div>

      <SectionHeader title={detail.name} description={`客户档案详情 - ${detail.phone}`} />

      <div className="stats-grid">
        <div className="stat-card">
          <span>在用疗程</span>
          <strong>{detail.active_plans_count}</strong>
          <small>剩余次数需关注</small>
        </div>
        <div className="stat-card">
          <span>待服务预约</span>
          <strong>{detail.upcoming_appointments_count}</strong>
          <small>已预约未完成</small>
        </div>
        <div className="stat-card">
          <span>累计疗程</span>
          <strong>{detail.treatment_plans.length}</strong>
          <small>历史购买套餐</small>
        </div>
        <div className="stat-card">
          <span>累计预约</span>
          <strong>{detail.appointments.length}</strong>
          <small>历史预约记录</small>
        </div>
      </div>

      <div className="panel">
        <div className="section-title">
          <User size={18} />
          <h2>基本信息</h2>
        </div>
        <div className="customer-info">
          <div className="customer-info-row">
            <span className="customer-info-label">姓名</span>
            <span>{detail.name}</span>
          </div>
          <div className="customer-info-row">
            <span className="customer-info-label">手机号</span>
            <span>{detail.phone}</span>
          </div>
          <div className="customer-info-row">
            <span className="customer-info-label">邮箱</span>
            <span>{detail.email || '-'}</span>
          </div>
          <div className="customer-info-row">
            <span className="customer-info-label">性别</span>
            <span>{detail.gender || '-'}</span>
          </div>
          <div className="customer-info-row">
            <span className="customer-info-label">生日</span>
            <span>{detail.birthday ? new Date(detail.birthday).toLocaleDateString('zh-CN') : '-'}</span>
          </div>
          <div className="customer-info-row">
            <span className="customer-info-label">地址</span>
            <span>{detail.address || '-'}</span>
          </div>
          <div className="customer-info-row">
            <span className="customer-info-label">备注</span>
            <span>{detail.notes || '-'}</span>
          </div>
          <div className="customer-info-row">
            <span className="customer-info-label">建档时间</span>
            <span>{new Date(detail.created_at).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-button ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>
          <CreditCard size={16} />
          疗程卡
        </button>
        <button className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
          <Calendar size={16} />
          预约历史
        </button>
      </div>

      {activeTab === 'plans' && (
        <div className="panel table-panel">
          <div className="section-title">
            <CreditCard size={18} />
            <h2>疗程卡记录</h2>
          </div>
          {detail.treatment_plans.length === 0 ? (
            <div className="empty-text">暂无疗程卡记录</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>套餐名称</th>
                  <th>次数进度</th>
                  <th>购买时间</th>
                  <th>到期时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {detail.treatment_plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.package?.name}</td>
                    <td>
                      <strong>{plan.sessions_remaining}</strong> / {plan.sessions_total}
                      <small>已用 {plan.sessions_used} 次</small>
                    </td>
                    <td>{new Date(plan.purchased_at).toLocaleDateString('zh-CN')}</td>
                    <td>
                      {new Date(plan.expires_at).toLocaleDateString('zh-CN')}
                      {(() => {
                        const daysLeft = Math.ceil((new Date(plan.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
                        if (daysLeft < 0) return <small className="badge danger">已过期 {Math.abs(daysLeft)} 天</small>
                        if (daysLeft <= 7) return <small className="badge danger">剩余 {daysLeft} 天</small>
                        if (daysLeft <= 14) return <small className="badge">剩余 {daysLeft} 天</small>
                        return <small>剩余 {daysLeft} 天</small>
                      })()}
                    </td>
                    <td>
                      <span className={`badge ${plan.status === 'active' ? '' : plan.status === 'completed' ? '' : 'danger'}`}>
                        {plan.status === 'active' ? '进行中' : plan.status === 'completed' ? '已完成' : plan.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="secondary-button"
                        onClick={() => handleConsume(plan.id)}
                        disabled={plan.sessions_remaining <= 0 || plan.status !== 'active'}
                      >
                        <MinusCircle size={15} />
                        <span>扣次</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="panel">
          <div className="section-title">
            <Calendar size={18} />
            <h2>预约历史</h2>
          </div>
          {detail.appointments.length === 0 ? (
            <div className="empty-text">暂无预约记录</div>
          ) : (
            <div className="timeline">
              {detail.appointments.map((apt) => (
                <article className="timeline-item" key={apt.id}>
                  <time>{new Date(apt.scheduled_at).toLocaleString('zh-CN')}</time>
                  <div>
                    <strong>{apt.service_item?.name}</strong>
                    <span>美容师：{apt.beautician || '未分配'}</span>
                    {apt.treatment_plan_id && <small>关联疗程卡 #{apt.treatment_plan_id}</small>}
                    {apt.notes && <p>{apt.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <span className={`badge ${apt.status === 'completed' ? '' : apt.status === 'booked' ? '' : 'danger'}`}>
                      {apt.status === 'booked' ? '待服务' : apt.status === 'completed' ? '已完成' : apt.status}
                    </span>
                    {apt.status === 'booked' && (
                      <button
                        className="secondary-button"
                        onClick={() => handleCompleteAppointment(apt.id)}
                      >
                        <Clock size={14} />
                        <span>完成</span>
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

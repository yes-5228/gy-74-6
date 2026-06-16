import { useState } from 'react'
import { Edit2, Eye, Trash2, UserPlus } from 'lucide-react'
import { api } from '../api/client'
import { SelectInput, SubmitButton, TextArea, TextInput } from '../components/Forms'
import { SectionHeader } from '../components/SectionHeader'

const initialForm = {
  name: '',
  phone: '',
  email: '',
  gender: '',
  birthday: '',
  address: '',
  notes: '',
}

export function CustomersPage({ data, refresh, setError, onViewDetail }) {
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        ...form,
        birthday: form.birthday ? new Date(form.birthday).toISOString() : null,
      }
      if (editingId) {
        await api.updateCustomer(editingId, payload)
      } else {
        await api.createCustomer(payload)
      }
      setForm(initialForm)
      setEditingId(null)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (customer) => {
    setEditingId(customer.id)
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      gender: customer.gender || '',
      birthday: customer.birthday ? customer.birthday.split('T')[0] : '',
      address: customer.address || '',
      notes: customer.notes || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(initialForm)
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该客户档案吗？')) return
    try {
      await api.deleteCustomer(id)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-stack">
      <SectionHeader title="客户档案管理" description="管理客户基本信息，查看购买套餐、疗程卡和预约历史。" />

      <form className="form-grid panel" onSubmit={submit}>
        <TextInput label="客户姓名" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <TextInput label="手机号" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <TextInput label="邮箱" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <SelectInput label="性别" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
          <option value="">请选择</option>
          <option value="女">女</option>
          <option value="男">男</option>
        </SelectInput>
        <TextInput label="生日" type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
        <div></div>
        <TextInput label="地址" className="wide" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <TextArea label="备注" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="form-actions">
          <SubmitButton>{editingId ? '保存修改' : '新建客户'}</SubmitButton>
          {editingId && (
            <button type="button" className="secondary-button" onClick={cancelEdit}>
              取消
            </button>
          )}
        </div>
      </form>

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>客户姓名</th>
              <th>手机号</th>
              <th>性别</th>
              <th>建档时间</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data.customers.map((customer) => (
              <tr key={customer.id}>
                <td><strong>{customer.name}</strong></td>
                <td>{customer.phone}</td>
                <td>{customer.gender || '-'}</td>
                <td>{new Date(customer.created_at).toLocaleDateString('zh-CN')}</td>
                <td className="notes-cell">{customer.notes || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="secondary-button" onClick={() => onViewDetail(customer.id)} title="查看详情">
                      <Eye size={15} />
                    </button>
                    <button className="secondary-button" onClick={() => startEdit(customer)} title="编辑">
                      <Edit2 size={15} />
                    </button>
                    <button className="danger-button" onClick={() => handleDelete(customer.id)} title="删除">
                      <Trash2 size={15} />
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

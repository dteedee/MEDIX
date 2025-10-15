import React, { useEffect, useMemo, useState } from 'react'
import { bannerService } from '../../services/bannerService'
import { BannerDTO } from '../../types/banner.types'
// BannerForm component lives under components/admin
import BannerForm from '../../components/admin/BannerFormNew'

export default function BannerList() {
  const [banners, setBanners] = useState<BannerDTO[]>([])
  const [editing, setEditing] = useState<BannerDTO | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [errorDetailsVisible, setErrorDetailsVisible] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const load = async () => {
    try {
      setError(null)
      const r = await bannerService.list(page, pageSize)
      setBanners(r.items)
      setTotal(r.total)
      if (!r.items || r.items.length === 0) {
        console.debug('BannerList: API returned no items', { page, pageSize, raw: r })
      }
    } catch (err) {
      console.error('BannerList: failed to load banners', err)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr: any = err
      let msg = 'Failed to load banners'
      if (anyErr?.response) {
        const status = anyErr.response.status
        const statusText = anyErr.response.statusText
        msg += `: ${status} ${statusText}`
        setError(JSON.stringify(anyErr.response.data ?? anyErr.response, null, 2))
      } else {
        msg += `: ${anyErr?.message ?? String(anyErr)}`
        setError(String(anyErr))
      }
      // also keep a short message for display/title
      setError(msg)
    }
  }
}
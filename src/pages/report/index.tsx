import { useDebounce, useOffsetPagination, useWatch } from '@hairy/react-lib'
import {
  Button,
  Card,
  CardBody,
  Input,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useOverlay } from '@overlastic/react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Page() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [type, setType] = useState<string>('')
  const openDialog = useOverlay(Dialog)
  const pagination = useOffsetPagination({
    pageSize: 7,
  })

  const typeOptions = [
    { label: '日', value: 'daily' },
    { label: '周', value: 'weekly' },
    { label: '月', value: 'monthly' },
    { label: '年', value: 'yearly' },
  ]

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['reports', debouncedSearch, type, pagination.page, pagination.pageSize],
    queryFn: async () => db.report.findMany({
      search: debouncedSearch,
      type,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  })

  async function onDelete(id: number) {
    await openDialog({
      title: '确认删除',
      message: '确定要删除这条报告吗？此操作无法撤销。',
      confirmText: '删除',
      cancelText: '取消',
    })
    await db.report.delete(id)
    refetch()
  }

  function getTypeLabel(type: string) {
    return typeOptions.find(opt => opt.value === type)?.label || type
  }

  function getContentPreview(content: string) {
    const text = content.replace(/<[^>]*>/g, '').trim()
    return text.length > 50 ? `${text.substring(0, 50)}...` : text
  }

  useWatch([search, type], () => pagination.pageChange(1))

  return (
    <>
      <Card className="mb-4 flex-shrink-0">
        <CardBody className="gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="搜索报告内容..."
              value={search}
              onValueChange={setSearch}
              startContent={<Icon icon="lucide:search" className="text-default-400" />}
              className="flex-1"
            />
            <Select
              placeholder="全部类型"
              selectedKeys={type ? [type] : []}
              onSelectionChange={function (keys) {
                const selected = Array.from(keys)[0] as string
                setType(selected || '')
              }}
              isClearable
              className="w-full sm:w-40"
              aria-label="筛选报告类型"
            >
              {typeOptions.map((option) => {
                return (
                  <SelectItem key={option.value}>
                    {option.label}
                  </SelectItem>
                )
              })}
            </Select>
          </div>
        </CardBody>
      </Card>

      <Table aria-label="Reports table">
        <TableHeader>
          <TableColumn minWidth={120}>日期</TableColumn>
          <TableColumn minWidth={80}>类型</TableColumn>
          <TableColumn minWidth={300}>内容</TableColumn>
          <TableColumn minWidth={120}>操作</TableColumn>
        </TableHeader>
        <TableBody
          items={reports}
          isLoading={isLoading}
          emptyContent={isLoading ? '加载中...' : '暂无报告'}
        >
          {(item) => {
            return (
              <TableRow key={item.id}>
                <TableCell>{dayjs(item.createdAt).format('YYYY-MM-DD')}</TableCell>
                <TableCell>{getTypeLabel(item.type)}</TableCell>
                <TableCell>
                  {getContentPreview(item.content)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => navigate(`/report/detail?id=${item.id}`)}
                    >
                      <Icon icon="lucide:edit" className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => onDelete(item.id)}
                    >
                      <Icon icon="lucide:trash" className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          }}
        </TableBody>
      </Table>

      {pagination.total > 1 && (
        <div className="flex justify-end pt-4">
          <Pagination
            className="pb-0"
            total={pagination.total}
            page={pagination.page}
            onChange={pagination.pageChange}
            showControls
            showShadow
          />
        </div>
      )}
    </>
  )
}

export default Page

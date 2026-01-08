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
import { sql_queryReports } from '@/services/sql-report-query'

function Page() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [type, setType] = useState<string>('')
  const openDeleteReportModal = useOverlay(DeleteReportModal)
  const pagination = useOffsetPagination({
    pageSize: 7,
  })

  const typeOptions = [
    { label: '日', value: 'daily' },
    { label: '周', value: 'weekly' },
    { label: '月', value: 'monthly' },
    { label: '年', value: 'yearly' },
  ]

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports', debouncedSearch, type, pagination.page, pagination.pageSize],
    queryFn: async () => sql_queryReports({
      search: debouncedSearch,
      type,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  })

  async function handleExportCSV() {
    // TODO
    // if (filePath) {
    //   await writeTextFile(filePath, `\uFEFF${csvContent}`)
    //   sendNotification({ title: '成功', body: 'CSV 文件已导出' })
    // }
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
            >
              {typeOptions.map((option) => {
                return (
                  <SelectItem key={option.value}>
                    {option.label}
                  </SelectItem>
                )
              })}
            </Select>
            <Button
              color="primary"
              onPress={handleExportCSV}
              startContent={<Icon icon="lucide:download" className="w-4 h-4" />}
              isDisabled={reports.length === 0}
            >
              导出 CSV
            </Button>
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
                      onPress={function () {
                        navigate(`/report/detail?id=${item.id}`)
                      }}
                    >
                      <Icon icon="lucide:edit" className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={openDeleteReportModal}
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

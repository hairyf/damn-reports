import { useDebounce, useOffsetPagination, useWatch } from '@hairy/react-lib'
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sql_queryReports } from '@/services/sql-report-query'
import { deleteReport } from '@/utils/mock-db'

function Page() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
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
    queryKey: ['reports', debouncedSearchQuery, typeFilter, pagination.page, pagination.pageSize],
    queryFn: async () => sql_queryReports({
      search: debouncedSearchQuery,
      type: typeFilter,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      sendNotification({ title: '成功', body: '报告已删除' })
      onClose()
      setDeleteTarget(null)
    },
    onError: (error) => {
      console.error('Failed to delete report:', error)
      sendNotification({ title: '错误', body: '删除报告失败' })
    },
  })

  async function handleDelete(id: number) {
    deleteMutation.mutate(id)
  }

  function handleDeleteClick(id: number) {
    setDeleteTarget(id)
    onOpen()
  }

  async function handleExportCSV() {
    const headers = ['日期', '类型', '内容']
    const rows = reports.map((report) => {
      return [
        report.date,
        typeOptions.find((opt) => { return opt.value === report.type })?.label || report.type,
        report.content.replace(/\n/g, ' ').substring(0, 100),
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => {
        return row.map((cell) => {
          return `"${String(cell).replace(/"/g, '""')}"`
        }).join(',')
      }),
    ].join('\n')

    const fileName = `reports_${new Date().toISOString().split('T')[0]}.csv`
    const filePath = await save({
      defaultPath: fileName,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    })

    if (filePath) {
      await writeTextFile(filePath, `\uFEFF${csvContent}`)
      sendNotification({ title: '成功', body: 'CSV 文件已导出' })
    }
  }

  function getTypeLabel(type: string) {
    return typeOptions.find(opt => opt.value === type)?.label || type
  }

  function getContentPreview(content: string) {
    const text = content.replace(/<[^>]*>/g, '').trim()
    return text.length > 50 ? `${text.substring(0, 50)}...` : text
  }

  // 分页计算
  const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedReports = reports.slice(startIndex, endIndex)

  useWatch([searchQuery, typeFilter], () => setCurrentPage(1))

  return (
    <>
      <Card className="mb-4 flex-shrink-0">
        <CardBody className="gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="搜索报告内容..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="lucide:search" className="text-default-400" />}
              className="flex-1"
            />
            <Select
              placeholder="全部类型"
              selectedKeys={typeFilter ? [typeFilter] : []}
              onSelectionChange={function (keys) {
                const selected = Array.from(keys)[0] as string
                setTypeFilter(selected || '')
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
          <TableColumn minWidth={400}>内容</TableColumn>
          <TableColumn minWidth={120}>操作</TableColumn>
        </TableHeader>
        <TableBody
          items={paginatedReports}
          isLoading={isLoading}
          emptyContent={isLoading ? '加载中...' : '暂无报告'}
        >
          {(item) => {
            return (
              <TableRow key={item.id}>
                <TableCell>{item.date}</TableCell>
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
                      onPress={function () {
                        handleDeleteClick(item.id!)
                      }}
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

      {totalPages > 1 && (
        <div className="flex justify-end pt-4">
          <Pagination
            className="pb-0"
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            showShadow
          />
        </div>
      )}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {function (onClose) {
            return (
              <>
                <ModalHeader className="flex flex-col gap-1">确认删除</ModalHeader>
                <ModalBody>
                  <p>确定要删除这条报告吗？此操作无法撤销。</p>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    取消
                  </Button>
                  <Button
                    color="danger"
                    onPress={() => {
                      deleteTarget && handleDelete(deleteTarget)
                    }}
                  >
                    删除
                  </Button>
                </ModalFooter>
              </>
            )
          }}
        </ModalContent>
      </Modal>
    </>
  )
}

export default Page

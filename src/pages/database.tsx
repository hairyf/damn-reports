import { useDebounce, useWatch } from '@hairy/react-lib'
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
import { useQuery } from '@tanstack/react-query'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { useState } from 'react'

import { AlimailIcon, ClickupIcon, GitIcon, GmailIcon, SlackIcon } from '@/components/icons'
import { getAllDatabaseItems, searchDatabaseItems } from '@/utils/mock-db'

const ITEMS_PER_PAGE = 10

const sourceOptions = [
  { label: 'Git', value: 'git', icon: GitIcon },
  { label: 'Clickup', value: 'clickup', icon: ClickupIcon },
  { label: 'Slack', value: 'slack', icon: SlackIcon },
  { label: 'Gmail', value: 'gmail', icon: GmailIcon },
  { label: 'Alimail', value: 'alimail', icon: AlimailIcon },
]

function Page() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  // 防抖搜索词和筛选条件
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const debouncedSourceFilter = useDebounce(sourceFilter, 300)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['databaseItems', debouncedSearchQuery, debouncedSourceFilter],
    queryFn: async () => {
      if (debouncedSearchQuery || debouncedSourceFilter) {
        return await searchDatabaseItems(debouncedSearchQuery, debouncedSourceFilter || undefined)
      }
      else {
        return await getAllDatabaseItems()
      }
    },
  })

  async function handleExportCSV() {
    const headers = ['来源', '日期', '内容']
    const rows = items.map((item) => {
      return [
        sourceOptions.find((opt) => { return opt.value === item.source })?.label || item.source,
        item.date,
        item.content,
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

    const fileName = `database_${new Date().toISOString().split('T')[0]}.csv`
    const filePath = await save({
      defaultPath: fileName,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    })

    if (filePath) {
      await writeTextFile(filePath, `\uFEFF${csvContent}`)
      sendNotification({ title: '成功', body: 'CSV 文件已导出' })
    }
  }

  function getSourceLabel(source: string) {
    return sourceOptions.find(opt => opt.value === source)?.label || source
  }

  function getSourceIcon(source: string) {
    const option = sourceOptions.find(opt => opt.value === source)
    if (option?.icon) {
      const IconComponent = option.icon
      return <IconComponent size={20} />
    }
    return null
  }

  function getContentPreview(content: string) {
    return content.length > 80 ? `${content.substring(0, 80)}...` : content
  }

  // 分页计算
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedItems = items.slice(startIndex, endIndex)

  useWatch([searchQuery, sourceFilter], () => setCurrentPage(1))
  return (
    <>
      <Card className="mb-4 flex-shrink-0">
        <CardBody className="gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="搜索内容..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="lucide:search" className="text-default-400" />}
              className="flex-1"
            />
            <Select
              placeholder="全部来源"
              selectedKeys={sourceFilter ? [sourceFilter] : []}
              onSelectionChange={function (keys) {
                const selected = Array.from(keys)[0] as string
                setSourceFilter(selected || '')
              }}
              isClearable
              className="w-full sm:w-40"
            >
              {sourceOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <SelectItem
                    key={option.value}
                    startContent={IconComponent ? <IconComponent size={16} /> : null}
                  >
                    {option.label}
                  </SelectItem>
                )
              })}
            </Select>
            <Button
              color="primary"
              onPress={handleExportCSV}
              startContent={<Icon icon="lucide:download" className="w-4 h-4" />}
              isDisabled={items.length === 0}
            >
              导出 CSV
            </Button>
          </div>
        </CardBody>
      </Card>

      <Table aria-label="Database items table">
        <TableHeader>
          <TableColumn minWidth={120}>来源</TableColumn>
          <TableColumn minWidth={120}>日期</TableColumn>
          <TableColumn minWidth={400}>简要内容</TableColumn>
          <TableColumn minWidth={100}>操作</TableColumn>
        </TableHeader>
        <TableBody
          items={paginatedItems}
          isLoading={isLoading}
          emptyContent={isLoading ? '加载中...' : '暂无数据'}
        >
          {(item) => {
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getSourceIcon(item.source)}
                    <span>{getSourceLabel(item.source)}</span>
                  </div>
                </TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>
                  {getContentPreview(item.content)}
                </TableCell>
                <TableCell>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={function () {
                      // TODO: 实现查看详情功能
                      sendNotification({ title: '查看', body: `查看 ID: ${item.id} 的详情` })
                    }}
                  >
                    <Icon icon="lucide:eye" className="w-4 h-4" />
                  </Button>
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
    </>
  )
}

export default Page

import { useDebounce, useOffsetPagination, useWatch } from '@hairy/react-lib'
import {
  Card,
  CardBody,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { createElement, useState } from 'react'
import { AlimailIcon, ClickupIcon, GitIcon, GmailIcon, SlackIcon } from '@/components/icons'

const mapping = {
  git: { icon: GitIcon, label: 'Git' },
  clickup: { icon: ClickupIcon, label: 'Clickup' },
  slack: { icon: SlackIcon, label: 'Slack' },
  gmail: { icon: GmailIcon, label: 'Gmail' },
  alimail: { icon: AlimailIcon, label: 'Alimail' },
}

function Page() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const pagination = useOffsetPagination({
    pageSize: 7,
  })
  // 防抖搜索词和筛选条件
  const debouncedSearch = useDebounce(search, 300)
  const debouncedSourceFilter = useDebounce(sourceFilter, 300)

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['records', debouncedSearch, debouncedSourceFilter, pagination.page, pagination.pageSize],
    queryFn: () => {
      return sql_queryRecords({
        search: debouncedSearch,
        source: debouncedSourceFilter,
        page: pagination.page,
        pageSize: pagination.pageSize,
      })
    },
  })

  useWatch([search, sourceFilter], () => pagination.pageChange(1))

  return (
    <>
      <Card className="mb-4 flex-shrink-0">
        <CardBody className="gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="搜索内容..."
              value={search}
              onValueChange={setSearch}
              startContent={<Icon icon="lucide:search" className="text-default-400" />}
              className="flex-1"
            />
            <SourceSelect
              value={sourceFilter}
              onChange={setSourceFilter}
              isClearable
              placeholder="全部来源"
              className="w-full sm:w-40"
            />
          </div>
        </CardBody>
      </Card>

      <Table aria-label="Database items table">
        <TableHeader>
          <TableColumn minWidth={120}>来源</TableColumn>
          <TableColumn minWidth={120}>日期</TableColumn>
          <TableColumn minWidth={300}>简要内容</TableColumn>
        </TableHeader>
        <TableBody
          items={records}
          isLoading={isLoading}
          emptyContent={isLoading ? '加载中...' : '暂无数据'}
        >
          {(record) => {
            return (
              <TableRow key={record.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {createElement(mapping[record.source as keyof typeof mapping].icon, { size: 20 })}
                    <span>{mapping[record.source as keyof typeof mapping].label}</span>
                  </div>
                </TableCell>
                <TableCell>{dayjs(record.createdAt).format('YYYY-MM-DD')}</TableCell>
                <TableCell>
                  {record.summary}
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

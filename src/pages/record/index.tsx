import { useDebounce, useOffsetPagination, useWatch } from '@hairy/react-lib'
import {
  addToast,
  Button,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { createElement, useMemo, useState } from 'react'
import { collectRecords } from '@/api/collect-records'

import { getSources } from '@/api/sources'
import { AlimailIcon, ClickupIcon, GitIcon, GmailIcon, SlackIcon } from '@/components/icons'

const iconMapping: Record<string, { icon: any, label: string }> = {
  git: { icon: GitIcon, label: 'Git' },
  git_directory: { icon: GitIcon, label: 'Git' },
  clickup: { icon: ClickupIcon, label: 'Clickup' },
  slack: { icon: SlackIcon, label: 'Slack' },
  gmail: { icon: GmailIcon, label: 'Gmail' },
  alimail: { icon: AlimailIcon, label: 'Alimail' },
}

function Page() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const queryClient = useQueryClient()
  const pagination = useOffsetPagination({
    pageSize: 20,
  })
  // 防抖搜索词和筛选条件
  const debouncedSearch = useDebounce(search, 300)
  const debouncedSourceFilter = useDebounce(sourceFilter, 300)

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: getSources,
  })
  const sourceMap = useMemo(() => {
    const m = new Map<string, { name: string, tool: string }>()
    for (const s of sources)
      m.set(s.id, { name: s.name, tool: s.tool })
    return m
  }, [sources])

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['records', debouncedSearch, debouncedSourceFilter, pagination.page, pagination.pageSize, sourceMap.size],
    queryFn: async () => {
      const { data, total } = await db.record.findManyPageWithSources(
        {
          search: debouncedSearch,
          source: debouncedSourceFilter,
          page: pagination.page,
          pageSize: pagination.pageSize,
        },
        sourceMap,
      )
      pagination.pageSizeChange(total)
      return data
    },
  })

  const syncMutation = useMutation({
    mutationFn: async () => {
      return await collectRecords()
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['records'] })
      addToast({
        title: '同步成功',
        description: `已同步 ${count} 条记录`,
        color: 'success',
      })
    },
    onError: (error) => {
      addToast({
        title: '同步失败',
        description: error instanceof Error ? error.message : '未知错误',
        color: 'danger',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await db.record.delete(id)
    },
    onSuccess: (result) => {
      if (result.numDeletedRows > 0) {
        queryClient.invalidateQueries({ queryKey: ['records'] })
      }
    },
  })

  useWatch([search, sourceFilter], () => pagination.pageChange(1))

  return (
    <>
      <Card className="mb-4 flex-shrink-0" shadow="none">
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
            <Button
              color="primary"
              variant="flat"
              onPress={() => syncMutation.mutate()}
              isLoading={syncMutation.isPending}
              startContent={!syncMutation.isPending ? <Icon icon="lucide:refresh-cw" className="w-4 h-4" /> : undefined}
              className="w-full sm:w-auto"
            >
              同步记录
            </Button>
          </div>
        </CardBody>
      </Card>

      <Table aria-label="Database items table" shadow="none">
        <TableHeader>
          <TableColumn minWidth={120}>来源</TableColumn>
          <TableColumn minWidth={120}>日期</TableColumn>
          <TableColumn minWidth={300}>简要内容</TableColumn>
          <TableColumn>操作</TableColumn>
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
                    {createElement(iconMapping[record.tool]?.icon ?? GitIcon, { size: 20 })}
                    <span>{record.sourceName}</span>
                  </div>
                </TableCell>
                <TableCell>{dayjs(typeof record.createdAt === 'number' ? record.createdAt * 1000 : record.createdAt).format('YYYY-MM-DD')}</TableCell>
                <TableCell>
                  <div className="w-full relative h-5">
                    <div className="absolute inset-0">
                      <Ellipsis>{record.summary}</Ellipsis>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => deleteMutation.mutate(record.id)}
                    isLoading={deleteMutation.isPending}
                  >
                    <Icon icon="lucide:trash" className="w-4 h-4" />
                  </Button>
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

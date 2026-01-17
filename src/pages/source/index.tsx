import { Else, If, Then, useDebounce } from '@hairy/react-lib'
import {
  Button,
  Card,
  CardBody,
  Input,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

function Page() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [type, setType] = useState<string>('')

  const { data: sources } = useQuery({
    queryKey: ['sources', debouncedSearch, type],
    queryFn: () => db.source.findMany({ search: debouncedSearch, type }),
  })

  return (
    <>
      <Card className="mb-4 flex-shrink-0">
        <CardBody className="gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="搜索数据源..."
              value={search}
              onValueChange={setSearch}
              startContent={<Icon icon="lucide:search" className="text-default-400" />}
              className="flex-1"
            />
            <SourceSelect
              className="w-full sm:w-40"
              placeholder="全部来源"
              isClearable
              value={type}
              onChange={setType}
            />
            <If cond={sources?.length !== 0}>
              <Button
                color="primary"
                onPress={() => navigate('/source/detail')}
                startContent={<Icon icon="lucide:plus" className="w-4 h-4" />}
              >
                添加数据源
              </Button>
            </If>
          </div>
        </CardBody>
      </Card>
      <div className="space-y-4">
        <If cond={(sources?.length || 0) > 0}>
          <Then>
            {sources?.map((source) => {
              return (
                <SourceItem
                  key={source.id}
                  item={source}
                />
              )
            })}
          </Then>
          <Else>
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="flex flex-col items-center justify-center gap-2">
                <Icon icon="lucide:file-text" className="w-18 h-18 text-default-400" />
                <p className="text-default-500 text-center">
                  暂无数据，点击按钮进行生成
                </p>
              </div>
              <Button
                color="primary"
                radius="full"
                onPress={() => navigate('/source/detail')}
                startContent={<Icon icon="lucide:plus" className="w-4 h-4" />}
              >
                添加数据源
              </Button>
            </div>
          </Else>
        </If>
      </div>
    </>
  )
}

export default Page

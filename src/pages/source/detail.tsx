import { Card, CardBody } from '@heroui/react'
import { useParams } from 'react-router-dom'

function Page() {
  // 如果 id 有，则获取 id 对应的源数据，更新表单
  // 如果 id 没有，则显示添加源的表单，并创建源
  const { id: _id } = useParams()
  return (
    <Card>
      <CardBody>
        This is the source detail page
      </CardBody>
    </Card>
  )
}

export default Page

import { If } from '@hairy/react-lib'
import { Button, Input, Select, SelectItem } from '@heroui/react'

function Page() {
  const [selectedSourceType, setSelectedSourceType] = useState<string>('')
  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      <Select
        label="Source Type"
        labelPlacement="outside"
        name="sourceType"
        placeholder="Select source type"
        selectedKeys={selectedSourceType ? [selectedSourceType] : []}
        onSelectionChange={function (keys) {
          const selected = Array.from(keys)[0] as string
          setSelectedSourceType(selected || '')
        }}
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
      <If cond={selectedSourceType === 'git'}>
        <div className="flex gap-4">
          <Input
            label="Git URL"
            labelPlacement="outside"
            placeholder="Enter your Git URL"
          />
          <span className="mt-7.5">/</span>
          <Input
            label="Git Directory"
            labelPlacement="outside"
            placeholder="Enter your Git Directory"
          />
        </div>
        <Input
          label="Git Branch"
          labelPlacement="outside"
          placeholder="Enter your Git Branch"
        />
        <Input
          label="Git Name"
          labelPlacement="outside"
          placeholder="Enter your Git Name"
        />
      </If>

      <Button className="mt-4" color="primary">
        Create
      </Button>
    </div>
  )
}

export default Page

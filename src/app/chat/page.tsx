import { Button, Card, Surface } from '@heroui/react'

import { ArrowUp, Copy, Ellipsis, Microphone, PlugConnection, Plus } from "@gravity-ui/icons";
import { InputGroup, Kbd, Spinner, TextField, Tooltip } from "@heroui/react";

function Page() {

  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = () => {
    if (!value.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setValue("");
    }, 1000);
  };

  return (
    <div className="flex min-h-full flex-col gap-6">
      <div className="flex flex-col gap-10">
        <div className="flex justify-end">
          <Surface
            variant="tertiary"
            className="max-w-[520px] rounded-2xl px-4 py-2 text-sm text-foreground/90"
          >
            how it looks option 3? i want to see if i would like it
          </Surface>
        </div>

        <div className="mx-auto flex w-full flex-col gap-4">
          <div className="text-sm text-foreground/80">Sure! It looks like this:</div>
          <Card className="w-full max-w-[440px] overflow-hidden rounded-2xl">
            <Card.Content className="p-0">
              <img
                alt="Breakfast wrap"
                className="block aspect-square w-full object-cover"
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80"
              />
            </Card.Content>
          </Card>
          <div className="flex items-center gap-1">
            <Button aria-label="Copy" variant="ghost" size="sm" isIconOnly>
              <Copy className="size-4" />
            </Button>
            <Button aria-label="More" variant="ghost" size="sm" isIconOnly>
              <Ellipsis className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto pt-4">
        <TextField
          fullWidth
          aria-label="Prompt input"
          className="flex w-full flex-col"
          name="prompt"
        >
          <InputGroup fullWidth className="flex flex-col gap-2 rounded-3xl py-2">
            <InputGroup.TextArea
              className="w-full resize-none px-3.5"
              placeholder="Assign tasks or ask anything..."
              rows={5}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            <InputGroup.Suffix className="flex w-full items-center gap-1.5 px-3 py-0">
              <Tooltip delay={0}>
                <Button isIconOnly aria-label="Attach file" size="sm" variant="tertiary">
                  <Plus />
                </Button>
                <Tooltip.Content>
                  <p className="text-xs">Add a files and more</p>
                </Tooltip.Content>
              </Tooltip>
              <Tooltip delay={0}>
                <Button isIconOnly aria-label="Connect Apps" size="sm" variant="tertiary">
                  <PlugConnection />
                </Button>
                <Tooltip.Content>
                  <p className="text-xs">Connect apps</p>
                </Tooltip.Content>
              </Tooltip>
              <div className="ml-auto flex items-center gap-1.5">
                <Tooltip delay={0}>
                  <Button isIconOnly aria-label="Voice input" size="sm" variant="ghost">
                    <Microphone />
                  </Button>
                  <Tooltip.Content>
                    <p className="text-xs">Voice input</p>
                  </Tooltip.Content>
                </Tooltip>
                <Tooltip delay={0}>
                  <Button
                    isIconOnly
                    aria-label="Send prompt"
                    isDisabled={!value.trim()}
                    isPending={isSubmitting}
                    onPress={handleSubmit}
                  >
                    {({ isPending }) => (isPending ? <Spinner color="current" size="sm" /> : <ArrowUp />)}
                  </Button>
                  <Tooltip.Content className="flex items-center gap-1">
                    <p className="text-xs">Send</p>
                    <Kbd className="h-4 rounded-sm px-1">
                      <Kbd.Abbr keyValue="enter" />
                    </Kbd>
                  </Tooltip.Content>
                </Tooltip>
              </div>
            </InputGroup.Suffix>
          </InputGroup>
        </TextField>
      </div>
    </div>
  )
}

export default Page

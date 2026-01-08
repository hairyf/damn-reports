import type { PropsWithOverlays } from '@overlastic/react'
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react'
import { useDisclosure } from '@overlastic/react'

export interface DialogProps extends PropsWithOverlays {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

export function Dialog(props: DialogProps) {
  const disclosure = useDisclosure({ props })

  return (
    <Modal isOpen={disclosure.visible} onClose={disclosure.cancel}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{props.title}</ModalHeader>
        <ModalBody>
          <p>{props.message}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={disclosure.cancel}>
            {props.cancelText || '取消'}
          </Button>
          <Button color="danger" onPress={disclosure.confirm}>
            {props.confirmText || '确定'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

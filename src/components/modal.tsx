import type { ButtonProps, ModalProps as HeroUIModalProps } from '@heroui/react'
import type { PropsWithOverlays } from '@overlastic/react'
import {
  Button,
  Modal as HeroUIModal,

  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import { useDisclosure } from '@overlastic/react'

export interface ModalProps extends PropsWithOverlays {
  title: string
  modalProps?: Omit<HeroUIModalProps, 'isOpen' | 'onOpenChange'>
  content?: React.ReactNode
  confirmProps?: ButtonProps
  cancelProps?: ButtonProps
  confirmText?: string
  cancelText?: string
}

export function Modal(props: ModalProps) {
  const disclosure = useDisclosure({
    duration: 1000,
  })

  return (
    <HeroUIModal {...props.modalProps} isOpen={disclosure.visible} onOpenChange={disclosure.change}>
      <ModalContent>
        {onClose => (
          <>
            <ModalHeader className="flex flex-col gap-1">{props.title}</ModalHeader>
            <ModalBody>
              {props.content}
            </ModalBody>
            <ModalFooter>
              <Button {...props.cancelProps} color="danger" variant="light" onPress={onClose}>
                {props.cancelText || '取消'}
              </Button>
              <Button {...props.confirmProps} color="primary" onPress={onClose}>
                {props.confirmText || '确定'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </HeroUIModal>
  )
}

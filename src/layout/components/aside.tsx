'use client'
import type { PropsWithChildren } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { useEvent } from 'react-use'
import { store } from '@/store'

export interface AsideProps extends PropsWithChildren {
  minWidth?: number
  maxWidth?: number
}

export function Aside(props: AsideProps) {
  const {
    maxWidth = 400,
    minWidth = 240,
  } = props
  const { asideShow } = useStore(store.app)

  const { width, onHandleMouseDown } = useAside({
    minWidth,
    maxWidth,
  })

  return (
    <AnimatePresence initial={false}>
      {asideShow && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-background-primary overflow-hidden relative mt-2 shrink-0"
        >
          {props.children}
          <div
            onMouseDown={onHandleMouseDown}
            className="absolute right-0 top-0 w-1 h-full cursor-ew-resize flex items-center justify-center group"
          />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function useAside({
  minWidth,
  maxWidth,
}: {
  minWidth: number
  maxWidth: number
}) {
  const [width, setWidth] = useState(minWidth)
  const draggingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(minWidth)

  function onHandleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    draggingRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  useEvent('mousemove', (e: MouseEvent) => {
    if (!draggingRef.current)
      return

    const diff = e.clientX - startXRef.current
    const width = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + diff))
    setWidth(width)
  })

  useEvent('mouseup', () => {
    if (!draggingRef.current)
      return
    draggingRef.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  })

  return { width, onHandleMouseDown }
}

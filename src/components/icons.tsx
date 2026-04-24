import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { title?: string }

export function baseProps(props: Props) {
  const { className, ...rest } = props
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
    ...rest,
  } as const
}

import {
  Button,
  Navbar as HeroUINavbar,
  Link,
  NavbarContent,
  NavbarItem,
} from '@heroui/react'

export function InitiatorLayout() {
  return (
    <HeroUINavbar maxWidth="full" position="sticky" className="relative">
      <div className="absolute inset-0 w-full" data-tauri-drag-region />
    </HeroUINavbar>
  )
}

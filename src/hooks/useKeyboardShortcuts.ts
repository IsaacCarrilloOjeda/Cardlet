import { useEffect, useRef } from 'react'

type ShortcutMap = Record<string, () => void>

interface Options {
  /** Don't fire when user is typing in an input/textarea (default: true) */
  ignoreInputs?: boolean
  /** Enable/disable all shortcuts (default: true) */
  enabled?: boolean
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  options: Options = {},
) {
  const { ignoreInputs = true, enabled = true } = options
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  useEffect(() => {
    if (!enabled) return

    function onKey(e: KeyboardEvent) {
      if (ignoreInputs) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        if ((e.target as HTMLElement)?.isContentEditable) return
      }

      // Build key string: "ctrl+enter", "shift+n", or just "n"
      const parts: string[] = []
      if (e.ctrlKey || e.metaKey) parts.push('ctrl')
      if (e.shiftKey) parts.push('shift')
      if (e.altKey) parts.push('alt')
      parts.push(e.key.toLowerCase())
      const combo = parts.join('+')

      // Try combo first (e.g. "ctrl+enter"), then plain key
      const handler = shortcutsRef.current[combo] ?? shortcutsRef.current[e.key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ignoreInputs, enabled])
}

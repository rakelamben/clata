import { useEffect, useRef } from "react"
import { DIALOGUES } from "./practice-data"

export default function ConversationTopics({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (id: string) => void
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef(selectedId)
  const frameRef = useRef<number | null>(null)
  selectedRef.current = selectedId

  function centerCard(id: string, behavior: ScrollBehavior = "smooth") {
    const viewport = viewportRef.current
    const card = viewport?.querySelector<HTMLElement>(`[data-topic="${id}"]`)
    if (!viewport || !card) return
    viewport.scrollTo({
      left: card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : behavior,
    })
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const resizeObserver = new ResizeObserver(() =>
      centerCard(selectedRef.current, "instant"),
    )
    resizeObserver.observe(viewport)
    let wheelLocked = false
    let releaseTimer: number | undefined
    function onWheel(event: WheelEvent) {
      if (event.ctrlKey) return
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY
      if (!delta) return
      event.preventDefault()
      window.clearTimeout(releaseTimer)
      // Treat the momentum events of one scroll gesture as a single step.
      releaseTimer = window.setTimeout(() => {
        wheelLocked = false
      }, 250)
      if (wheelLocked) return
      wheelLocked = true
      const current = DIALOGUES.findIndex(
        (topic) => topic.id === selectedRef.current,
      )
      const next = Math.max(
        0,
        Math.min(current + Math.sign(delta), DIALOGUES.length - 1),
      )
      if (current === next) return
      selectedRef.current = DIALOGUES[next].id
      onSelect(selectedRef.current)
      centerCard(selectedRef.current)
    }
    viewport.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      resizeObserver.disconnect()
      viewport.removeEventListener("wheel", onWheel)
      window.clearTimeout(releaseTimer)
      if (frameRef.current !== null)
        window.cancelAnimationFrame(frameRef.current)
    }
  }, [])

  function syncCenteredCard() {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    frameRef.current = window.requestAnimationFrame(() => {
      const viewport = viewportRef.current
      if (!viewport) return
      const bounds = viewport.getBoundingClientRect()
      const center = bounds.left + bounds.width / 2
      let nearestId = selectedRef.current
      let nearestDistance = Infinity
      viewport.querySelectorAll<HTMLElement>("[data-topic]").forEach((card) => {
        const rect = card.getBoundingClientRect()
        const distance = Math.abs(rect.left + rect.width / 2 - center)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestId = card.dataset.topic!
        }
      })
      if (nearestId !== selectedRef.current) onSelect(nearestId)
      frameRef.current = null
    })
  }

  return (
    <div className="conversation-carousel-wrap">
      <div
        ref={viewportRef}
        className="conversation-carousel"
        role="group"
        aria-roledescription="carousel"
        aria-label="Pilih topik percakapan"
        onScroll={syncCenteredCard}
        onKeyDown={(event) => {
          const current = DIALOGUES.findIndex(
            (item) => item.id === selectedRef.current,
          )
          const next =
            event.key === "ArrowRight"
              ? Math.min(current + 1, DIALOGUES.length - 1)
              : event.key === "ArrowLeft"
                ? Math.max(current - 1, 0)
                : event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? DIALOGUES.length - 1
                    : null
          if (next === null) return
          event.preventDefault()
          const id = DIALOGUES[next].id
          viewportRef.current
            ?.querySelector<HTMLElement>(`[data-topic="${id}"]`)
            ?.focus({ preventScroll: true })
          onSelect(id)
          centerCard(id)
        }}
      >
        {DIALOGUES.map((topic) => (
          <button
            type="button"
            key={topic.id}
            data-topic={topic.id}
            className={`conversation-topic-card ${
              selectedId === topic.id ? "is-selected" : ""
            }`}
            aria-pressed={selectedId === topic.id}
            aria-labelledby={`topic-title-${topic.id}`}
            aria-describedby={`topic-description-${topic.id} topic-roles-${topic.id}`}
            onClick={() => {
              onSelect(topic.id)
              centerCard(topic.id)
            }}
            onFocus={() => {
              onSelect(topic.id)
              centerCard(topic.id)
            }}
          >
            <span className="conversation-topic-kicker">Tema</span>
            <span
              className="conversation-topic-title"
              id={`topic-title-${topic.id}`}
            >
              {topic.title}
            </span>
            <span
              className="conversation-topic-description"
              id={`topic-description-${topic.id}`}
            >
              {topic.description}
            </span>
            <span
              className="conversation-topic-roles"
              id={`topic-roles-${topic.id}`}
            >
              <span>
                <span className="conversation-role-label">Lawan bicara</span>
                <span>{topic.partner}</span>
              </span>
              <span>
                <span className="conversation-role-label">Posisi pengguna</span>
                <span>{topic.userRole}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

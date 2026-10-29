import { useEffect, useRef, useState } from "react"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiBookOpenLine,
  RiChat3Line,
  RiCheckboxCircleLine,
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiPuzzleLine,
  RiRefreshLine,
  RiTranslate2,
  RiVolumeUpLine,
} from "@remixicon/react"
import {
  DIALOGUES,
  MODES,
  SESSION_KEY,
  questionBank,
  recordAnswer,
  sessionQuestions,
  validBank,
  validSession,
  type Mode,
  type Session,
} from "./practice-data"
import {
  installPackage,
  readInstalledPackage,
  readLocalProfile,
} from "./local-package"

type View = "home" | "setup" | "loading" | "question" | "summary"
type AudioState = "loading" | "playing" | "stopped" | "unavailable"

export default function Practice({
  onSessionActive,
}: {
  onSessionActive: (active: boolean) => void
}) {
  const [view, setView] = useState<View>("loading")
  const [mode, setMode] = useState<Mode>("guess")
  const [packageReady, setPackageReady] = useState(false)
  const [pending, setPending] = useState<Session | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [dialogId, setDialogId] = useState(DIALOGUES[0].id)
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [feedback, setFeedback] = useState(false)
  const [repair, setRepair] = useState(false)
  const [translation, setTranslation] = useState(false)
  const [audioState, setAudioState] = useState<AudioState>("stopped")
  const [loadError, setLoadError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [unsaved, setUnsaved] = useState<Session | null>(null)
  const [confirm, setConfirm] = useState<"exit" | "replace" | null>(null)
  const [storageBlocked, setStorageBlocked] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDialogElement>(null)
  const audioGeneration = useRef(0)
  const config = MODES.find((item) => item.id === mode)!
  const questions = session ? sessionQuestions(session) : []
  const question = questions[index]
  const dialog = DIALOGUES.find((item) => item.id === session?.dialogId)
  const dialogNode =
    session?.mode === "dialog" ? dialog?.nodes[index] : undefined
  const correct = question && choice === question.correct

  async function load() {
    setView("loading")
    setLoadError("")
    setStorageBlocked(false)
    setPending(null)
    try {
      const installed = await readInstalledPackage()
      setPackageReady(Boolean(installed?.words.length))
      const saved = localStorage.getItem(SESSION_KEY)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (!validSession(parsed)) {
          setStorageBlocked(true)
          setLoadError("Sesi tersimpan belum dapat dibaca.")
        } else if (!parsed.completed) {
          setPending(parsed)
        }
      }
      setView("home")
    } catch {
      setLoadError("Soal belum siap. Coba lagi.")
      setView("home")
    }
  }

  async function install() {
    setView("loading")
    try {
      const profile = await readLocalProfile()
      if (!profile) throw new Error("Profil belum siap.")
      await installPackage(profile)
      setPackageReady(true)
      setLoadError("")
      setView("home")
    } catch {
      setLoadError("Paket belum dapat dipasang. Coba lagi.")
      setView("home")
    }
  }

  useEffect(() => {
    void load()
  }, [])
  useEffect(() => {
    onSessionActive(view === "question")
    return () => onSessionActive(false)
  }, [view, onSessionActive])
  useEffect(() => {
    if (view !== "question" || !feedback) headingRef.current?.focus()
  }, [view, index, feedback])
  useEffect(() => {
    if (feedback) feedbackRef.current?.focus()
  }, [feedback])
  useEffect(() => {
    if (confirm) modalRef.current?.showModal()
    else modalRef.current?.close()
  }, [confirm])
  useEffect(
    () => () => {
      audioGeneration.current++
      window.speechSynthesis?.cancel()
    },
    [],
  )
  useEffect(() => {
    const stop = () => {
      if (document.hidden) stopAudio()
    }
    document.addEventListener("visibilitychange", stop)
    return () => document.removeEventListener("visibilitychange", stop)
  }, [])

  function stopAudio() {
    audioGeneration.current++
    window.speechSynthesis?.cancel()
    setAudioState("stopped")
  }
  function playAudio(text: string) {
    if (audioState === "playing" || audioState === "loading") {
      stopAudio()
      return
    }
    if (!("speechSynthesis" in window)) {
      setAudioState("unavailable")
      return
    }
    stopAudio()
    const generation = audioGeneration.current
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "id-ID"
    utterance.rate = 0.85
    setAudioState("loading")
    utterance.onstart = () => {
      if (generation === audioGeneration.current) setAudioState("playing")
    }
    utterance.onend = () => {
      if (generation === audioGeneration.current) setAudioState("stopped")
    }
    utterance.onerror = () => {
      if (generation === audioGeneration.current) setAudioState("unavailable")
    }
    window.speechSynthesis.speak(utterance)
  }
  function save(value: Session): boolean {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(value))
      setSaveError("")
      setUnsaved(null)
      return true
    } catch {
      setSaveError(
        "Jawaban belum tersimpan. Coba simpan lagi sebelum melanjutkan.",
      )
      setUnsaved(value)
      return false
    }
  }
  function start() {
    const value: Session = {
      version: 1,
      bankVersion: 1,
      id: crypto.randomUUID(),
      mode,
      answers: [],
      completed: false,
      ...(mode === "dialog" ? { dialogId } : {}),
    }
    if (!save(value)) return
    setPending(null)
    setSession(value)
    setIndex(0)
    setChoice(null)
    setFeedback(false)
    setRepair(false)
    setTranslation(false)
    setView("question")
  }
  function resume() {
    if (!pending) return
    setMode(pending.mode)
    setSession(pending)
    const last = Math.min(
      pending.answers.length,
      sessionQuestions(pending).length - 1,
    )
    setIndex(last)
    const answered = pending.answers.length === sessionQuestions(pending).length
    setChoice(answered ? pending.answers[last].choice : null)
    setFeedback(answered)
    setRepair(false)
    setTranslation(false)
    setView("question")
  }
  function check() {
    if (choice === null || !session || feedback) return
    stopAudio()
    if (session.mode === "dialog" && !correct) {
      setRepair(true)
      setFeedback(true)
      return
    }
    const updated = recordAnswer(session, choice)
    setSession(updated)
    save(updated)
    setFeedback(true)
  }
  function next() {
    if (!session || unsaved) return
    stopAudio()
    if (repair) {
      setChoice(null)
      setFeedback(false)
      setRepair(false)
      return
    }
    if (index + 1 === questions.length) {
      const finished = { ...session, completed: true }
      if (!save(finished)) return
      setSession(finished)
      setPending(null)
      setView("summary")
    } else {
      setIndex((current) => current + 1)
      setChoice(null)
      setFeedback(false)
      setTranslation(false)
    }
  }
  function leave() {
    stopAudio()
    setConfirm(null)
    if (session && !session.completed) setPending(session)
    setView("home")
  }
  const audioButton = (text: string) => (
    <button
      type="button"
      className={`icon-button practice-audio ${
        audioState === "playing" ? "is-playing" : ""
      }`}
      aria-label={`Audio. ${
        audioState === "playing"
          ? "sedang diputar"
          : audioState === "loading"
            ? "sedang dimuat"
            : audioState === "unavailable"
              ? "tidak tersedia"
              : "berhenti"
      }`}
      aria-pressed={audioState === "playing"}
      onClick={() => playAudio(text)}
    >
      <RiVolumeUpLine aria-hidden="true" />
    </button>
  )

  return (
    <div
      className={`practice-screen ${
        view === "question" ? "practice-session" : ""
      }`}
    >
      {view === "loading" ? (
        <div className="practice-loading" role="status">
          <span className="prep-spinner" aria-hidden="true" />
          Menyiapkan latihan…
        </div>
      ) : view === "home" ? (
        <>
          <header className="practice-header">
            <h1 ref={headingRef} tabIndex={-1}>
              Latihan
            </h1>
          </header>
          <div className="practice-home-body">
            {pending && (
              <section
                className="practice-recovery"
                aria-labelledby="recovery-title"
              >
                <RiRefreshLine aria-hidden="true" />
                <div>
                  <h2 id="recovery-title">Sesi terakhir belum selesai.</h2>
                  <p>
                    {MODES.find((item) => item.id === pending.mode)?.title} ·{" "}
                    {pending.answers.length} jawaban tersimpan
                  </p>
                  <div className="practice-inline-actions">
                    <button className="primary-button" onClick={resume}>
                      Lanjutkan
                    </button>
                    <button
                      className="practice-text-button"
                      onClick={() => {
                        setMode(pending.mode)
                        setView("setup")
                      }}
                    >
                      Mulai baru
                    </button>
                  </div>
                </div>
              </section>
            )}
            {loadError ? (
              <section className="practice-empty">
                <RiErrorWarningLine aria-hidden="true" />
                <h2>
                  {storageBlocked
                    ? "Sesi tersimpan belum dapat dibaca."
                    : loadError}
                </h2>
                <p>
                  {storageBlocked
                    ? "Data lama tidak dihapus. Coba buka ulang sebelum memulai sesi baru."
                    : "Periksa penyimpanan perangkat, lalu coba lagi."}
                </p>
                <button className="primary-button" onClick={load}>
                  Coba lagi
                </button>
              </section>
            ) : !packageReady ? (
              <section className="practice-empty">
                <RiBookOpenLine aria-hidden="true" />
                <h2>Paket belajar belum tersedia.</h2>
                <button className="primary-button" onClick={install}>
                  Pasang paket
                </button>
              </section>
            ) : (
              <div
                className="practice-cards"
                role="group"
                aria-labelledby="practice-mode-label"
              >
                <h2 id="practice-mode-label" className="practice-mode-label">MODE</h2>
                {MODES.map((item, i) => {
                  const Icon = [RiTranslate2, RiPuzzleLine, RiChat3Line][i]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`practice-mode-card practice-mode-${item.id}`}
                      aria-labelledby={`mode-title-${item.id}`}
                      aria-describedby={`mode-description-${item.id}`}
                      onClick={() => {
                        setMode(item.id)
                        setView("setup")
                      }}
                    >
                      <span className="practice-card-copy">
                        <span
                          className="practice-card-title"
                          id={`mode-title-${item.id}`}
                        >
                          {item.title}
                        </span>
                        <span
                          className="practice-card-description"
                          id={`mode-description-${item.id}`}
                        >
                          {item.description}
                        </span>
                      </span>
                      <span className="practice-card-icon">
                        <Icon aria-hidden="true" />
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : view === "setup" ? (
        <>
          <header className="practice-topbar">
            <button
              className="icon-button"
              aria-label="Kembali ke Latihan"
              onClick={() => setView("home")}
            >
              <RiArrowLeftLine aria-hidden="true" />
            </button>
            <span>Persiapan sesi</span>
          </header>
          <section className="practice-setup">
            <div className="practice-setup-icon">
              {mode === "dialog" ? (
                <RiChat3Line aria-hidden="true" />
              ) : mode === "gap" ? (
                <RiPuzzleLine aria-hidden="true" />
              ) : (
                <RiTranslate2 aria-hidden="true" />
              )}
            </div>
            <span className="package-pill">Jawa – Mataraman</span>
            <h1 ref={headingRef} tabIndex={-1}>
              {config.title}
            </h1>
            <p>{config.detail}</p>
            {!validBank(mode) ? (
              <div className="practice-empty">
                <h2>Belum ada materi untuk sesi ini.</h2>
                <button
                  className="practice-text-button"
                  onClick={() => setView("home")}
                >
                  Kembali ke Latihan
                </button>
              </div>
            ) : (
              <>
                {mode === "dialog" ? (
                  <div
                    className="practice-dialog-options"
                    role="group"
                    aria-label="Pilih dialog"
                  >
                    {DIALOGUES.map((item) => (
                      <button
                        key={item.id}
                        className={`practice-answer ${
                          dialogId === item.id ? "is-selected" : ""
                        }`}
                        aria-pressed={dialogId === item.id}
                        onClick={() => setDialogId(item.id)}
                      >
                        <span>
                          <strong>{item.title}</strong>
                          <span className="dialog-choice-description">
                            {item.description}
                          </span>
                          <span className="dialog-choice-description">
                            {item.register}
                          </span>
                        </span>
                        {dialogId === item.id && (
                          <RiCheckLine aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="practice-session-details">
                    <span>10 soal</span>
                    <span>Tanpa batas waktu</span>
                    <span>Tanpa audio wajib</span>
                  </div>
                )}
                <button
                  className="primary-button practice-full-button"
                  onClick={() => (pending ? setConfirm("replace") : start())}
                >
                  Mulai latihan
                  <RiArrowRightLine aria-hidden="true" />
                </button>
              </>
            )}
          </section>
        </>
      ) : view === "question" && session && question ? (
        <>
          <header className="practice-topbar">
            <h1 ref={headingRef} tabIndex={-1}>
              {session.mode === "dialog"
                ? `Percakapan ${index + 1} dari ${questions.length}`
                : `Soal ${index + 1} dari ${questions.length}`}
            </h1>
            <button
              className="icon-button"
              aria-label="Keluar dari sesi"
              onClick={() => setConfirm("exit")}
            >
              <RiCloseLine aria-hidden="true" />
            </button>
          </header>
          <div className="practice-question-progress" aria-hidden="true">
            {questions.map((item, i) => (
              <span key={item.id} className={i <= index ? "is-filled" : ""} />
            ))}
          </div>
          <section className="practice-question-body">
            <p className="practice-question-type">{config.label}</p>
            {dialogNode ? (
              <>
                <div
                  className="dialog-transcript"
                  aria-label="Transkrip percakapan"
                >
                  {dialog?.nodes.slice(0, index).map((node, i) => (
                    <div className="dialog-history" key={node.id}>
                      <p>
                        <strong>{node.speaker}</strong> {node.text}
                      </p>
                      <p>
                        <strong>Kamu</strong>{" "}
                        {node.choices[session.answers[i].choice]}
                      </p>
                    </div>
                  ))}
                  <div className="dialog-current">
                    <span className="dialog-speaker">{dialogNode.speaker}</span>
                    <p>{dialogNode.text}</p>
                    {audioButton(dialogNode.text)}
                    <button
                      className="practice-text-button"
                      aria-expanded={translation}
                      onClick={() => setTranslation((value) => !value)}
                    >
                      {translation
                        ? "Sembunyikan terjemahan"
                        : "Lihat terjemahan"}
                    </button>
                    {translation && (
                      <p className="dialog-translation">
                        {dialogNode.translation}
                      </p>
                    )}
                  </div>
                </div>
                <h2 className="dialog-response-heading">Apa responsmu?</h2>
              </>
            ) : (
              <div className="practice-prompt">
                <h2>{questionBank(session.mode)[index].prompt}</h2>
              </div>
            )}
            {audioState === "unavailable" && (
              <p className="practice-audio-note" role="status">
                Audio belum tersedia. Kamu tetap bisa membaca teksnya.
              </p>
            )}
            <div
              className="practice-answers"
              role="group"
              aria-label="Pilihan jawaban"
            >
              {question.choices.map((answer, i) => (
                <button
                  type="button"
                  key={answer}
                  className={`practice-answer ${
                    choice === i ? "is-selected" : ""
                  } ${
                    feedback && i === question.correct && !repair
                      ? "is-correct"
                      : ""
                  }`}
                  aria-pressed={choice === i}
                  disabled={feedback}
                  onClick={() => setChoice(i)}
                >
                  <span className="practice-answer-letter" aria-hidden="true">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{answer}</span>
                  {choice === i && <RiCheckLine aria-hidden="true" />}
                </button>
              ))}
            </div>
            <div className="practice-feedback-slot">
              {feedback && (
                <div
                  ref={feedbackRef}
                  tabIndex={-1}
                  role="status"
                  aria-live="polite"
                  className={`practice-feedback ${
                    correct ? "feedback-correct" : "feedback-incorrect"
                  }`}
                >
                  <div>
                    {correct ? (
                      <RiCheckboxCircleLine aria-hidden="true" />
                    ) : (
                      <RiInformationLine aria-hidden="true" />
                    )}
                    <strong>
                      {repair
                        ? "Coba respons lain."
                        : correct
                          ? "Benar. Lihat contoh penggunaannya."
                          : `Belum tepat. Jawaban yang benar: ${question.choices[question.correct]}.`}
                    </strong>
                  </div>
                  <p>{repair ? dialogNode?.repair : question.explanation}</p>
                  {!dialogNode && !repair && (
                    <p className="practice-example">
                      {questionBank(session.mode)[index].example}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
          <footer className="practice-question-footer">
            {feedback ? (
              <button
                ref={nextRef}
                className="primary-button practice-full-button"
                disabled={Boolean(unsaved)}
                onClick={next}
              >
                {repair ? "Coba respons lain" : "Lanjut"}
                <RiArrowRightLine aria-hidden="true" />
              </button>
            ) : (
              <button
                className="primary-button practice-full-button"
                disabled={choice === null}
                onClick={check}
              >
                Periksa jawaban
              </button>
            )}
          </footer>
        </>
      ) : view === "summary" && session ? (
        <section className="practice-summary">
          <div className="practice-summary-icon">
            <RiCheckboxCircleLine aria-hidden="true" />
          </div>
          <span className="package-pill">Sesi selesai</span>
          <h1 ref={headingRef} tabIndex={-1}>
            Satu langkah
            <br />
            lebih percaya diri.
          </h1>
          <p>Selesai. Terima kasih sudah berlatih.</p>
          <div className="practice-summary-detail">
            {session.answers.length}{" "}
            {session.mode === "dialog" ? "respons" : "soal"} telah kamu latih.
            <span>Jawaban tersimpan di perangkatmu.</span>
          </div>
          <button
            className="primary-button practice-full-button"
            onClick={() => {
              setView("home")
              setSession(null)
            }}
          >
            Kembali ke Latihan
            <RiArrowRightLine aria-hidden="true" />
          </button>
        </section>
      ) : null}
      {saveError && (
        <div className="practice-save-error" role="alert">
          <p>{saveError}</p>
          <button
            className="practice-text-button"
            onClick={() => {
              if (unsaved && save(unsaved)) {
                setSession(unsaved)
                if (unsaved.completed) {
                  setPending(null)
                  setView("summary")
                } else if (view === "setup") {
                  setIndex(0)
                  setChoice(null)
                  setFeedback(false)
                  setRepair(false)
                  setTranslation(false)
                  setPending(null)
                  setView("question")
                }
              }
            }}
          >
            Coba simpan lagi
          </button>
        </div>
      )}
      <dialog
        ref={modalRef}
        className="practice-confirm"
        onCancel={() => setConfirm(null)}
        aria-labelledby="practice-confirm-title"
      >
        <h2 id="practice-confirm-title">
          {confirm === "replace" ? "Mulai sesi baru?" : "Keluar dari sesi?"}
        </h2>
        <p>
          {confirm === "replace"
            ? "Sesi yang belum selesai akan diganti. Jawaban sesi lama akan dihapus setelah kamu mengonfirmasi."
            : unsaved
              ? "Jawaban terbaru belum tersimpan. Simpan kembali sebelum keluar."
              : "Jawaban yang sudah tersimpan tetap aman."}
        </p>
        <button
          className="primary-button practice-full-button"
          disabled={Boolean(unsaved)}
          onClick={() => {
            if (confirm === "replace") {
              setConfirm(null)
              start()
            } else leave()
          }}
        >
          {confirm === "replace" ? "Ya, mulai baru" : "Keluar dari sesi"}
        </button>
        <button
          className="practice-text-button"
          onClick={() => setConfirm(null)}
        >
          Batal
        </button>
      </dialog>
    </div>
  )
}

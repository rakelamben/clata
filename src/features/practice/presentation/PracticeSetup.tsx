import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import RemixIcon from 'react-native-remix-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppRuntime } from '../../../bootstrap/AppBootstrap';
import { colors, fonts, radii, spacing, touchTarget } from '../../../ui/theme';
import { useReduceMotion } from '../../../ui/useReduceMotion';
import {
  ConversationSetupIllustration,
  GapSetupIllustration,
  GuessSetupIllustration,
  PracticeSummaryIllustration,
} from './PracticeIllustrations';
import { ConversationTopics } from './ConversationTopics';
import { PracticeFeedbackSheet } from './PracticeFeedbackSheet';
import type { PracticeExerciseType, PracticeQuestion, PracticeUnitInfo } from '../domain/practiceTypes';
import { PracticeConfirmModal } from './PracticeConfirmModal';
import { PracticeSetupSkeleton } from './PracticeSetupSkeleton';
import { PracticeError, PracticeLoading } from './PracticeStates';

type ViewMode = 'home' | 'setup' | 'loading' | 'question' | 'summary';
type ModeId = 'guess' | 'gap' | 'dialog' | 'mixed';
type ConversationPhase = 'idle' | 'partner-typing' | 'awaiting-response' | 'user-typing' | 'user-sent';

type ModeConfig = {
  id: ModeId;
  title: string;
  description: string;
  icon: 'translate-2' | 'puzzle-line' | 'chat-3-line' | 'shuffle-line';
  instruction: string;
};

const MODES: readonly ModeConfig[] = [
  {
    id: 'mixed',
    title: 'Ulangan Campur',
    description: 'Gabungan tebak kata & kalimat rumpang dari semua unit.',
    icon: 'shuffle-line',
    instruction: 'Pilih jawaban yang paling tepat.',
  },
  {
    id: 'guess',
    title: 'Tebak kata',
    description: 'Pilih kata yang tepat sesuai arti atau konteks.',
    icon: 'translate-2',
    instruction: 'Pilih kata yang sesuai dengan artinya.',
  },
  {
    id: 'gap',
    title: 'Kalimat rumpang',
    description: 'Lengkapi kalimat dengan kata yang hilang.',
    icon: 'puzzle-line',
    instruction: 'Lengkapi kalimat dengan kata yang tepat.',
  },
  {
    id: 'dialog',
    title: 'Percakapan',
    description: 'Pilih respons yang tepat dalam situasi nyata.',
    icon: 'chat-3-line',
    instruction: 'Pilih topik percakapanmu.',
  },
];

type QuestionItem = {
  id: string;
  prompt: string;
  promptLanguage: 'jv' | 'id';
  choices: string[];
  correct: number;
  explanation: string;
  example?: string;
  audioPath?: string;
  translation?: string;
  rawQuestion?: PracticeQuestion;
};

type DialogNode = {
  id: string;
  speaker: string;
  text: string;
  translation: string;
  choices: string[];
  correct: number;
  repair: string;
  audioPath?: string;
};

type DialogScenario = {
  id: string;
  title: string;
  partner: string;
  avatar: string;
  nodes: DialogNode[];
};

const CURATED_DIALOGUES: DialogScenario[] = [
  {
    id: 'dialog-sapaan',
    title: 'Menyapa Tetangga',
    partner: 'Tetangga',
    avatar: 'https://images.unsplash.com/photo-1516011362164-3095a82b0af9?crop=faces&fit=crop&h=160&w=160&q=80',
    nodes: [
      {
        id: 's1',
        speaker: 'Tetangga',
        text: 'Sugeng enjing, Mas.',
        translation: 'Selamat pagi, Mas.',
        choices: ['Sugeng enjing, Pak.', 'Sugeng dalu, Pak.', 'Mangan rumiyin.'],
        correct: 0,
        repair: "Gunakan 'Sugeng enjing' untuk membalas sapaan selamat pagi.",
      },
      {
        id: 's2',
        speaker: 'Tetangga',
        text: 'Badhe tindak pundi?',
        translation: 'Mau pergi ke mana?',
        choices: ['Badhe dhateng peken.', 'Nembe tilem.', 'Sampun nedha.'],
        correct: 0,
        repair: "Gunakan 'Badhe dhateng peken' (Mau ke pasar) untuk menjawab tujuan bepergian.",
      },
      {
        id: 's3',
        speaker: 'Tetangga',
        text: 'Nggih, ngatos-atos ing dalan.',
        translation: 'Ya, hati-hati di jalan.',
        choices: ['Matur nuwun, Pak.', 'Sami-sami.', 'Mboten napa-napa.'],
        correct: 0,
        repair: "Gunakan 'Matur nuwun' untuk menyampaikan terima kasih atas perhatian tetangga.",
      },
    ],
  },
  {
    id: 'dialog-pasar',
    title: 'Belanja di Pasar',
    partner: 'Penjual Pasar',
    avatar: 'https://images.unsplash.com/photo-1585917170055-e40d30c73414?crop=faces&fit=crop&h=160&w=160&q=80',
    nodes: [
      {
        id: 'p1',
        speaker: 'Penjual Pasar',
        text: 'Mangga, badhe tumbas napa?',
        translation: 'Silakan, mau beli apa?',
        choices: ['Kula badhe tumbas beras.', 'Kula badhe sare.', 'Matur nuwun.'],
        correct: 0,
        repair: "Gunakan 'Kula badhe tumbas...' untuk menyebutkan barang yang ingin dibeli.",
      },
      {
        id: 'p2',
        speaker: 'Penjual Pasar',
        text: 'Menika setunggal kilo sedasa ewu.',
        translation: 'Ini satu kilo sepuluh ribu.',
        choices: ['Nggih, kula tumbas kalih kilo.', 'Mboten pareng.', 'Sampun enjing.'],
        correct: 0,
        repair: "Jawab dengan 'Nggih, kula tumbas...' untuk menyetujui dan menentukan jumlah pembelian.",
      },
    ],
  },
  {
    id: 'dialog-tamu',
    title: 'Menerima Tamu',
    partner: 'Tamu Rumah',
    avatar: 'https://images.unsplash.com/photo-1516011362164-3095a82b0af9?crop=faces&fit=crop&h=160&w=160&q=80',
    nodes: [
      {
        id: 't1',
        speaker: 'Tamu Rumah',
        text: 'Kula nuwun.',
        translation: 'Permisi / salam bertamu.',
        choices: ['Mangga, pinarak.', 'Mboten pareng.', 'Sampun siang.'],
        correct: 0,
        repair: "Ucapkan 'Mangga, pinarak' untuk mempersilakan tamu masuk dan duduk.",
      },
      {
        id: 't2',
        speaker: 'Tamu Rumah',
        text: 'Matur nuwun sanget.',
        translation: 'Terima kasih banyak.',
        choices: ['Sami-sami, mangga dipun unjuk.', 'Kula mboten ngertos.', 'Sugeng dalu.'],
        correct: 0,
        repair: "Jawab dengan 'Sami-sami, mangga dipun unjuk' untuk mempersilakan tamu menikmati hidangan minum.",
      },
    ],
  },
  {
    id: 'dialog-warung',
    title: 'Pesan Makanan di Warung',
    partner: 'Pemilik Warung',
    avatar: 'https://images.unsplash.com/photo-1585917170055-e40d30c73414?crop=faces&fit=crop&h=160&w=160&q=80',
    nodes: [
      {
        id: 'w1',
        speaker: 'Pemilik Warung',
        text: 'Ngersakaken dhahar napa, Mas?',
        translation: 'Ingin makan apa, Mas?',
        choices: ['Kula pesen sekul rawon kalih es teh.', 'Kula mboten purun nedha.', 'Sampun wengi.'],
        correct: 0,
        repair: "Ucapkan 'Kula pesen...' untuk memesan menu yang diinginkan secara santun.",
      },
      {
        id: 'w2',
        speaker: 'Pemilik Warung',
        text: 'Sekulipun dipun pisah menapa dipun campur?',
        translation: 'Nasinya dipisah atau dicampur?',
        choices: ['Dipun pisah mawon, Bu.', 'Mboten pareng mangan.', 'Kula badhe tindak.'],
        correct: 0,
        repair: "Gunakan 'Dipun pisah mawon' untuk meminta nasi dan kuah disajikan terpisah.",
      },
    ],
  },
  {
    id: 'dialog-arah',
    title: 'Menanyakan Arah Jalan',
    partner: 'Warga Sekitar',
    avatar: 'https://images.unsplash.com/photo-1516011362164-3095a82b0af9?crop=faces&fit=crop&h=160&w=160&q=80',
    nodes: [
      {
        id: 'a1',
        speaker: 'Warga Sekitar',
        text: 'Wonten ingkang saged dipun bantu, Mas?',
        translation: 'Ada yang bisa dibantu, Mas?',
        choices: ['Nyuwun sewu, margi dhateng stasiun pundi nggih?', 'Kula badhe sare.', 'Mboten wonten.'],
        correct: 0,
        repair: "Awali dengan 'Nyuwun sewu' (permisi) saat menanyakan petunjuk arah jalan.",
      },
      {
        id: 'a2',
        speaker: 'Warga Sekitar',
        text: 'Lurus mawon, lajeng menggok nengen wonten prapatan.',
        translation: 'Lurus saja, lalu belok kanan di perempatan.',
        choices: ['Matur nuwun sanget pitedahipun, Pak.', 'Kula mboten percaya.', 'Sampun dalu.'],
        correct: 0,
        repair: "Sampaikan terima kasih atas petunjuk ('Matur nuwun sanget pitedahipun').",
      },
    ],
  },
  {
    id: 'dialog-pamit',
    title: 'Pamit Pulang',
    partner: 'Tuan Rumah',
    avatar: 'https://images.unsplash.com/photo-1585917170055-e40d30c73414?crop=faces&fit=crop&h=160&w=160&q=80',
    nodes: [
      {
        id: 'pm1',
        speaker: 'Tuan Rumah',
        text: 'Kok kesusu, mangga lenggah rumiyin.',
        translation: 'Kok terburu-buru, mari duduk dulu.',
        choices: ['Nyuwun pangapunten, sampun sonten, kula nyuwun pamit rumiyin.', 'Kula mboten remen wonten mriki.', 'Mangga dipun unjuk.'],
        correct: 0,
        repair: "Gunakan 'kula nyuwun pamit rumiyin' untuk berpamitan dengan sopan.",
      },
      {
        id: 'pm2',
        speaker: 'Tuan Rumah',
        text: 'Nggih mangga, matur nuwun sampun kersa rawuh.',
        translation: 'Iya silakan, terima kasih sudah bersedia datang.',
        choices: ['Sami-sami Pak, kula nyuwun pamit. Sugeng sonten.', 'Mboten pareng wangsul.', 'Kula badhe nedha malih.'],
        correct: 0,
        repair: "Balas keramahan tuan rumah dan ucapkan salam pamit ('Sugeng sonten').",
      },
    ],
  },
];

type SessionData = {
  id: string;
  mode: ModeId;
  unitId?: string;
  dialogId?: string;
  answers: { choice: number }[];
  completed: boolean;
};

// Curated question banks for pedagogical completeness & fallback
const DEFAULT_GUESS_QUESTIONS: readonly QuestionItem[] = [
  {
    id: 'g1',
    prompt: 'sugeng',
    promptLanguage: 'jv',
    choices: ['selamat', 'tidur', 'makan', 'pagi'],
    correct: 0,
    explanation: "'Sugeng' berarti selamat, lazim digunakan dalam sapaan seperti sugeng enjing.",
    example: 'Sugeng rawuh ing kitha Solo.',
  },
  {
    id: 'g2',
    prompt: 'enjing',
    promptLanguage: 'jv',
    choices: ['pagi', 'malam', 'siang', 'sore'],
    correct: 0,
    explanation: "'Enjing' berarti pagi hari dalam bahasa Jawa.",
    example: 'Kula tangi saben enjing.',
  },
  {
    id: 'g3',
    prompt: 'awan',
    promptLanguage: 'jv',
    choices: ['langit', 'bumi', 'air', 'api'],
    correct: 0,
    explanation: "'Awan' berarti langit atau waktu siang dalam konteks tertentu.",
    example: 'Awan ing dhuwur katon padhang.',
  },
  {
    id: 'g4',
    prompt: 'mangan',
    promptLanguage: 'jv',
    choices: ['makan', 'minum', 'tidur', 'berlari'],
    correct: 0,
    explanation: "'Mangan' merupakan kata kerja tingkat ngoko yang berarti makan.",
    example: 'Ayo mangan bareng ing warung.',
  },
  {
    id: 'g5',
    prompt: 'turu',
    promptLanguage: 'jv',
    choices: ['tidur', 'bangun', 'duduk', 'berdiri'],
    correct: 0,
    explanation: "'Turu' merupakan kata tingkat ngoko yang berarti tidur.",
    example: 'Adhiku wis turu awan.',
  },
];

const DEFAULT_GAP_QUESTIONS: readonly QuestionItem[] = [
  {
    id: 'gap1',
    prompt: 'sugeng ___',
    promptLanguage: 'jv',
    translation: 'Selamat pagi',
    choices: ['enjing', 'mangan', 'turu', 'banyu'],
    correct: 0,
    explanation: "'Sugeng enjing' adalah ungkapan salam selamat pagi yang tepat.",
    example: 'Sugeng enjing, Bapak Ibu.',
  },
  {
    id: 'gap2',
    prompt: 'kula badhe ___ sekul',
    promptLanguage: 'jv',
    translation: 'Saya hendak makan nasi',
    choices: ['nedha', 'turu', 'mlampah', 'maca'],
    correct: 0,
    explanation: "Kata kerja yang tepat untuk nasi (sekul) adalah 'nedha' (makan).",
    example: 'Kula badhe nedha rumiyin.',
  },
  {
    id: 'gap3',
    prompt: 'bapak nembe ___ ing kamar',
    promptLanguage: 'jv',
    translation: 'Bapak sedang tidur di kamar',
    choices: ['sare', 'mangan', 'mlayu', 'adhang'],
    correct: 0,
    explanation: "Kata krama inggil yang santun untuk tidur bagi orang tua adalah 'sare'.",
    example: 'Bapak nembe sare wonten kamar.',
  },
  {
    id: 'gap4',
    prompt: 'ibu tindak dhateng ___ mundhut sayur',
    promptLanguage: 'jv',
    translation: 'Ibu pergi ke pasar membeli sayur',
    choices: ['peken', 'sawah', 'kamar', 'sekolah'],
    correct: 0,
    explanation: "Kata krama untuk pasar adalah 'peken'.",
    example: 'Ibu tindak dhateng peken.',
  },
  {
    id: 'gap5',
    prompt: 'adhik nembe sinau ___ basa Jawa',
    promptLanguage: 'jv',
    translation: 'Adik sedang belajar membaca bahasa Jawa',
    choices: ['maca', 'mlayu', 'turu', 'adus'],
    correct: 0,
    explanation: "Kata kerja yang tepat untuk teks atau buku adalah 'maca' (membaca).",
    example: 'Adhik sinau maca aksara Jawa.',
  },
];

export function PracticeSetup() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const reduceMotion = useReduceMotion();
  const { container, profile } = useAppRuntime();
  const packageId = profile?.selectedPackageId ?? 'jawa-mataraman';

  // Navigation & View state
  const [view, setView] = useState<ViewMode>('home');
  const [mode, setMode] = useState<ModeId>('guess');
  const [selectedDialogueId, setSelectedDialogueId] = useState('dialog-sapaan');
  const [session, setSession] = useState<SessionData | null>(null);
  const [pending, setPending] = useState<SessionData | null>(null);

  // Question / Dialogue runner state
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(false);
  const [translation, setTranslation] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'exit' | 'replace' | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  // Dialogue phase & mistakes
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>('idle');
  const [conversationMistakes, setConversationMistakes] = useState<Record<string, number[]>>({});

  // Audio state
  const [audioState, setAudioState] = useState<'stopped' | 'loading' | 'playing' | 'unavailable'>('stopped');
  const [playingItem, setPlayingItem] = useState<string | null>(null);

  // Question banks loaded from package
  const [units, setUnits] = useState<PracticeUnitInfo[]>([]);
  const [setupUnitId, setSetupUnitId] = useState<string | undefined>(undefined);
  const [activeSessionQuestions, setActiveSessionQuestions] = useState<QuestionItem[]>([]);
  const [guessBank] = useState<QuestionItem[]>(() => [...DEFAULT_GUESS_QUESTIONS]);
  const [gapBank] = useState<QuestionItem[]>(() => [...DEFAULT_GAP_QUESTIONS]);
  const [dialogueBank, setDialogueBank] = useState<Record<string, DialogScenario>>({});
  const [error, setError] = useState<string | null>(null);

  // Load units from database
  useEffect(() => {
    let ignore = false;
    async function loadUnits() {
      try {
        const res = await container.practice.getUnits(packageId);
        if (res.ok && !ignore) {
          setUnits(res.data);
        }
      } catch (err) {
        console.warn('Failed to load units:', err);
      }
    }
    loadUnits();
    return () => { ignore = true; };
  }, [packageId, container.practice]);

  // Refs
  const conversationScrollRef = useRef<any>(null);
  const conversationTimerRef = useRef<any>(null);

  // Determine if session is active (Setup, Question, Summary)
  const sessionActive = view === 'setup' || view === 'question' || view === 'summary';

  // Hide bottom tab bar dynamically when session/setup is active
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: sessionActive ? { display: 'none' } : undefined,
    });
    return () => {
      navigation.setOptions({ tabBarStyle: undefined });
    };
  }, [sessionActive, navigation]);

  // Pre-session skeleton loading timer to hide initial layout adjusting
  useEffect(() => {
    if (view === 'setup' && setupLoading) {
      const timer = setTimeout(() => {
        setSetupLoading(false);
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [view, setupLoading]);

  // Dynamic question count for setup (Pra-Sesi)
  const [setupQuestionCount, setSetupQuestionCount] = useState<number>(10);

  useEffect(() => {
    let ignore = false;
    if (view !== 'setup') return;

    async function updateSetupCount() {
      if (mode === 'dialog') return;
      const exType: PracticeExerciseType =
        mode === 'mixed' ? 'mixed' : mode === 'guess' ? 'guess_the_word' : 'fill_the_gap';
      try {
        const avail = await container.practice.getAvailability(packageId, exType, setupUnitId);
        if (!ignore && avail.ok && avail.data) {
          const availCount = avail.data.count;
          const expected = Math.min(10, Math.max(1, availCount));
          setSetupQuestionCount(expected);
        }
      } catch {
        if (!ignore) setSetupQuestionCount(10);
      }
    }

    void updateSetupCount();
    return () => {
      ignore = true;
    };
  }, [view, mode, setupUnitId, packageId, container.practice]);

  // Audio playback handler
  const stopAudio = useCallback(() => {
    void container.audio.stop();
    setAudioState('stopped');
    setPlayingItem(null);
  }, [container.audio]);

  const playAudio = useCallback(async (text: string, path?: string) => {
    if (playingItem === text && (audioState === 'playing' || audioState === 'loading')) {
      stopAudio();
      return;
    }
    stopAudio();
    setPlayingItem(text);

    if (path) {
      const resolved = container.audioSources.resolve(packageId, '1.0.0', path);
      if (resolved) {
        setAudioState('loading');
        try {
          await container.audio.play({ itemId: text, uri: resolved, format: 'opus' });
          setAudioState('playing');
          return;
        } catch {
          setAudioState('unavailable');
          return;
        }
      }
    }
    // If no bundled file or failed, mark unavailable
    setAudioState('unavailable');
  }, [container.audio, container.audioSources, packageId, playingItem, audioState, stopAudio]);

  // Reactive Auto-scroll Chat
  useEffect(() => {
    if (view !== 'question' || session?.mode !== 'dialog' || conversationPhase === 'idle') {
      return;
    }
    const timer = setTimeout(() => {
      conversationScrollRef.current?.scrollToEnd({ animated: !reduceMotion });
    }, 60);
    return () => clearTimeout(timer);
  }, [view, index, session?.mode, conversationPhase, translation, reduceMotion]);

  // Load dialogue graph from SQLite repository for active dialogue
  useEffect(() => {
    let ignore = false;
    const activeId = session?.dialogId ?? selectedDialogueId;
    void container.dialogue.getDialogueGraph(packageId, activeId).then((result) => {
      if (ignore) return;
      if (result.ok && result.data) {
        const graph = result.data;
        const mappedNodes: DialogNode[] = graph.nodes.map((node) => {
          const choices = node.choices ? node.choices.map((c) => c.text) : [];
          const correctIdx = node.choices ? node.choices.findIndex((c) => c.quality === 'pas') : 0;
          const repairChoice = node.choices?.find((c) => c.repair?.text);
          const repairNote = repairChoice?.repair?.text ?? 'Gunakan respons yang santun dan pas.';
          const rawInterlocutor = (graph as unknown as Record<string, unknown>).partner ?? graph.interlocutor;
          const interlocutorLabel = rawInterlocutor === 'neighbor' ? 'Tetangga' : String(rawInterlocutor);
          return {
            id: node.id,
            speaker: node.speaker === 'user' ? 'Kamu' : interlocutorLabel,
            text: node.text,
            translation: node.translation,
            choices,
            correct: Math.max(0, correctIdx),
            repair: repairNote,
            audioPath: node.audio,
          };
        });

        const rawAvatar = (graph as unknown as Record<string, unknown>).avatar;
        const rawPartner = (graph as unknown as Record<string, unknown>).partner ?? graph.interlocutor;
        const scenario: DialogScenario = {
          id: graph.id,
          title: graph.title,
          partner: rawPartner === 'neighbor' ? 'Tetangga' : String(rawPartner),
          avatar: typeof rawAvatar === 'string' ? rawAvatar : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=faces&fit=crop&h=160&w=160&q=80',
          nodes: mappedNodes,
        };

        setDialogueBank((prev) => ({ ...prev, [graph.id]: scenario }));
      }
    });
    return () => {
      ignore = true;
    };
  }, [container.dialogue, packageId, selectedDialogueId, session?.dialogId]);

  // Current session questions
  const currentQuestions = session?.mode === 'dialog'
    ? []
    : activeSessionQuestions.length > 0
      ? activeSessionQuestions
      : session?.mode === 'guess'
        ? guessBank
        : session?.mode === 'gap'
          ? gapBank
          : [];

  const currentDialogue = dialogueBank[session?.dialogId ?? selectedDialogueId]
    ?? CURATED_DIALOGUES.find((d) => d.id === (session?.dialogId ?? selectedDialogueId))
    ?? CURATED_DIALOGUES[0];
  const currentDialogNode = session?.mode === 'dialog' ? currentDialogue.nodes[index] : null;

  const totalQuestions = session?.mode === 'dialog'
    ? currentDialogue.nodes.length
    : currentQuestions.length;

  const currentQuestion = currentQuestions[index];

  // Open Setup (Pre-session) view
  const openSetup = (targetMode: ModeId, unitId?: string) => {
    stopAudio();
    setMode(targetMode);
    setSetupUnitId(unitId);
    if (targetMode === 'dialog') {
      setSelectedDialogueId(CURATED_DIALOGUES[0]?.id ?? 'dialog-sapaan');
    }
    setSetupLoading(true);
    setView('setup');
  };

  // Start Session
  const start = async (targetMode: ModeId, targetUnitId?: string, targetDialogId?: string) => {
    stopAudio();
    setPending(null);
    setIndex(0);
    setChoice(null);
    setFeedback(false);
    setTranslation(false);
    setConversationMistakes({});
    setMode(targetMode);

    if (targetMode === 'dialog') {
      const activeDialogId = targetDialogId ?? selectedDialogueId;
      router.push({
        pathname: '/dialogue/[dialogueId]',
        params: { dialogueId: activeDialogId },
      });
      return;
    }

    try {
      const exerciseType = targetMode === 'mixed' ? 'mixed' : targetMode === 'guess' ? 'guess_the_word' : 'fill_the_gap';
      const questionCountToRequest = setupQuestionCount > 0 ? setupQuestionCount : 10;
      const sessionRes = await container.practice.createSession({
        packageId,
        exerciseType,
        unitId: targetUnitId,
        questionCount: questionCountToRequest,
        direction: 'word_to_meaning',
      });

      if (sessionRes.ok && sessionRes.data) {
        const dbSession = sessionRes.data;
        const loadedQuestions: QuestionItem[] = [];
        for (let i = 0; i < dbSession.questionCount; i++) {
          const qRes = await container.practice.getQuestion(dbSession.sessionId, i);
          if (qRes.ok && qRes.data) {
            const q = qRes.data;
            const choices = q.options.map((opt) => opt.label);
            const correctIdx = q.options.findIndex((opt) => opt.optionId === q.correctOptionId);
            if (q.type === 'guess_the_word') {
              const targetWord = q.prompt.lemma ?? '';
              loadedQuestions.push({
                id: q.questionId,
                prompt: targetWord,
                promptLanguage: 'jv',
                choices,
                correct: Math.max(0, correctIdx),
                explanation: `'${targetWord}' berarti '${choices[Math.max(0, correctIdx)]}' dalam kosakata bahasa Jawa ini.`,
                example: q.exampleSentence?.text ?? `Tuladha: ${targetWord}.`,
                audioPath: q.prompt.audio?.path,
                rawQuestion: q,
              });
            } else {
              const gapPrompt = `${q.beforeGap}___${q.afterGap}`;
              loadedQuestions.push({
                id: q.questionId,
                prompt: gapPrompt,
                promptLanguage: 'jv',
                choices,
                correct: Math.max(0, correctIdx),
                explanation: `Jawaban yang tepat adalah '${choices[Math.max(0, correctIdx)]}'.`,
                translation: q.translation,
                example: q.translation,
                audioPath: q.audio?.path,
                rawQuestion: q,
              });
            }
          }
        }

        if (loadedQuestions.length > 0) {
          setActiveSessionQuestions(loadedQuestions);
          setSession({
            id: dbSession.sessionId,
            mode: targetMode,
            unitId: targetUnitId,
            answers: [],
            completed: false,
          });
          setConversationPhase('idle');
          setView('question');
          return;
        }
      }
    } catch (err) {
      console.warn('Gagal membuat sesi database, menggunakan bank lokal:', err);
    }

    const fallbackBank = targetMode === 'guess' ? guessBank : gapBank;
    setActiveSessionQuestions(fallbackBank);
    setSession({
      id: `session-${Date.now()}`,
      mode: targetMode,
      unitId: targetUnitId,
      answers: [],
      completed: false,
    });
    setConversationPhase('idle');
    setView('question');
  };

  // Resume Session
  const resume = () => {
    if (!pending) return;
    stopAudio();
    setMode(pending.mode);
    setSession(pending);
    const lastIndex = Math.min(pending.answers.length, (pending.mode === 'dialog' ? currentDialogue.nodes.length : 5) - 1);
    setIndex(lastIndex);
    setChoice(null);
    setFeedback(false);
    setTranslation(false);
    setView('question');

    if (pending.mode === 'dialog') {
      setConversationPhase('awaiting-response');
    }
  };

  // Check Answer (Guess & Gap & Mixed)
  const checkAnswer = async () => {
    if (choice === null || !session || feedback) return;
    stopAudio();
    const updatedAnswers = [...session.answers, { choice }];
    const updatedSession = { ...session, answers: updatedAnswers };
    setSession(updatedSession);
    setFeedback(true);

    const curQ = currentQuestions[index];
    if (curQ?.rawQuestion && session.id.startsWith('practice-')) {
      const selectedOption = curQ.rawQuestion.options[choice];
      if (selectedOption) {
        try {
          const res = await container.practice.submitAnswer({
            sessionId: session.id,
            questionId: curQ.rawQuestion.questionId,
            optionId: selectedOption.optionId,
          });
          if (!res.ok) {
            console.warn('submitAnswer repository error:', res.error);
          }
        } catch (err) {
          console.warn('submitAnswer error:', err);
        }
      }
    }
  };

  // Next Question (Guess & Gap & Mixed)
  const nextQuestion = async () => {
    if (!session) return;
    stopAudio();
    if (index + 1 >= totalQuestions) {
      setSession({ ...session, completed: true });
      setPending(null);
      if (session.id.startsWith('practice-')) {
        try {
          const res = await container.practice.completeSession(session.id);
          if (!res.ok) {
            console.warn('completeSession repository error:', res.error);
          }
        } catch (err) {
          console.warn('completeSession error:', err);
        }
      }
      setView('summary');
    } else {
      setIndex((curr) => curr + 1);
      setChoice(null);
      setFeedback(false);
      setTranslation(false);
    }
  };

  // Send Dialogue Response
  const sendDialogueResponse = () => {
    if (choice === null || !session || !currentDialogNode || conversationPhase !== 'awaiting-response') return;
    stopAudio();
    setConversationPhase('user-typing');

    conversationTimerRef.current = setTimeout(() => {
      setConversationPhase('user-sent');

      if (choice !== currentDialogNode.correct) {
        // Incorrect choice - show repair note then allow retry after 1400ms
        conversationTimerRef.current = setTimeout(() => {
          setConversationMistakes((curr) => ({
            ...curr,
            [currentDialogNode.id]: [...(curr[currentDialogNode.id] ?? []), choice],
          }));
          setChoice(null);
          setConversationPhase('awaiting-response');
        }, 1400);
        return;
      }

      // Correct choice
      const updatedAnswers = [...session.answers, { choice }];
      const updatedSession = { ...session, answers: updatedAnswers };
      setSession(updatedSession);

      conversationTimerRef.current = setTimeout(() => {
        if (index + 1 >= totalQuestions) {
          setSession({ ...updatedSession, completed: true });
          setPending(null);
          setView('summary');
        } else {
          setIndex((curr) => curr + 1);
          setChoice(null);
          setTranslation(false);
          setConversationPhase('partner-typing');
          conversationTimerRef.current = setTimeout(() => {
            setConversationPhase('awaiting-response');
          }, 900);
        }
      }, 800);
    }, 650);
  };

  // Leave / Exit Session
  const leave = () => {
    stopAudio();
    setConfirmModal(null);
    if (session && !session.completed) {
      setPending(session);
    }
    setView('home');
  };

  // Compute counts for summary
  const correctCount = session?.answers.reduce((acc, ans, i) => {
    if (session.mode === 'dialog') {
      return acc + (ans.choice === currentDialogue.nodes[i]?.correct ? 1 : 0);
    }
    return acc + (ans.choice === currentQuestions[i]?.correct ? 1 : 0);
  }, 0) ?? 0;
  const incorrectCount = Math.max(0, (session?.answers.length ?? 0) - correctCount);

  // Render Loading
  if (view === 'loading') {
    return <PracticeLoading message="Menyiapkan latihan…" />;
  }

  // ----------------------------------------------------
  // 1. HOME VIEW
  // ----------------------------------------------------
  if (view === 'home') {
    const pendingModeTitle = MODES.find((m) => m.id === pending?.mode)?.title ?? 'Latihan';
    const pendingPercent = pending
      ? Math.round((pending.answers.length / (pending.mode === 'dialog' ? currentDialogue.nodes.length : 5)) * 100)
      : 0;

    return (
      <View style={[styles.screen, { paddingTop: Math.max(insets.top, spacing.lg) }]}>
        <ScrollView
          contentContainerStyle={[styles.homeContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.practiceHeader}>
            <Text accessibilityRole="header" style={styles.practiceHeaderTitle}>
              Latihan
            </Text>
          </View>

          {/* Active Pending Session Card */}
          {pending ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lanjutkan sesi terakhir"
              onPress={resume}
              style={styles.practiceRecovery}
            >
              <View style={styles.recoveryCopy}>
                <Text style={styles.recoveryTitle}>Lanjutkan sesi terakhir</Text>
                <Text style={styles.recoveryDescription}>
                  {pendingModeTitle} · {pendingPercent}% selesai
                </Text>
              </View>
              <RemixIcon name="history-line" size={24} color={colors.navy} />
            </Pressable>
          ) : null}

          {error ? <PracticeError message={error} onRetry={() => setError(null)} /> : null}

          {/* Units List */}
          {units.length > 0 ? (
            <View style={styles.unitsSection}>
              <Text style={styles.practiceModeLabel}>UNIT BELAJAR</Text>
              {units.map((unit) => (
                <View key={unit.id} style={styles.unitCard}>
                  <View style={styles.unitCardHeader}>
                    <View style={styles.unitOrderBadge}>
                      <Text style={styles.unitOrderText}>UNIT {unit.order}</Text>
                    </View>
                    <Text style={styles.unitTitle}>{unit.title}</Text>
                    <Text style={styles.unitSubtitle}>
                      {unit.wordCount} Kosakata • {unit.sentenceCount} Kalimat • {unit.dialogueCount} Dialog
                    </Text>
                  </View>
                  <View style={styles.unitActionsRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Tebak kata ${unit.title}`}
                      onPress={() => openSetup('guess', unit.id)}
                      style={({ pressed }) => [styles.unitActionBtn, pressed && styles.unitActionBtnPressed]}
                    >
                      <RemixIcon name="translate-2" size={16} color={colors.primary} />
                      <Text style={styles.unitActionText}>Tebak Kata</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Kalimat rumpang ${unit.title}`}
                      onPress={() => openSetup('gap', unit.id)}
                      style={({ pressed }) => [styles.unitActionBtn, pressed && styles.unitActionBtnPressed]}
                    >
                      <RemixIcon name="puzzle-line" size={16} color={colors.primary} />
                      <Text style={styles.unitActionText}>Rumpang</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Percakapan ${unit.title}`}
                      onPress={() => openSetup('dialog', unit.id)}
                      style={({ pressed }) => [styles.unitActionBtn, pressed && styles.unitActionBtnPressed]}
                    >
                      <RemixIcon name="chat-3-line" size={16} color={colors.primary} />
                      <Text style={styles.unitActionText}>Dialog</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Mode Cards Group: Latihan Bebas */}
          <View style={styles.practiceCards}>
            <Text style={styles.practiceModeLabel}>LATIHAN BEBAS</Text>

            {MODES.filter((m) => m.id !== 'mixed').map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => openSetup(item.id)}
                style={({ pressed }) => [
                  styles.practiceModeCard,
                  pressed && styles.practiceModeCardPressed,
                ]}
              >
                <View style={styles.practiceCardCopy}>
                  <Text style={styles.practiceCardTitle}>{item.title}</Text>
                  <Text style={styles.practiceCardDescription}>{item.description}</Text>
                </View>
                <View style={styles.practiceCardIcon}>
                  <RemixIcon name={item.icon} size={24} color={colors.primary} />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Ulangan Campur (Card paling bawah) */}
          <View style={styles.practiceCards}>
            <Text style={styles.practiceModeLabel}>ULANGAN CAMPUR</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mulai Ulangan Campur"
              onPress={() => openSetup('mixed')}
              style={({ pressed }) => [
                styles.practiceModeCard,
                pressed && styles.practiceModeCardPressed,
              ]}
            >
              <View style={styles.practiceCardCopy}>
                <Text style={styles.practiceCardDescription}>
                  Latih pemahaman kosakata dan kalimat rumpang dari semua unit yang telah dibuka.
                </Text>
              </View>
              <View style={styles.practiceCardIcon}>
                <RemixIcon name="shuffle-line" size={24} color={colors.primary} />
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // 2. SETUP VIEW (Bottom Nav is hidden)
  // ----------------------------------------------------
  if (view === 'setup') {
    if (setupLoading) {
      return <PracticeSetupSkeleton mode={mode === 'mixed' ? 'guess' : mode} />;
    }

    const currentMode = MODES.find((m) => m.id === mode) ?? MODES[0]!;

    return (
      <View style={[styles.screen, styles.guessSetupScreen]}>
        {/* Topbar */}
        <View style={[styles.guessSetupTopbar, { paddingTop: insets.top, minHeight: 52 + insets.top }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali ke Latihan"
            onPress={() => setView('home')}
            style={styles.iconButton}
          >
            <RemixIcon name="arrow-left-line" size={24} color={colors.navy} />
          </Pressable>
          <Text style={styles.guessSetupTopbarTitle}>{currentMode.title}</Text>
          <View style={styles.topbarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.guessSetupBody,
            styles.guessSetupBodyCentered,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Context Pills */}
          <View style={styles.guessSetupContext}>
            {setupUnitId ? (
              <View style={styles.packagePill}>
                <Text style={styles.packagePillText}>
                  {units.find((u) => u.id === setupUnitId)
                    ? `Unit ${units.find((u) => u.id === setupUnitId)!.order}: ${units.find((u) => u.id === setupUnitId)!.title}`
                    : 'Unit Belajar'}
                </Text>
              </View>
            ) : null}
            <View style={styles.packagePill}>
              <Text style={styles.packagePillText}>Bahasa: Jawa</Text>
            </View>
            <View style={styles.packagePill}>
              <Text style={styles.packagePillText}>Dialek: Mataraman</Text>
            </View>
          </View>

          {/* Main Stage */}
          <View style={[styles.guessSetupMain, styles.guessSetupMainCentered]}>
            <View style={styles.illustrationBox}>
              {mode === 'dialog' ? (
                <ConversationSetupIllustration width={192} height={132} />
              ) : mode === 'guess' ? (
                <GuessSetupIllustration width={280} height={210} />
              ) : (
                <GapSetupIllustration width={280} height={210} />
              )}
            </View>

            <Text style={styles.guessSetupInstruction}>{currentMode.instruction}</Text>

            {mode === 'dialog' ? (
              <ConversationTopics
                packageId={packageId}
                selectedId={selectedDialogueId}
                onSelect={setSelectedDialogueId}
              />
            ) : (
              /* Inline details: NO CARD WRAPPER - Vertically centered with illustration */
              <View style={styles.guessSetupDetails}>
                <View style={styles.guessDetailSpan}>
                  <RemixIcon name="file-list-3-line" size={18} color={colors.navy} />
                  <Text style={styles.guessDetailSpanText}>
                    {setupQuestionCount} soal
                  </Text>
                </View>
                <View style={styles.guessDetailSpan}>
                  <RemixIcon name="time-line" size={18} color={colors.navy} />
                  <Text style={styles.guessDetailSpanText}>Tanpa batas waktu</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Setup Footer */}
        <View style={[styles.guessSetupFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mulai latihan"
            onPress={() => {
              if (pending) {
                setConfirmModal('replace');
              } else {
                start(mode, setupUnitId);
              }
            }}
            style={styles.practiceFullButton}
          >
            <Text style={styles.practiceFullButtonText}>Mulai latihan</Text>
          </Pressable>
        </View>

        <PracticeConfirmModal
          visible={confirmModal === 'replace'}
          type="replace"
          onConfirm={() => {
            setConfirmModal(null);
            start(mode, setupUnitId);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      </View>
    );
  }

  // ----------------------------------------------------
  // 3. QUESTION VIEW (Bottom Nav is hidden)
  // ----------------------------------------------------
  if (view === 'question' && session) {
    if (session.mode === 'dialog' && currentDialogNode) {
      // -----------------------------------------
      // DIALOGUE SESSION
      // -----------------------------------------
      return (
        <View style={[styles.screen, styles.conversationScreen]}>
          {/* Dialogue Topbar */}
          <View style={[styles.conversationTopbar, { paddingTop: insets.top, minHeight: 60 + insets.top }]}>
            <View style={styles.conversationContact}>
              <Image source={{ uri: currentDialogue.avatar }} style={styles.conversationAvatar} />
              <View style={styles.conversationContactCopy}>
                <Text style={styles.contactSpeakerName}>{currentDialogNode.speaker}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar dari sesi"
              onPress={() => setConfirmModal('exit')}
              style={styles.iconButton}
            >
              <RemixIcon name="close-line" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Chat Transcript Thread */}
          <ScrollView
            ref={conversationScrollRef}
            contentContainerStyle={[styles.conversationBody, { paddingBottom: insets.bottom + 180 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* History Nodes */}
            {currentDialogue.nodes.slice(0, index).map((node, nodeIdx) => (
              <View key={node.id} style={styles.conversationMessagePair}>
                {/* Incoming Partner Bubble */}
                <View style={styles.incomingMessageRow}>
                  <Image source={{ uri: currentDialogue.avatar }} style={styles.bubbleAvatar} />
                  <View style={styles.incomingBubble}>
                    <Text style={styles.incomingBubbleText}>{node.text}</Text>
                  </View>
                </View>

                {/* Past Mistake Bubbles if any */}
                {(conversationMistakes[node.id] ?? []).map((mistakeChoice, mistakeIdx) => (
                  <View key={`mistake-${nodeIdx}-${mistakeIdx}`} style={styles.outgoingMessageRow}>
                    <View style={styles.outgoingBubbleContainer}>
                      <View style={styles.mistakeBubble}>
                        <Text style={styles.outgoingBubbleText}>{node.choices[mistakeChoice]}</Text>
                        <RemixIcon name="check-double-line" size={16} color="rgba(255, 255, 255, 0.78)" />
                      </View>
                      <Text style={styles.repairNote}>{node.repair}</Text>
                    </View>
                  </View>
                ))}

                {/* Outgoing Correct Reply */}
                {session.answers[nodeIdx] ? (
                  <View style={styles.outgoingMessageRow}>
                    <View style={styles.outgoingBubble}>
                      <Text style={styles.outgoingBubbleText}>
                        {node.choices[session.answers[nodeIdx].choice]}
                      </Text>
                      <RemixIcon name="check-double-line" size={16} color="rgba(255, 255, 255, 0.78)" />
                    </View>
                  </View>
                ) : null}
              </View>
            ))}

            {/* Current Turn Incoming Message */}
            <View style={styles.incomingMessageRow}>
              <Image source={{ uri: currentDialogue.avatar }} style={styles.bubbleAvatar} />
              <View style={styles.incomingBubbleContent}>
                <View style={styles.incomingBubble}>
                  {conversationPhase === 'partner-typing' ? (
                    <View style={styles.typingContainer}>
                      <View style={[styles.typingDot, styles.typingDot1]} />
                      <View style={[styles.typingDot, styles.typingDot2]} />
                      <View style={[styles.typingDot, styles.typingDot3]} />
                    </View>
                  ) : (
                    <Text style={styles.incomingBubbleText}>{currentDialogNode.text}</Text>
                  )}
                </View>

                {conversationPhase !== 'partner-typing' ? (
                  <>
                    <View style={styles.messageToolsRow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Dengarkan audio percakapan"
                        onPress={() => void playAudio(currentDialogNode.text, currentDialogNode.audioPath)}
                        style={styles.conversationAudioButton}
                      >
                        <RemixIcon name="volume-up-line" size={20} color={colors.teal} />
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={translation ? 'Sembunyikan terjemahan' : 'Lihat terjemahan'}
                        onPress={() => setTranslation((v) => !v)}
                        style={styles.translationToggle}
                      >
                        <RemixIcon name="translate-2" size={16} color={colors.navy} />
                        <Text style={styles.translationToggleText}>
                          {translation ? 'Sembunyikan terjemahan' : 'Lihat terjemahan'}
                        </Text>
                      </Pressable>
                    </View>

                    {translation ? (
                      <View style={styles.conversationTranslationBox}>
                        <Text style={styles.conversationTranslationText}>
                          {currentDialogNode.translation}
                        </Text>
                      </View>
                    ) : null}
                  </>
                ) : null}
              </View>
            </View>

            {/* Current Node Mistakes */}
            {(conversationMistakes[currentDialogNode.id] ?? []).map((mistakeChoice, mistakeIdx) => (
              <View key={`current-mistake-${mistakeIdx}`} style={styles.outgoingMessageRow}>
                <View style={styles.outgoingBubbleContainer}>
                  <View style={styles.mistakeBubble}>
                    <Text style={styles.outgoingBubbleText}>
                      {currentDialogNode.choices[mistakeChoice]}
                    </Text>
                    <RemixIcon name="check-double-line" size={16} color="rgba(255, 255, 255, 0.78)" />
                  </View>
                  <Text style={styles.repairNote}>{currentDialogNode.repair}</Text>
                </View>
              </View>
            ))}

            {/* Current Outgoing Message (while sending) */}
            {(conversationPhase === 'user-typing' || conversationPhase === 'user-sent') && choice !== null ? (
              <View style={styles.outgoingMessageRow}>
                <View style={styles.outgoingBubbleContainer}>
                  <View style={styles.outgoingBubble}>
                    {conversationPhase === 'user-typing' ? (
                      <View style={styles.typingContainer}>
                        <View style={[styles.typingDot, styles.typingDot1, styles.typingDotLight]} />
                        <View style={[styles.typingDot, styles.typingDot2, styles.typingDotLight]} />
                        <View style={[styles.typingDot, styles.typingDot3, styles.typingDotLight]} />
                      </View>
                    ) : (
                      <>
                        <Text style={styles.outgoingBubbleText}>
                          {currentDialogNode.choices[choice]}
                        </Text>
                        <RemixIcon name="check-double-line" size={16} color="rgba(255, 255, 255, 0.78)" />
                      </>
                    )}
                  </View>
                  {conversationPhase === 'user-sent' && choice !== currentDialogNode.correct ? (
                    <Text style={styles.repairNote}>{currentDialogNode.repair}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Dialogue Composer */}
          {conversationPhase === 'awaiting-response' ? (
            <View style={[styles.conversationComposer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
              <Text style={styles.conversationResponseHeading}>Pilih balasanmu</Text>
              <View style={styles.composerAnswersList}>
                {currentDialogNode.choices.map((ans, i) => (
                  <Pressable
                    key={ans}
                    accessibilityRole="button"
                    accessibilityLabel={ans}
                    onPress={() => setChoice(i)}
                    style={[
                      styles.conversationReply,
                      choice === i && styles.conversationReplySelected,
                    ]}
                  >
                    <View style={[styles.replyLetter, choice === i && styles.replyLetterSelected]}>
                      <Text style={[styles.replyLetterText, choice === i && styles.replyLetterTextSelected]}>
                        {String.fromCharCode(65 + i)}
                      </Text>
                    </View>
                    <Text style={styles.replyText}>{ans}</Text>
                    {choice === i ? <RemixIcon name="check-line" size={18} color={colors.teal} /> : null}
                  </Pressable>
                ))}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kirim jawaban"
                disabled={choice === null}
                onPress={sendDialogueResponse}
                style={[styles.practiceFullButton, choice === null && styles.practiceFullButtonDisabled]}
              >
                <Text style={styles.practiceFullButtonText}>Kirim jawaban</Text>
                <RemixIcon name="send-plane-2-line" size={20} color={colors.surface} />
              </Pressable>
            </View>
          ) : null}

          <PracticeConfirmModal
            visible={confirmModal === 'exit'}
            type="exit"
            onConfirm={leave}
            onCancel={() => setConfirmModal(null)}
          />
        </View>
      );
    }

    // -----------------------------------------
    // GUESS THE WORD & FILL THE GAP SESSION
    // -----------------------------------------
    if (currentQuestion) {
      const isQuestionGuess = currentQuestion.rawQuestion
        ? currentQuestion.rawQuestion.type === 'guess_the_word'
        : (!currentQuestion.prompt.includes('___'));
      const isQuestionGap = !isQuestionGuess;
      const gapParts = isQuestionGap ? currentQuestion.prompt.split('___') : [];

      return (
        <View style={[styles.screen, styles.structuredQuestionScreen]}>
          {/* Topbar */}
          <View style={[styles.practiceTopbar, { paddingTop: insets.top, minHeight: 52 + insets.top }]}>
            <Text style={styles.practiceTopbarTitle}>
              {session.mode === 'mixed'
                ? `Ulangan • ${isQuestionGuess ? 'Tebak kata' : 'Kalimat rumpang'}`
                : (isQuestionGuess ? 'Tebak kata' : 'Kalimat rumpang')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar dari sesi"
              onPress={() => setConfirmModal('exit')}
              style={styles.iconButton}
            >
              <RemixIcon name="close-line" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Segmented Progress Bar */}
          <View style={styles.practiceQuestionProgress}>
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <View
                key={`prog-${i}`}
                style={[styles.progressStep, i <= index ? styles.progressStepFilled : styles.progressStepEmpty]}
              />
            ))}
          </View>

          <ScrollView
            contentContainerStyle={[styles.structuredBody, { paddingBottom: insets.bottom + 90 }]}
            showsVerticalScrollIndicator={false}
          >
            {isQuestionGuess ? (
              /* Guess Word Stage: Teal background */
              <View style={styles.guessWordStage}>
                <View style={styles.guessWordPrompt}>
                  <Text style={styles.guessWordPromptText}>{currentQuestion.prompt}</Text>
                </View>
                <View style={styles.guessWordAudioRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Putar audio kata"
                    onPress={() => void playAudio(currentQuestion.prompt, currentQuestion.audioPath)}
                    style={styles.guessQuestionAudio}
                  >
                    <RemixIcon name="volume-up-line" size={22} color={colors.teal} />
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Gap Question Stage: Navy background */
              <View style={styles.gapQuestionStage}>
                <View style={styles.gapQuestionPrompt}>
                  <Text style={styles.gapQuestionPromptText}>
                    {gapParts[0]}
                    <View style={styles.gapQuestionBlank} />
                    {gapParts[1]}
                  </Text>
                  {currentQuestion.translation ? (
                    <Text style={styles.gapTranslationText}>{currentQuestion.translation}</Text>
                  ) : currentQuestion.example ? (
                    <Text style={styles.gapTranslationText}>{currentQuestion.example}</Text>
                  ) : null}
                </View>
                <View style={styles.gapQuestionAudioRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Putar audio kalimat"
                    onPress={() => void playAudio(currentQuestion.prompt, currentQuestion.audioPath)}
                    style={styles.guessQuestionAudio}
                  >
                    <RemixIcon name="volume-up-line" size={22} color={colors.teal} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Answer Options */}
            <View style={styles.practiceAnswersList}>
              {currentQuestion.choices.map((ans, i) => (
                <Pressable
                  key={ans}
                  accessibilityRole="radio"
                  accessibilityLabel={ans}
                  disabled={feedback}
                  onPress={() => setChoice(i)}
                  style={[
                    styles.practiceAnswer,
                    choice === i && styles.practiceAnswerSelected,
                  ]}
                >
                  <View style={[styles.answerLetter, choice === i && styles.answerLetterSelected]}>
                    <Text style={[styles.answerLetterText, choice === i && styles.answerLetterTextSelected]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={styles.answerLabel}>{ans}</Text>
                  {choice === i ? <RemixIcon name="check-line" size={18} color={colors.navy} /> : null}
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Sticky Footer */}
          <View style={[styles.practiceQuestionFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Periksa jawaban"
              disabled={choice === null}
              onPress={checkAnswer}
              style={[styles.practiceFullButton, choice === null && styles.practiceFullButtonDisabled]}
            >
              <Text style={styles.practiceFullButtonText}>Periksa jawaban</Text>
            </Pressable>
          </View>

          {/* Feedback Sheet */}
          <PracticeFeedbackSheet
            visible={feedback}
            correct={choice === currentQuestion.correct}
            correctAnswer={choice === currentQuestion.correct ? undefined : currentQuestion.choices[currentQuestion.correct]}
            explanation={currentQuestion.explanation}
            example={currentQuestion.example}
            isLastQuestion={index + 1 >= totalQuestions}
            onNext={nextQuestion}
          />

          <PracticeConfirmModal
            visible={confirmModal === 'exit'}
            type="exit"
            onConfirm={leave}
            onCancel={() => setConfirmModal(null)}
          />
        </View>
      );
    }
  }

  // ----------------------------------------------------
  // 4. SUMMARY VIEW (Bottom Nav is hidden)
  // ----------------------------------------------------
  if (view === 'summary') {
    const summaryTitle = session?.mode === 'guess'
      ? 'Tebak kata selesai'
      : session?.mode === 'gap'
        ? 'Kalimat rumpang selesai'
        : 'Percakapan selesai';

    return (
      <View style={[styles.screen, { paddingTop: Math.max(insets.top, spacing.xs) }]}>
        <ScrollView
          contentContainerStyle={[styles.summaryContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryMain}>
            <View style={styles.summaryIllustrationWrap}>
              <PracticeSummaryIllustration width={260} height={180} />
            </View>

            <Text accessibilityRole="header" style={styles.summaryTitle}>
              {summaryTitle}
            </Text>
            <Text style={styles.summarySubtitle}>
              Kamu telah menyelesaikan seluruh soal latihan.
            </Text>

            {/* Result Cards */}
            <View style={styles.practiceSummaryResults}>
              <View style={[styles.practiceResultCard, styles.resultCardCorrect]}>
                <RemixIcon name="checkbox-circle-line" size={24} color={colors.teal} />
                <Text style={styles.resultCardNumber}>{correctCount}</Text>
                <Text style={styles.resultCardLabel}>Soal terjawab benar</Text>
              </View>

              <View style={[styles.practiceResultCard, styles.resultCardIncorrect]}>
                <RemixIcon name="close-circle-line" size={24} color={colors.magenta} />
                <Text style={styles.resultCardNumber}>{incorrectCount}</Text>
                <Text style={styles.resultCardLabel}>Soal terjawab salah</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Footer Action */}
        <View style={[styles.summaryFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali ke Latihan"
            onPress={() => {
              setView('home');
              setSession(null);
            }}
            style={styles.practiceFullButton}
          >
            <Text style={styles.practiceFullButtonText}>Kembali ke Latihan</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  homeContent: {
    paddingHorizontal: 20,
    gap: spacing.lg,
  },
  practiceHeader: {
    paddingTop: spacing.xs,
  },
  practiceHeaderTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.navy,
    letterSpacing: -0.04,
  },
  practiceRecovery: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.navy,
    padding: spacing.md,
    gap: spacing.sm,
  },
  recoveryCopy: {
    flex: 1,
    gap: 2,
  },
  recoveryTitle: {
    fontFamily: fonts.uiMedium,
    fontSize: 15,
    color: colors.navy,
  },
  recoveryDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  practiceCards: {
    gap: spacing.md,
  },
  practiceModeLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 18,
    letterSpacing: 0.08,
    color: colors.textSecondary,
  },
  practiceModeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 110,
    gap: spacing.md,
  },
  practiceModeCardPressed: {
    borderColor: colors.navy,
  },
  practiceCardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  practiceCardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 20,
    lineHeight: 24,
    color: colors.navy,
    letterSpacing: -0.02,
  },
  practiceCardDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  practiceCardIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.control,
    backgroundColor: 'rgba(173, 54, 3, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Setup styles
  guessSetupScreen: {
    flex: 1,
  },
  guessSetupTopbar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  guessSetupTopbarTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.navy,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarSpacer: {
    width: 44,
  },
  guessSetupBody: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
  },
  guessSetupBodyCentered: {
    flexGrow: 1,
  },
  guessSetupContext: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  packagePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 46, 68, 0.08)',
  },
  packagePillText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.navy,
  },
  guessSetupMain: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  guessSetupMainCentered: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 0,
    marginTop: -spacing.md,
  },
  illustrationBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  guessSetupInstruction: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 24,
    color: colors.navy,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: spacing.md,
  },
  guessSetupDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  guessDetailSpan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  guessDetailSpanText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  guessSetupFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  practiceFullButton: {
    width: '100%',
    minHeight: touchTarget,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  practiceFullButtonDisabled: {
    backgroundColor: colors.border,
  },
  practiceFullButtonText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 16,
    color: colors.surface,
  },
  // Dialogue Screen styles
  conversationScreen: {
    backgroundColor: 'rgba(22, 104, 104, 0.03)',
  },
  conversationTopbar: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  conversationContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  conversationAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
  },
  conversationContactCopy: {
    justifyContent: 'center',
  },
  contactSpeakerName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.navy,
  },
  conversationBody: {
    paddingHorizontal: 16,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  conversationMessagePair: {
    gap: spacing.md,
  },
  incomingMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    maxWidth: '85%',
  },
  bubbleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginTop: 4,
    backgroundColor: colors.border,
  },
  incomingBubbleContent: {
    flex: 1,
  },
  incomingBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: '#0A2E44',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  incomingBubbleText: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  outgoingMessageRow: {
    alignItems: 'flex-end',
    width: '100%',
  },
  outgoingBubbleContainer: {
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  outgoingBubble: {
    backgroundColor: colors.teal,
    borderRadius: 20,
    borderBottomRightRadius: 5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mistakeBubble: {
    backgroundColor: colors.magenta,
    borderRadius: 20,
    borderBottomRightRadius: 5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  outgoingBubbleText: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.surface,
  },
  repairNote: {
    marginTop: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.control,
    backgroundColor: 'rgba(150, 2, 56, 0.08)',
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.magenta,
  },
  messageToolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  conversationAudioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(22, 104, 104, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  translationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
  },
  translationToggleText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.navy,
  },
  conversationTranslationBox: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radii.control,
    backgroundColor: 'rgba(173, 54, 3, 0.06)',
  },
  conversationTranslationText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  typingDot1: { transform: [{ translateY: -2 }] },
  typingDot2: { transform: [{ translateY: 0 }] },
  typingDot3: { transform: [{ translateY: 2 }] },
  typingDotLight: { backgroundColor: colors.surface },
  // Dialogue Composer
  conversationComposer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    shadowColor: '#0A2E44',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  conversationResponseHeading: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  composerAnswersList: {
    gap: spacing.sm,
  },
  conversationReply: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  conversationReplySelected: {
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: 'rgba(10, 46, 68, 0.07)',
  },
  replyLetter: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyLetterSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  replyLetterText: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  replyLetterTextSelected: {
    color: colors.surface,
  },
  replyText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
  },
  // Structured Question (Guess & Gap) styles
  structuredQuestionScreen: {
    flex: 1,
  },
  practiceTopbar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  practiceTopbarTitle: {
    fontFamily: fonts.uiMedium,
    fontSize: 16,
    color: colors.navy,
  },
  practiceQuestionProgress: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    gap: 4,
    backgroundColor: colors.surface,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  progressStepFilled: {
    backgroundColor: colors.teal,
  },
  progressStepEmpty: {
    backgroundColor: colors.border,
  },
  structuredBody: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    justifyContent: 'space-between',
  },
  guessWordStage: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.sm,
  },
  guessWordPrompt: {
    minHeight: 140,
    backgroundColor: colors.teal,
    borderRadius: radii.sheet,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  guessWordPromptText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 34,
    lineHeight: 40,
    color: colors.surface,
    textAlign: 'center',
  },
  guessWordAudioRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  guessQuestionAudio: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tealTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gapQuestionStage: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.sm,
  },
  gapQuestionPrompt: {
    minHeight: 140,
    backgroundColor: colors.navy,
    borderRadius: radii.sheet,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  gapQuestionPromptText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 24,
    lineHeight: 34,
    color: colors.surface,
    textAlign: 'center',
  },
  gapQuestionBlank: {
    width: 60,
    height: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 6,
    alignSelf: 'flex-end',
  },
  gapTranslationText: {
    marginTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
  },
  gapQuestionAudioRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  practiceAnswersList: {
    gap: spacing.sm,
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  practiceAnswer: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  practiceAnswerSelected: {
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: 'rgba(10, 46, 68, 0.08)',
  },
  answerLetter: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLetterSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  answerLetterText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  answerLetterTextSelected: {
    color: colors.surface,
  },
  answerLabel: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  practiceQuestionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  // Summary Styles
  summaryContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryMain: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  summaryIllustrationWrap: {
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(10, 46, 68, 0.08)',
    marginBottom: spacing.sm,
  },
  summaryPillText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.navy,
  },
  summaryTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  summarySubtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  practiceSummaryResults: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.xxl,
  },
  practiceResultCard: {
    flex: 1,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  resultCardCorrect: {
    borderColor: 'rgba(22, 104, 104, 0.35)',
    backgroundColor: 'rgba(22, 104, 104, 0.06)',
  },
  resultCardIncorrect: {
    borderColor: 'rgba(150, 2, 56, 0.3)',
    backgroundColor: 'rgba(150, 2, 56, 0.05)',
  },
  resultCardNumber: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 28,
    color: colors.navy,
  },
  resultCardLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  summaryFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  // Mixed Hero Card styles
  mixedSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  mixedHeroCard: {
    backgroundColor: 'rgba(173, 54, 3, 0.06)',
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(173, 54, 3, 0.25)',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  mixedHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(173, 54, 3, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  mixedHeroBadgeText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  mixedHeroTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.navy,
  },
  mixedHeroDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  mixedHeroBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    minHeight: 40,
  },
  mixedHeroBtnPressed: {
    opacity: 0.85,
  },
  mixedHeroBtnText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 14,
    color: colors.surface,
  },
  // Unit Card styles
  unitsSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  unitCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  unitCardHeader: {
    gap: 4,
  },
  unitOrderBadge: {
    alignSelf: 'flex-start',
  },
  unitOrderText: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  unitTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.navy,
  },
  unitSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  unitActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unitActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radii.control,
    backgroundColor: 'rgba(10, 46, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(10, 46, 68, 0.1)',
    minHeight: 40,
  },
  unitActionBtnPressed: {
    backgroundColor: 'rgba(10, 46, 68, 0.12)',
  },
  unitActionText: {
    fontFamily: fonts.uiMedium,
    fontSize: 13,
    color: colors.navy,
  },
});

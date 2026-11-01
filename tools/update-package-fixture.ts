import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import canonicalize from 'canonicalize';
import { validateContent } from './content-builder/src/validateContent';

async function main() {
  const sourceDir = path.resolve('content/packages/jawa-mataraman/source');

  // 1. Data Kosakata (Kata) yang Kaya & Komprehensif
  const words = [
    { id: 'kata-sugeng', text: 'sugeng', meaning: 'selamat', part_of_speech: 'interjection', register: 'neutral', theme: 'greeting', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-enjing', text: 'enjing', meaning: 'pagi', part_of_speech: 'noun', register: 'neutral', theme: 'time', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-awan', text: 'awan', meaning: 'siang', part_of_speech: 'noun', register: 'neutral', theme: 'time', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-sonten', text: 'sonten', meaning: 'sore', part_of_speech: 'noun', register: 'neutral', theme: 'time', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-dalu', text: 'dalu', meaning: 'malam', part_of_speech: 'noun', register: 'neutral', theme: 'time', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-mangan', text: 'mangan', meaning: 'makan', part_of_speech: 'verb', register: 'familiar', theme: 'daily', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-nedha', text: 'nedha', meaning: 'makan', part_of_speech: 'verb', register: 'neutral', theme: 'daily', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-dhahar', text: 'dhahar', meaning: 'makan', part_of_speech: 'verb', register: 'formal', theme: 'daily', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-turu', text: 'turu', meaning: 'tidur', part_of_speech: 'verb', register: 'familiar', theme: 'daily', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-tilem', text: 'tilem', meaning: 'tidur', part_of_speech: 'verb', register: 'neutral', theme: 'daily', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-sare', text: 'sare', meaning: 'tidur', part_of_speech: 'verb', register: 'formal', theme: 'daily', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-sega', text: 'sega', meaning: 'nasi', part_of_speech: 'noun', register: 'familiar', theme: 'food', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-sekul', text: 'sekul', meaning: 'nasi', part_of_speech: 'noun', register: 'neutral', theme: 'food', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-banyu', text: 'banyu', meaning: 'air', part_of_speech: 'noun', register: 'familiar', theme: 'drink', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-toya', text: 'toya', meaning: 'air', part_of_speech: 'noun', register: 'neutral', theme: 'drink', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-pasar', text: 'pasar', meaning: 'pasar', part_of_speech: 'noun', register: 'familiar', theme: 'places', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-peken', text: 'peken', meaning: 'pasar', part_of_speech: 'noun', register: 'neutral', theme: 'places', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-kamar', text: 'kamar', meaning: 'kamar', part_of_speech: 'noun', register: 'neutral', theme: 'home', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-omah', text: 'omah', meaning: 'rumah', part_of_speech: 'noun', register: 'familiar', theme: 'home', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-griya', text: 'griya', meaning: 'rumah', part_of_speech: 'noun', register: 'neutral', theme: 'home', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-maca', text: 'maca', meaning: 'membaca', part_of_speech: 'verb', register: 'familiar', theme: 'study', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-maos', text: 'maos', meaning: 'membaca', part_of_speech: 'verb', register: 'neutral', theme: 'study', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-sinau', text: 'sinau', meaning: 'belajar', part_of_speech: 'verb', register: 'familiar', theme: 'study', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-mlaku', text: 'mlaku', meaning: 'berjalan', part_of_speech: 'verb', register: 'familiar', theme: 'movement', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-mlampah', text: 'mlampah', meaning: 'berjalan', part_of_speech: 'verb', register: 'neutral', theme: 'movement', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-lunga', text: 'lunga', meaning: 'pergi', part_of_speech: 'verb', register: 'familiar', theme: 'movement', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-tindak', text: 'tindak', meaning: 'pergi', part_of_speech: 'verb', register: 'formal', theme: 'movement', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-bapak', text: 'bapak', meaning: 'ayah', part_of_speech: 'noun', register: 'neutral', theme: 'family', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-ibu', text: 'ibu', meaning: 'ibu', part_of_speech: 'noun', register: 'neutral', theme: 'family', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
    { id: 'kata-adhik', text: 'adhik', meaning: 'adik', part_of_speech: 'noun', register: 'neutral', theme: 'family', unit_id: 'unit-1', audio: 'audio/kata-sugeng.opus', status: 'poc' },
  ];

  // 2. Data Kalimat Rumpang (Kalimat) yang Alami & Terjemahan Jelas
  const sentences = [
    { id: 'kalimat-01', text: 'sugeng ___', translation: 'Selamat pagi.', word_ids: ['kata-sugeng', 'kata-enjing'], gap: 'kata-enjing', register: 'neutral', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
    { id: 'kalimat-02', text: 'kula badhe ___ sekul', translation: 'Saya hendak makan nasi.', word_ids: ['kata-nedha', 'kata-sekul'], gap: 'kata-nedha', register: 'neutral', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
    { id: 'kalimat-03', text: 'bapak nembe ___ wonten kamar', translation: 'Bapak sedang tidur di kamar.', word_ids: ['kata-bapak', 'kata-sare', 'kata-kamar'], gap: 'kata-sare', register: 'formal', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
    { id: 'kalimat-04', text: 'ibu tindak dhateng ___', translation: 'Ibu pergi ke pasar.', word_ids: ['kata-ibu', 'kata-tindak', 'kata-peken'], gap: 'kata-peken', register: 'formal', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
    { id: 'kalimat-05', text: 'adhik nembe sinau ___', translation: 'Adik sedang belajar membaca.', word_ids: ['kata-adhik', 'kata-sinau', 'kata-maca'], gap: 'kata-maca', register: 'familiar', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
    { id: 'kalimat-06', text: 'sugeng ___ sedaya', translation: 'Selamat siang semuanya.', word_ids: ['kata-sugeng', 'kata-awan'], gap: 'kata-awan', register: 'neutral', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
    { id: 'kalimat-07', text: 'sugeng ___ bapak ibu', translation: 'Selamat sore bapak ibu.', word_ids: ['kata-sugeng', 'kata-sonten', 'kata-bapak', 'kata-ibu'], gap: 'kata-sonten', register: 'neutral', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
    { id: 'kalimat-08', text: 'sugeng ___ sedherek', translation: 'Selamat malam saudara.', word_ids: ['kata-sugeng', 'kata-dalu'], gap: 'kata-dalu', register: 'neutral', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
    { id: 'kalimat-09', text: 'ayo ___ bareng ing omah', translation: 'Ayo makan bersama di rumah.', word_ids: ['kata-mangan', 'kata-omah'], gap: 'kata-mangan', register: 'familiar', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
    { id: 'kalimat-10', text: 'adhiku wis ___ awan', translation: 'Adikku sudah tidur siang.', word_ids: ['kata-turu', 'kata-awan', 'kata-adhik'], gap: 'kata-turu', register: 'familiar', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
    { id: 'kalimat-11', text: 'kula nyuwun ngunjuk ___', translation: 'Saya minta minum air.', word_ids: ['kata-toya'], gap: 'kata-toya', register: 'neutral', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
    { id: 'kalimat-12', text: 'adhik nyuwun ngombe ___', translation: 'Adik minta minum air.', word_ids: ['kata-adhik', 'kata-banyu'], gap: 'kata-banyu', register: 'familiar', unit_id: 'unit-1', level: 'L1', audio: 'audio/kalimat-sugeng.opus', status: 'poc' },
  ];

  // 3. Data Skenario Percakapan (Dialogues) Lengkap 6 Topik
  const dialogues = [
    {
      id: 'dialog-sapaan',
      title: 'Menyapa Tetangga',
      interlocutor: 'neighbor',
      register: 'neutral',
      unit_id: 'unit-1',
      level: 'L1',
      contextDescription: 'Menyapa dan bertukar kabar singkat dengan tetangga di pagi hari.',
      partner: 'Tetangga',
      userRole: 'Warga / Pengunjung',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=faces&fit=crop&h=160&w=160&q=80',
      target_word_ids: ['kata-sugeng', 'kata-enjing'],
      maxNewWords: 2,
      nodes: [
        {
          id: 'n0',
          speaker: 'user',
          text: 'Sugeng enjing, Pak.',
          translation: 'Selamat pagi, Pak.',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Sugeng enjing, Pak.', translation: 'Selamat pagi, Pak.', quality: 'pas', type: 'register', next: 'n1' },
            { text: 'Sugeng dalu, Pak.', translation: 'Selamat malam, Pak.', quality: 'kurang-pas', type: 'register', next: 'n1' },
          ],
          next: 'n1',
        },
        {
          id: 'n1',
          speaker: 'neighbor',
          text: 'Sugeng enjing. Nembe badhe tindak pundi?',
          translation: 'Selamat pagi. Mau pergi ke mana?',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Badhe tindak dhateng peken, Pak.', translation: 'Mau pergi ke pasar, Pak.', quality: 'pas', type: 'comprehension', next: 'n2' },
            {
              text: 'Kula badhe sare sakniki.',
              translation: 'Saya mau tidur sekarang.',
              quality: 'tidak-nyambung',
              type: 'comprehension',
              next: 'n1',
              repair: { text: 'Ngapunten, mboten nyambung kalih situasi enjing.', translation: 'Maaf, kurang sesuai konteks jalan pagi.' },
            },
          ],
          next: 'n2',
        },
        { id: 'n2', speaker: 'user', text: 'Kula badhe mundhut sayur rumiyin.', translation: 'Saya mau beli sayur dulu.', audio: 'audio/dialog-start.opus', next: 'n3' },
        { id: 'n3', speaker: 'neighbor', text: 'O nggih, mangga dipun lajengaken.', translation: 'O iya, silakan dilanjutkan.', audio: 'audio/dialog-start.opus', next: 'n4' },
        { id: 'n4', speaker: 'user', text: 'Matur nuwun, Pak. Nyuwun pamit.', translation: 'Terima kasih, Pak. Permisi.', audio: 'audio/dialog-start.opus', next: 'n5' },
        { id: 'n5', speaker: 'neighbor', text: 'Nggih, ngatos-atos wonten margi.', translation: 'Iya, hati-hati di jalan.', audio: 'audio/dialog-start.opus', next: 'end' },
      ],
      endings: [{ id: 'end', quality: 'pas', feedback: 'Sapaanmu dengan tetangga sangat santun dan pas.' }],
      status: 'poc',
    },
    {
      id: 'dialog-pasar',
      title: 'Belanja di Pasar',
      interlocutor: 'vendor',
      register: 'neutral',
      unit_id: 'unit-1',
      level: 'L1',
      contextDescription: 'Menanyakan harga dan membeli bahan makanan di pasar tradisional.',
      partner: 'Penjual Pasar',
      userRole: 'Pembeli',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=faces&fit=crop&h=160&w=160&q=80',
      target_word_ids: ['kata-peken', 'kata-sekul'],
      maxNewWords: 2,
      nodes: [
        {
          id: 'p0',
          speaker: 'user',
          text: 'Nyuwun sewu Bu, reginipun lombok pinten?',
          translation: 'Permisi Bu, harga cabainya berapa?',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Nyuwun sewu Bu, reginipun pinten?', translation: 'Permisi Bu, harganya berapa?', quality: 'pas', type: 'register', next: 'p1' },
            { text: 'Pinten iki regane?', translation: 'Berapa ini harganya?', quality: 'kurang-pas', type: 'register', next: 'p1' },
          ],
          next: 'p1',
        },
        {
          id: 'p1',
          speaker: 'vendor',
          text: 'Sedasa ewu setunggal kilo, Mas.',
          translation: 'Sepuluh ribu satu kilo, Mas.',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Kula mundhut setunggal kilo nggih, Bu.', translation: 'Saya beli satu kilo ya, Bu.', quality: 'pas', type: 'comprehension', next: 'p2' },
            {
              text: 'Kula badhe siram toya.',
              translation: 'Saya mau mandi air.',
              quality: 'tidak-nyambung',
              type: 'comprehension',
              next: 'p1',
              repair: { text: 'Kok siram? Badhe tumbas lombok menapa mboten?', translation: 'Kok mandi? Mau beli cabai apa tidak?' },
            },
          ],
          next: 'p2',
        },
        { id: 'p2', speaker: 'user', text: 'Menika artanipun pas nggih, Bu.', translation: 'Ini uangnya pas ya, Bu.', audio: 'audio/dialog-start.opus', next: 'p3' },
        { id: 'p3', speaker: 'vendor', text: 'Matur nuwun sanget Mas, mangga.', translation: 'Terima kasih banyak Mas, silakan.', audio: 'audio/dialog-start.opus', next: 'p4' },
        { id: 'p4', speaker: 'user', text: 'Sami-sami Bu, nyuwun pamit.', translation: 'Sama-sama Bu, permisi.', audio: 'audio/dialog-start.opus', next: 'p5' },
        { id: 'p5', speaker: 'vendor', text: 'Nggih mangga, benjing mampir malih.', translation: 'Iya silakan, besok mampir lagi.', audio: 'audio/dialog-start.opus', next: 'end' },
      ],
      endings: [{ id: 'end', quality: 'pas', feedback: 'Transaksi belanja di pasar berhasil dengan santun.' }],
      status: 'poc',
    },
    {
      id: 'dialog-tamu',
      title: 'Menerima Tamu',
      interlocutor: 'guest',
      register: 'formal',
      unit_id: 'unit-1',
      level: 'L1',
      contextDescription: 'Menyambut tamu yang bertandang ke rumah dengan santun.',
      partner: 'Tamu Rumah',
      userRole: 'Tuan Rumah',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=faces&fit=crop&h=160&w=160&q=80',
      target_word_ids: ['kata-sugeng', 'kata-griya'],
      maxNewWords: 2,
      nodes: [
        {
          id: 't0',
          speaker: 'user',
          text: 'Sugeng rawuh Pak, mangga pinarak lenggah.',
          translation: 'Selamat datang Pak, silakan duduk.',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Sugeng rawuh, mangga pinarak.', translation: 'Selamat datang, mari duduk.', quality: 'pas', type: 'register', next: 't1' },
            { text: 'Ayo mlebu kene lungguh.', translation: 'Ayo masuk sini duduk.', quality: 'kurang-pas', type: 'register', next: 't1' },
          ],
          next: 't1',
        },
        {
          id: 't1',
          speaker: 'guest',
          text: 'Matur nuwun Mas, kados pundi kabaripun?',
          translation: 'Terima kasih Mas, bagaimana kabarnya?',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Pangestunipun sae, Pak.', translation: 'Berkat doa Anda, baik Pak.', quality: 'pas', type: 'comprehension', next: 't2' },
            {
              text: 'Sekulipun sampun telas.',
              translation: 'Nasinya sudah habis.',
              quality: 'tidak-nyambung',
              type: 'comprehension',
              next: 't1',
              repair: { text: 'Kula tanglet kabar, kok sekul?', translation: 'Saya menanyakan kabar, kok menjawab nasi?' },
            },
          ],
          next: 't2',
        },
        { id: 't2', speaker: 'user', text: 'Mangga dipun unjuk wedangipun.', translation: 'Silakan diminum minumannya.', audio: 'audio/dialog-start.opus', next: 't3' },
        { id: 't3', speaker: 'guest', text: 'Wah matur nuwun sanget, ngrepoti niki.', translation: 'Wah terima kasih banyak, merepotkan ini.', audio: 'audio/dialog-start.opus', next: 't4' },
        { id: 't4', speaker: 'user', text: 'Mboten napa-napa Pak, sakwontenipun.', translation: 'Tidak apa-apa Pak, seadanya.', audio: 'audio/dialog-start.opus', next: 't5' },
        { id: 't5', speaker: 'guest', text: 'Nggih Mas, matur nuwun panyambutanipun.', translation: 'Iya Mas, terima kasih penyambutannya.', audio: 'audio/dialog-start.opus', next: 'end' },
      ],
      endings: [{ id: 'end', quality: 'pas', feedback: 'Penyambutan tamu sangat ramah dan sopan.' }],
      status: 'poc',
    },
    {
      id: 'dialog-warung',
      title: 'Pesan Makanan di Warung',
      interlocutor: 'seller',
      register: 'neutral',
      unit_id: 'unit-1',
      level: 'L1',
      contextDescription: 'Memesan hidangan makan siang dan menanyakan minuman di warung makan.',
      partner: 'Pemilik Warung',
      userRole: 'Pelanggan',
      avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?crop=faces&fit=crop&h=160&w=160&q=80',
      target_word_ids: ['kata-mangan', 'kata-nedha', 'kata-sekul'],
      maxNewWords: 2,
      nodes: [
        {
          id: 'w0',
          speaker: 'user',
          text: 'Nyuwun sewu Bu, taksih wonten soto ayam?',
          translation: 'Permisi Bu, masih ada soto ayam?',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Nyuwun sewu, taksih wonten soto?', translation: 'Permisi, masih ada soto?', quality: 'pas', type: 'register', next: 'w1' },
            { text: 'Isih ana panganan opo ora?', translation: 'Masih ada makanan apa tidak?', quality: 'kurang-pas', type: 'register', next: 'w1' },
          ],
          next: 'w1',
        },
        {
          id: 'w1',
          speaker: 'seller',
          text: 'Taksih Mas, sekulipun dipun pisah menapa dipun campur?',
          translation: 'Masih Mas, nasinya dipisah atau dicampur?',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Dipun pisah mawon Bu, kalih teh anget setunggal.', translation: 'Dipisah saja Bu, dan teh hangat satu.', quality: 'pas', type: 'comprehension', next: 'w2' },
            {
              text: 'Kula badhe tilem wonten kamar.',
              translation: 'Saya mau tidur di kamar.',
              quality: 'tidak-nyambung',
              type: 'comprehension',
              next: 'w1',
              repair: { text: 'Wonten warung kok tilem, Mas?', translation: 'Di warung kok tidur, Mas?' },
            },
          ],
          next: 'w2',
        },
        { id: 'w2', speaker: 'user', text: 'Mangga dipun damelaken rumiyin Bu.', translation: 'Silakan dibuatkan dulu Bu.', audio: 'audio/dialog-start.opus', next: 'w3' },
        { id: 'w3', speaker: 'seller', text: 'Nggih Mas, sekedhap dipun tengga.', translation: 'Iya Mas, sebentar ditunggu.', audio: 'audio/dialog-start.opus', next: 'w4' },
        { id: 'w4', speaker: 'user', text: 'Matur nuwun Bu.', translation: 'Terima kasih Bu.', audio: 'audio/dialog-start.opus', next: 'w5' },
        { id: 'w5', speaker: 'seller', text: 'Menika sotonipun, mangga dipun rahabi.', translation: 'Ini sotonya, silakan dinikmati.', audio: 'audio/dialog-start.opus', next: 'end' },
      ],
      endings: [{ id: 'end', quality: 'pas', feedback: 'Pemesanan di warung berlangsung sopan dan lancar.' }],
      status: 'poc',
    },
    {
      id: 'dialog-arah',
      title: 'Menanyakan Arah Jalan',
      interlocutor: 'stranger',
      register: 'formal',
      unit_id: 'unit-1',
      level: 'L1',
      contextDescription: 'Menanyakan arah jalan menuju stasiun kepada sesama warga di jalan.',
      partner: 'Warga Sekitar',
      userRole: 'Pejalan Kaki',
      avatar: 'https://images.unsplash.com/photo-1516011362164-3095a82b0af9?crop=faces&fit=crop&h=160&w=160&q=80',
      target_word_ids: ['kata-mlampah', 'kata-tindak'],
      maxNewWords: 2,
      nodes: [
        {
          id: 'a0',
          speaker: 'user',
          text: 'Nyuwun sewu Pak, margi dhateng stasiun pundi nggih?',
          translation: 'Permisi Pak, jalan menuju stasiun sebelah mana ya?',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Nyuwun sewu Pak, margi dhateng stasiun pundi?', translation: 'Permisi Pak, jalan menuju stasiun mana?', quality: 'pas', type: 'register', next: 'a1' },
            { text: 'Stasiun nang endi dalane?', translation: 'Stasiun di mana jalannya?', quality: 'kurang-pas', type: 'register', next: 'a1' },
          ],
          next: 'a1',
        },
        {
          id: 'a1',
          speaker: 'stranger',
          text: 'Lurus mawon Mas, mangke wonten prapatan menggok nengen.',
          translation: 'Lurus saja Mas, nanti di perempatan belok kanan.',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Matur nuwun sanget pitedahipun, Pak.', translation: 'Terima kasih banyak petunjuknya, Pak.', quality: 'pas', type: 'comprehension', next: 'a2' },
            {
              text: 'Kula mboten purun nedha sekul.',
              translation: 'Saya tidak mau makan nasi.',
              quality: 'tidak-nyambung',
              type: 'comprehension',
              next: 'a1',
              repair: { text: 'Kula pitedah margi, kok nedha sekul?', translation: 'Saya menunjukkan jalan, kok menolak makan nasi?' },
            },
          ],
          next: 'a2',
        },
        { id: 'a2', speaker: 'user', text: 'Menapa taksih tebih saking mriki Pak?', translation: 'Apakah masih jauh dari sini Pak?', audio: 'audio/dialog-start.opus', next: 'a3' },
        { id: 'a3', speaker: 'stranger', text: 'Caket kok Mas, naming gangsal menit mlampah.', translation: 'Dekat kok Mas, hanya lima menit jalan kaki.', audio: 'audio/dialog-start.opus', next: 'a4' },
        { id: 'a4', speaker: 'user', text: 'Matur nuwun sanget Pak, nyuwun pamit.', translation: 'Terima kasih banyak Pak, mohon pamit.', audio: 'audio/dialog-start.opus', next: 'a5' },
        { id: 'a5', speaker: 'stranger', text: 'Nggih Mas, sami-sami, ngatos-atos.', translation: 'Iya Mas, sama-sama, hati-hati.', audio: 'audio/dialog-start.opus', next: 'end' },
      ],
      endings: [{ id: 'end', quality: 'pas', feedback: 'Menanyakan arah dengan tingkat tutur krama yang tepat.' }],
      status: 'poc',
    },
    {
      id: 'dialog-pamit',
      title: 'Pamit Pulang',
      interlocutor: 'host',
      register: 'formal',
      unit_id: 'unit-1',
      level: 'L1',
      contextDescription: 'Berpamitan kepada tuan rumah setelah berkunjung silaturahmi.',
      partner: 'Tuan Rumah',
      userRole: 'Tamu',
      avatar: 'https://images.unsplash.com/photo-1585917170055-e40d30c73414?crop=faces&fit=crop&h=160&w=160&q=80',
      target_word_ids: ['kata-sonten', 'kata-sugeng'],
      maxNewWords: 2,
      nodes: [
        {
          id: 'pm0',
          speaker: 'user',
          text: 'Nyuwun pangapunten Pak, sampun sonten, kula nyuwun pamit.',
          translation: 'Mohon maaf Pak, sudah sore, saya mohon pamit.',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Kula nyuwun pamit wangsul rumiyin Pak.', translation: 'Saya mohon pamit pulang dulu Pak.', quality: 'pas', type: 'register', next: 'pm1' },
            { text: 'Aku tak mulih saiki ya.', translation: 'Aku tak pulang sekarang ya.', quality: 'kurang-pas', type: 'register', next: 'pm1' },
          ],
          next: 'pm1',
        },
        {
          id: 'pm1',
          speaker: 'host',
          text: 'Kok kesusu Mas, mboten nyipeng kemawon?',
          translation: 'Kok terburu-buru Mas, tidak menginap saja?',
          audio: 'audio/dialog-start.opus',
          choices: [
            { text: 'Mboten Pak, benjing enjing wonten padamelan.', translation: 'Tidak Pak, besok pagi ada pekerjaan.', quality: 'pas', type: 'comprehension', next: 'pm2' },
            {
              text: 'Kula mundhut lombok setunggal kilo.',
              translation: 'Saya membeli cabai satu kilo.',
              quality: 'tidak-nyambung',
              type: 'comprehension',
              next: 'pm1',
              repair: { text: 'Kok tumbas lombok wonten mriki?', translation: 'Kok membeli cabai di sini?' },
            },
          ],
          next: 'pm2',
        },
        { id: 'pm2', speaker: 'user', text: 'Matur nuwun sanget sampun dipun tampi kanthi sae.', translation: 'Terima kasih banyak sudah diterima dengan baik.', audio: 'audio/dialog-start.opus', next: 'pm3' },
        { id: 'pm3', speaker: 'host', text: 'Sami-sami Mas, matur nuwun sampun kersa rawuh.', translation: 'Sama-sama Mas, terima kasih sudah bersedia datang.', audio: 'audio/dialog-start.opus', next: 'pm4' },
        { id: 'pm4', speaker: 'user', text: 'Nggih Pak, nyuwun pamit. Sugeng sonten.', translation: 'Iya Pak, mohon pamit. Selamat sore.', audio: 'audio/dialog-start.opus', next: 'pm5' },
        { id: 'pm5', speaker: 'host', text: 'Sugeng sonten Mas, ngatos-atos wonten dalan.', translation: 'Selamat sore Mas, hati-hati di jalan.', audio: 'audio/dialog-start.opus', next: 'end' },
      ],
      endings: [{ id: 'end', quality: 'pas', feedback: 'Pamitan silaturahmi berlangsung santun dan hangat.' }],
      status: 'poc',
    },
  ];

  // Tulis file kata.json, kalimat.json, dan dialog.json
  await writeFile(path.join(sourceDir, 'kata.json'), JSON.stringify(words));
  await writeFile(path.join(sourceDir, 'kalimat.json'), JSON.stringify(sentences));
  await writeFile(path.join(sourceDir, 'dialog.json'), JSON.stringify(dialogues));

  const units = JSON.parse(await readFile(path.join(sourceDir, 'unit.json'), 'utf8'));
  const challenges = JSON.parse(await readFile(path.join(sourceDir, 'challenge.json'), 'utf8'));

  // Validasi konten
  const validation = validateContent({ units, words, sentences, dialogues, challenges, publicRelease: false });
  if (!validation.ok) {
    console.error('Validation issues:', validation.issues);
    throw new Error('Content validation failed');
  }

  // Hitung checksum file-file pendukung
  async function filesIn(dir: string, prefix = ''): Promise<string[]> {
    const res: string[] = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const rel = path.posix.join(prefix, entry.name);
      if (entry.isDirectory()) res.push(...await filesIn(path.join(dir, entry.name), rel));
      else if (!['manifest.json', 'tanda-tangan', 'tanda-tangan.json'].includes(entry.name)) res.push(rel);
    }
    return res.sort((a, b) => Buffer.from(a).compare(Buffer.from(b)));
  }

  const filePaths = await filesIn(sourceDir);
  const files = await Promise.all(
    filePaths.map(async (rel) => {
      const data = await readFile(path.join(sourceDir, rel));
      return {
        path: rel,
        sizeBytes: data.byteLength,
        sha256: createHash('sha256').update(data).digest('hex'),
      };
    })
  );

  const keyId = 'clata-poc-2026-v2';
  const manifest = {
    packageId: 'jawa-mataraman',
    languageId: 'jv',
    dialectId: 'mataraman',
    packageVersion: '1.0.0',
    schemaVersion: 1,
    minimumAppVersion: '1.0.0',
    registerMapping: {
      familiar: 'ngoko',
      neutral: 'ngoko-alus',
      formal: 'krama',
    },
    orthographyReference: 'fixture-poc',
    createdAt: '2026-10-29T00:00:00.000Z',
    itemCounts: {
      units: units.length,
      words: words.length,
      sentences: sentences.length,
      dialogues: dialogues.length,
      challenges: challenges.length,
    },
    files,
    keyId,
    signatureReference: 'tanda-tangan',
  };

  await writeFile(path.join(sourceDir, 'manifest.json'), JSON.stringify(manifest));

  // Generate Ed25519 keypair
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const rawPublicKey = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32);

  const canonical = canonicalize({ manifest, files });
  if (!canonical) throw new Error('Failed to canonicalize payload');
  const signatureBytes = sign(null, Buffer.from(canonical, 'utf8'), privateKey);
  const signatureBase64Url = signatureBytes.toString('base64url');

  const sigObj = {
    algorithm: 'Ed25519',
    keyId,
    encoding: 'base64url',
    signature: signatureBase64Url,
  };

  await writeFile(path.join(sourceDir, 'tanda-tangan.json'), JSON.stringify(sigObj));
  await writeFile(path.join(sourceDir, 'tanda-tangan'), JSON.stringify(sigObj));

  console.log('Package files updated and signed successfully!');
  console.log('PUBLIC_KEY_BYTES:' + JSON.stringify(Array.from(rawPublicKey)));
}

void main();

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Utensils,
  Radio,
} from 'lucide-react';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { getEffectiveStudentMealStatus } from '../../utils/studentExceptionService';

// Basic numeral word-to-integer dictionary for spoken numbers in English & Malayalam
const WORD_NUMBER_MAP = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  // Common Malayalam phonetic spoken numbers
  ഒന്ന്: 1,
  രണ്ട്: 2,
  മൂന്ന്: 3,
  നാല്: 4,
  അഞ്ച്: 5,
  ആറ്: 6,
  ഏഴ്: 7,
  എട്ട്: 8,
  ഒമ്പത്: 9,
  പത്ത്: 10,
  പതിനൊന്ന്: 11,
  പന്ത്രണ്ട്: 12,
  ഇരുപത്: 20,
  മുപ്പത്: 30,
  നാൽപത്: 40,
  അമ്പത്: 50,
};

export default function VoiceSupplyAssistant({
  documents = [],
  servedMap = new Map(),
  meal = 'lunch',
  targetDateIST,
  effectiveDay,
  onServe,
  isActive = true,
  soundEnabled = true,
  hapticEnabled = true,
}) {
  const { speak, isSupported: ttsSupported, isSpeaking } = useTextToSpeech();
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastVoiceLog, setLastVoiceLog] = useState(null); // { tokenNo, message, status }
  const recognitionRef = useRef(null);

  // Check Web Speech Recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
      }
    }
  }, []);

  // Parse spoken words into a clean token number
  const parseSpokenToken = useCallback((spokenText) => {
    if (!spokenText) return null;
    const clean = spokenText.toLowerCase().trim();

    // Check direct digits in text (e.g., "42" or "token 42")
    const digitMatch = clean.match(/\b\d{1,4}\b/);
    if (digitMatch) {
      return Number(digitMatch[0]);
    }

    // Check compound words like "twenty five" or "one hundred two"
    const words = clean.split(/\s+/);
    let total = 0;
    let temp = 0;
    let matched = false;

    for (const w of words) {
      if (WORD_NUMBER_MAP[w] !== undefined) {
        matched = true;
        const val = WORD_NUMBER_MAP[w];
        if (val === 100) {
          temp = (temp || 1) * 100;
        } else if (val >= 20) {
          temp += val;
        } else {
          temp += val;
        }
      }
    }

    if (matched && temp > 0) {
      return temp;
    }

    return null;
  }, []);

  // Process verified token spoken
  const processVoiceToken = useCallback(
    async (tokenNo) => {
      const num = Number(tokenNo);
      if (!num) return;

      const student = documents.find((d) => Number(d.tokenNo) === num);
      if (!student) {
        speak(`Token ${num} not found`);
        setLastVoiceLog({
          tokenNo: num,
          status: 'NOT_FOUND',
          message: `Token #${num} not found in database.`,
        });
        return;
      }

      // Check if already served
      if (servedMap.has(num)) {
        if (soundEnabled) soundEngine.playDuplicateAlert();
        if (hapticEnabled) hapticEngine.duplicateAlert();
        speak(`Token ${num} already served!`);
        setLastVoiceLog({
          tokenNo: num,
          status: 'ALREADY_SERVED',
          message: `Token #${num} was already served for this meal.`,
        });
        return;
      }

      // Check eligibility
      const isEligible = getEffectiveStudentMealStatus(
        student,
        targetDateIST,
        effectiveDay,
        meal
      );

      if (isEligible) {
        if (soundEnabled) soundEngine.playServingApprovedChime();
        if (hapticEnabled) hapticEngine.servingApproved();

        // Check if dietary avoider
        let dietaryNotice = '';
        if (student.obj2?.fish === false) dietaryNotice = 'Fish Avoider';
        else if (student.obj2?.beef === false) dietaryNotice = 'Beef Avoider';

        speak(`Token ${num} Approved. ${dietaryNotice}`);

        await onServe(num, student, 'voice');

        setLastVoiceLog({
          tokenNo: num,
          studentName: student.uname || student.name,
          status: 'APPROVED',
          message: `Token #${num} Approved & Marked Served! ${dietaryNotice ? `(${dietaryNotice})` : ''}`,
        });
      } else {
        if (soundEnabled) soundEngine.playAvoiderWarningTone();
        if (hapticEnabled) hapticEngine.avoiderWarning();
        speak(`Token ${num} Off! Do not serve.`);
        setLastVoiceLog({
          tokenNo: num,
          studentName: student.uname || student.name,
          status: 'AVOIDER',
          message: `Token #${num} is OFF for ${meal}. Do not serve!`,
        });
      }
    },
    [documents, servedMap, targetDateIST, effectiveDay, meal, onServe, speak, soundEnabled, hapticEnabled]
  );

  // Initialize Speech Recognition
  const startListening = useCallback(() => {
    if (!speechSupported || isListening) return;

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-IN'; // Indian English handles numeric accents effectively

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        const spoken = last[0].transcript;
        setTranscript(spoken);

        const tokenNo = parseSpokenToken(spoken);
        if (tokenNo) {
          processVoiceToken(tokenNo);
        }
      };

      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          setIsListening(false);
        }
      };

      rec.onend = () => {
        // Auto restart if still meant to be listening
        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (_) {}
        } else {
          setIsListening(false);
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.warn('Start voice listening error:', err);
      setIsListening(false);
    }
  }, [speechSupported, isListening, parseSpokenToken, processVoiceToken]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Cleanup on unmount or active toggle
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center p-6 rounded-3xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/30 shadow-xl space-y-5 text-center">
      {/* HEADER */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-gray-100 dark:border-emerald-900/30">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
            Hands-Free Voice Controller
          </h3>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          Ideal for servers holding ladles & serving pots
        </span>
      </div>

      {/* RIPPLE SOUND WAVE CIRCLE */}
      <div className="relative my-4 flex items-center justify-center">
        {isListening && (
          <>
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute w-36 h-36 rounded-full bg-emerald-500/20"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              className="absolute w-28 h-28 rounded-full bg-emerald-500/30"
            />
          </>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isListening ? stopListening : startListening}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl transition-all cursor-pointer ${
            isListening
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/50'
              : 'bg-gradient-to-tr from-gray-400 to-gray-500 shadow-gray-500/30'
          }`}
        >
          {isListening ? <Mic className="w-10 h-10 animate-bounce" /> : <MicOff className="w-10 h-10" />}
        </motion.button>
      </div>

      {/* STATUS TEXT */}
      <div>
        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
          {isListening ? 'Listening for Token Numbers...' : 'Microphone Paused'}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
          {isListening
            ? 'Say token numbers aloud: "Forty Two", "Twelve", "നാല്പത്തിരണ്ട്". Assistant verifies and announces result.'
            : 'Click microphone to start hands-free voice verification.'}
        </p>
      </div>

      {/* LIVE TRANSCRIPT PILL */}
      {transcript && (
        <div className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-700 dark:text-gray-300">
          Heard: &ldquo;{transcript}&rdquo;
        </div>
      )}

      {/* LAST ACTION LOG */}
      {lastVoiceLog && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md p-4 rounded-2xl border text-xs font-bold text-left flex items-start space-x-3 ${
            lastVoiceLog.status === 'APPROVED'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
              : lastVoiceLog.status === 'AVOIDER'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
              : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
          }`}
        >
          {lastVoiceLog.status === 'APPROVED' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <div>
            <div className="text-sm font-black">
              Token #{lastVoiceLog.tokenNo} {lastVoiceLog.studentName ? `(${lastVoiceLog.studentName})` : ''}
            </div>
            <div className="opacity-90 mt-0.5">{lastVoiceLog.message}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  visible: boolean
  onConfidence: (rating: 'again' | 'hard' | 'good' | 'easy' | 'perfect') => void
}

export function ConfidenceButtons({ visible, onConfidence }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="flex gap-2 justify-center flex-wrap"
        >
          <button
            onClick={() => onConfidence('again')}
            className="flex-1 min-w-fit rounded-xl border-2 border-red-600/60 bg-red-600/15 py-2.5 px-2 text-xs sm:text-sm font-semibold text-red-400 transition-all hover:bg-red-600/25 hover:border-red-500"
          >
            <div>Again</div>
            <span className="block text-xs font-normal opacity-60">1</span>
          </button>

          <button
            onClick={() => onConfidence('hard')}
            className="flex-1 min-w-fit rounded-xl border-2 border-orange-500/60 bg-orange-500/15 py-2.5 px-2 text-xs sm:text-sm font-semibold text-orange-400 transition-all hover:bg-orange-500/25 hover:border-orange-500"
          >
            <div>Hard</div>
            <span className="block text-xs font-normal opacity-60">2</span>
          </button>

          <button
            onClick={() => onConfidence('good')}
            className="flex-1 min-w-fit rounded-xl border-2 border-yellow-500/60 bg-yellow-500/15 py-2.5 px-2 text-xs sm:text-sm font-semibold text-yellow-400 transition-all hover:bg-yellow-500/25 hover:border-yellow-500"
          >
            <div>Good</div>
            <span className="block text-xs font-normal opacity-60">3</span>
          </button>

          <button
            onClick={() => onConfidence('easy')}
            className="flex-1 min-w-fit rounded-xl border-2 border-green-500/60 bg-green-500/15 py-2.5 px-2 text-xs sm:text-sm font-semibold text-green-400 transition-all hover:bg-green-500/25 hover:border-green-500"
          >
            <div>Easy</div>
            <span className="block text-xs font-normal opacity-60">4</span>
          </button>

          <button
            onClick={() => onConfidence('perfect')}
            className="flex-1 min-w-fit rounded-xl border-2 border-blue-500/60 bg-blue-500/15 py-2.5 px-2 text-xs sm:text-sm font-semibold text-blue-400 transition-all hover:bg-blue-500/25 hover:border-blue-500"
          >
            <div>Perfect</div>
            <span className="block text-xs font-normal opacity-60">5</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

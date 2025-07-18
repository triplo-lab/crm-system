"use client"

import { motion } from 'framer-motion'
import { Loader2, TrendingUp } from 'lucide-react'

interface ModernLoadingProps {
  type?: 'spinner' | 'skeleton' | 'pulse' | 'dots'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function ModernLoading({ 
  type = 'skeleton', 
  size = 'md', 
  text,
  className = '' 
}: ModernLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  if (type === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`${sizeClasses[size]} text-blue-500`}
        >
          <Loader2 className="w-full h-full" />
        </motion.div>
        {text && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-sm text-slate-400"
          >
            {text}
          </motion.p>
        )}
      </div>
    )
  }

  if (type === 'dots') {
    return (
      <div className={`flex items-center justify-center space-x-2 ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
        {text && <span className="ml-3 text-sm text-slate-400">{text}</span>}
      </div>
    )
  }

  if (type === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <motion.div
          className={`${sizeClasses[size]} bg-blue-500 rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {text && (
          <span className="ml-3 text-sm text-slate-400">{text}</span>
        )}
      </div>
    )
  }

  // Default skeleton loading
  return (
    <div className={`space-y-4 ${className}`}>
      {text && (
        <div className="flex items-center justify-center mb-6">
          <TrendingUp className="w-6 h-6 text-blue-400 mr-2" />
          <span className="text-sm text-slate-400">{text}</span>
        </div>
      )}
      
      {/* Kanban Skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 w-80 bg-slate-800/50 rounded-xl p-4"
          >
            {/* Column Header Skeleton */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div 
                className="w-3 h-3 rounded-full bg-slate-600"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div 
                className="h-4 bg-slate-600 rounded flex-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
              />
              <motion.div 
                className="w-6 h-4 bg-slate-600 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              />
            </div>

            {/* Cards Skeleton */}
            <div className="space-y-3">
              {[...Array(Math.floor(Math.random() * 4) + 1)].map((_, j) => (
                <motion.div
                  key={j}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (i * 0.1) + (j * 0.05) }}
                  className="bg-slate-700/50 rounded-lg p-3 space-y-2"
                >
                  <motion.div 
                    className="h-4 bg-slate-600 rounded w-3/4"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: j * 0.1 }}
                  />
                  <motion.div 
                    className="h-3 bg-slate-600 rounded w-1/2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: j * 0.1 + 0.2 }}
                  />
                  <div className="flex gap-2">
                    <motion.div 
                      className="h-3 bg-slate-600 rounded w-1/4"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: j * 0.1 + 0.4 }}
                    />
                    <motion.div 
                      className="h-3 bg-slate-600 rounded w-1/4"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: j * 0.1 + 0.6 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Skeleton for metrics
export function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-slate-800/50 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-4 h-4 bg-slate-600 rounded"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            />
            <motion.div 
              className="h-3 bg-slate-600 rounded flex-1"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.2 }}
            />
          </div>
          <motion.div 
            className="h-8 bg-slate-600 rounded w-2/3"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.4 }}
          />
          <motion.div 
            className="h-3 bg-slate-600 rounded w-1/2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 + 0.6 }}
          />
        </motion.div>
      ))}
    </div>
  )
}

// Loading overlay
export function LoadingOverlay({ isVisible, text }: { isVisible: boolean; text?: string }) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700"
      >
        <ModernLoading type="spinner" size="lg" text={text} />
      </motion.div>
    </motion.div>
  )
}

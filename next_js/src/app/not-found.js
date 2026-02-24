"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
return ( <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50 px-6 text-center">

```
  {/* Animated 404 */}
  <motion.h1
    initial={{ opacity: 0, scale: 0.8, y: -40 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="text-7xl font-extrabold tracking-tight text-indigo-600 sm:text-8xl"
  >
    404
  </motion.h1>

  {/* Message */}
  <motion.h2
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.5 }}
    className="mt-4 text-2xl font-semibold text-gray-800"
  >
    Oops! Page not found
  </motion.h2>

  <motion.p
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4, duration: 0.5 }}
    className="mt-2 max-w-md text-gray-500"
  >
    Sorry, the page you are looking for doesn’t exist or has been moved.
  </motion.p>

  {/* Buttons */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.6, duration: 0.5 }}
    className="mt-8 flex gap-4"
  >
    <Link
      href="/"
      className="rounded-xl bg-indigo-600 px-6 py-3 text-white font-medium shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg"
    >
      Go Home
    </Link>
  </motion.div>

  {/* Floating Glow Animation */}
  <motion.div
    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
    transition={{ duration: 6, repeat: Infinity }}
    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
  >
    <div className="absolute left-1/2 top-[-10rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-indigo-200 blur-3xl"></div>
  </motion.div>
</div>
);
}

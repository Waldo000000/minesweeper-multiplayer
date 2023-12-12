import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <p>Play single-player minesweeper&nbsp;<a href="./game" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">here</a>. Multiplayer is coming soon!</p>
    </main>
  )
}

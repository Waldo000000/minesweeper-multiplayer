import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <p>Play multiplayer minesweeper&nbsp;<a href="./room/new" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">here</a>.</p>
    </main>
  )
}

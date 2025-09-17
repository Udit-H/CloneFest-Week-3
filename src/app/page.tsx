"use client"
import MinigolfGame from "@/components/minigolf-game";


export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 flex items-center justify-center">
      <div className="container mx-auto p-4 flex flex-col items-center">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-green-800 dark:text-green-200 mb-2">CloneFest 2025 Minigolf</h1>
          <p className="text-lg text-muted-foreground">3D Web-based Minigolf Challenge</p>
        </div>

        <MinigolfGame />
      </div>
    </div>
  )
}
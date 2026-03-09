import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { PlayCircle, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LearnerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-light text-gray-800">
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center gap-3 sticky top-0 z-10">
        <div className="h-8 w-8 bg-teal-600 rounded-xl flex items-center justify-center text-white">
          <span className="text-sm">L</span>
        </div>
        <span className="text-lg tracking-wide text-gray-900">Lumen Academy</span>
      </header>

      <main className="max-w-3xl mx-auto p-8 mt-4 space-y-10">
        <div>
          <h1 className="text-3xl text-gray-900 mb-3 tracking-tight">Welcome back, João</h1>
          <p className="text-lg text-gray-500">Pick up where you left off. No rush.</p>
        </div>

        <Card className="p-8 border-l-4 border-l-teal-500 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="text-sm text-teal-600 tracking-wide mb-2">CURRENT BLOCK</div>
              <h2 className="text-2xl text-gray-900 mb-3 tracking-tight">Brake Pads: The Squeal</h2>
              <p className="text-gray-500 text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> 5 min voice session
              </p>
            </div>
            <Button size="lg" className="gap-2 shrink-0 px-8" onClick={() => navigate('/chat/brake-pads')}>
              <PlayCircle className="h-5 w-5" />
              Resume Learning
            </Button>
          </div>
        </Card>

        <div>
          <h3 className="text-xl text-gray-900 mb-6 tracking-tight">Your Course: Basic Mechanics</h3>
          <div className="space-y-4">
            <Card className="p-5 flex items-center justify-between bg-gray-50/50 border-transparent">
              <div className="flex items-center gap-5">
                <CheckCircle2 className="h-6 w-6 text-teal-500" />
                <div>
                  <h4 className="text-lg text-gray-500 line-through decoration-gray-300">Block 1: Intro to Brakes</h4>
                  <p className="text-sm text-gray-400 mt-1">Completed yesterday</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">Review</Button>
            </Card>

            <Card className="p-5 flex items-center justify-between border-teal-200 ring-1 ring-teal-100 bg-white">
              <div className="flex items-center gap-5">
                <div className="h-6 w-6 rounded-full border border-teal-500 flex items-center justify-center">
                  <div className="h-2 w-2 bg-teal-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-lg text-gray-900">Block 2: Brake Pads: The Squeal</h4>
                  <p className="text-sm text-teal-600 mt-1">Up next</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between opacity-50 border-transparent bg-gray-50/50">
              <div className="flex items-center gap-5">
                <div className="h-6 w-6 rounded-full border border-gray-300"></div>
                <div>
                  <h4 className="text-lg text-gray-500">Block 3: Caliper Replacement</h4>
                  <p className="text-sm text-gray-400 mt-1">Locked</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

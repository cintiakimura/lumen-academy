import { Button } from './shared/ui/Button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Wrench, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-800 font-light flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-teal-600 rounded-xl flex items-center justify-center text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-xl tracking-wide">Lumen Academy</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
          <Button onClick={() => navigate('/setup')}>Get Started</Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm mb-8">
          <Wrench className="h-4 w-4" />
          <span>Hands-on training for real people</span>
        </div>
        <h1 className="text-5xl md:text-7xl tracking-tight text-gray-900 mb-6 leading-tight">
          Master skills without the stress.
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl font-light leading-relaxed">
          Upload your courses. Teach without quizzes. Let our patient AI coach guide learners to mastery through natural conversation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="gap-2" onClick={() => navigate('/setup')}>
            Start your academy <ArrowRight className="h-5 w-5" />
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
            I'm a learner
          </Button>
        </div>
      </main>
    </div>
  );
}

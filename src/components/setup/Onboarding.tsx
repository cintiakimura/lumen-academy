import { useState } from 'react';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState('');

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 font-light">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <h1 className="text-3xl text-gray-900 mb-3 tracking-tight">Invite your team</h1>
          <p className="text-gray-500">Add teachers to start building courses.</p>
        </div>

        <Card className="p-8 sm:p-10 space-y-8">
          <div className="space-y-4">
            <label className="block text-sm text-gray-600">Teacher Email Addresses</label>
            <textarea
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-base font-normal placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all resize-none h-32"
              placeholder="teacher1@example.com, teacher2@example.com..."
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
            <p className="text-xs text-gray-400">Separate multiple emails with commas.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/dashboard/teacher')}>
              Skip for now
            </Button>
            <Button className="flex-1 gap-2" onClick={() => navigate('/dashboard/teacher')}>
              Send Invites
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { Card } from '../shared/ui/Card';
import { Mail, ArrowRight, CheckCircle2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => {
        if (email.includes('teacher')) navigate('/dashboard/teacher');
        else navigate('/dashboard/learner');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 font-light">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="h-12 w-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white mb-6">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-3xl text-gray-900 mb-2 tracking-tight">Welcome back</h1>
          <p className="text-gray-500">Sign in to your account using a magic link.</p>
        </div>

        <Card className="p-8 sm:p-10">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm text-gray-600 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full gap-2" size="lg">
                Send Magic Link
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8 text-teal-600" />
              </div>
              <h2 className="text-2xl text-gray-900 mb-3 tracking-tight">Check your email</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                We sent a magic link to <span className="text-gray-900">{email}</span>.
                Click it to sign in.
              </p>
              <Button variant="ghost" onClick={() => setSubmitted(false)}>
                Back to login
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

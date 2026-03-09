import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { Check, CreditCard, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Payment() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 font-light">
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl text-gray-900 mb-3 tracking-tight">Choose your plan</h1>
          <p className="text-gray-500">Simple pricing for academies of all sizes.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 flex flex-col">
            <h3 className="text-xl text-gray-900 mb-2">Pro Academy</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl text-gray-900 tracking-tight">$9</span>
              <span className="text-gray-500">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {['Unlimited courses', 'Up to 100 learners', 'Custom branding', 'AI coaching included'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-600">
                  <Check className="h-5 w-5 text-teal-600 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/onboarding')}>
              Start 14-day free trial
            </Button>
          </Card>

          <Card className="p-8 flex flex-col border-teal-600 ring-1 ring-teal-600 bg-teal-50/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-teal-600 text-white text-xs px-3 py-1 rounded-bl-xl">
              Most Popular
            </div>
            <h3 className="text-xl text-gray-900 mb-2">Enterprise</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl text-gray-900 tracking-tight">$49</span>
              <span className="text-gray-500">/mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {['Everything in Pro', 'Unlimited learners', 'Advanced analytics', 'Priority support'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-600">
                  <Check className="h-5 w-5 text-teal-600 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full gap-2" onClick={() => navigate('/onboarding')}>
              <CreditCard className="h-4 w-4" />
              Subscribe Now
            </Button>
          </Card>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Lock className="h-4 w-4" />
          <span>Payments processed securely by Stripe</span>
        </div>
      </div>
    </div>
  );
}

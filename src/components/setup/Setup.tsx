import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { Card } from '../shared/ui/Card';
import { Building2, ArrowRight, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Setup() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 font-light">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <h1 className="text-3xl text-gray-900 mb-3 tracking-tight">Set up your Academy</h1>
          <p className="text-gray-500">Let's get your organization ready for learners.</p>
        </div>

        <Card className="p-8 sm:p-10 space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Organization Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <Input placeholder="e.g. Renault Brazil" className="pl-11" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Brand Logo</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="h-12 w-12 bg-teal-50 rounded-full flex items-center justify-center mb-3">
                  <Upload className="h-5 w-5 text-teal-600" />
                </div>
                <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                <span className="text-xs text-gray-400 mt-1">SVG, PNG, JPG (max 2MB)</span>
              </div>
            </div>
          </div>
          
          <Button className="w-full gap-2" size="lg" onClick={() => navigate('/payment')}>
            Continue to Billing
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Card>
      </div>
    </div>
  );
}

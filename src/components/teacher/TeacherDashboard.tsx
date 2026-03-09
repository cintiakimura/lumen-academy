import { useState } from 'react';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { UploadCloud, FileText, Mic } from 'lucide-react';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<'upload' | 'students'>('upload');

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-light text-gray-800">
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-teal-600 rounded-xl flex items-center justify-center text-white">
            <span className="text-sm">L</span>
          </div>
          <span className="text-lg tracking-wide text-gray-900">Lumen Academy</span>
        </div>
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`text-sm pb-1 border-b-2 transition-colors ${activeTab === 'upload' ? 'border-teal-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            My Courses
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`text-sm pb-1 border-b-2 transition-colors ${activeTab === 'students' ? 'border-teal-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Students
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8 mt-4">
        {activeTab === 'upload' ? (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl text-gray-900 tracking-tight">Course Upload</h1>
              <Button className="gap-2">
                <UploadCloud className="h-5 w-5" />
                Upload Material
              </Button>
            </div>

            <Card className="p-12 border-dashed border-2 border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="h-16 w-16 bg-teal-50 rounded-full flex items-center justify-center mb-6">
                <UploadCloud className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">Drag and drop files here</h3>
              <p className="text-base text-gray-500 mb-8 max-w-md leading-relaxed">
                Upload PDFs, videos, or audio. We'll automatically chunk them into 5-8 minute bite-sized blocks.
              </p>
              <Button variant="secondary">Browse Files</Button>
            </Card>

            <div>
              <h2 className="text-xl text-gray-900 mb-6 tracking-tight">Recent Uploads</h2>
              <div className="space-y-4">
                <Card className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center">
                      <FileText className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-lg text-gray-900 mb-1">Basic Mechanics Manual.pdf</h4>
                      <p className="text-sm text-gray-500">Auto-chunked into 4 blocks • 20 mins total</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Preview</Button>
                </Card>
                
                <div className="pl-16 space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <Mic className="h-5 w-5 text-gray-400" />
                      <span className="text-base text-gray-700">Block 1: Brake Pads Overview</span>
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-xl">4 min</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <Mic className="h-5 w-5 text-gray-400" />
                      <span className="text-base text-gray-700">Block 2: Caliper Squeeze</span>
                    </div>
                    <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-xl">5 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <h1 className="text-3xl text-gray-900 tracking-tight">Student Progress</h1>
            <Card className="overflow-hidden border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-8 py-5 text-sm text-gray-500 font-normal">Student</th>
                    <th className="px-8 py-5 text-sm text-gray-500 font-normal">Current Module</th>
                    <th className="px-8 py-5 text-sm text-gray-500 font-normal">Progress</th>
                    <th className="px-8 py-5 text-sm text-gray-500 font-normal">Coach Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6 text-gray-900">João Silva</td>
                    <td className="px-8 py-6 text-gray-600">Brake Pads</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 w-3/4"></div>
                        </div>
                        <span className="text-sm text-gray-500">75%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-600">Solid on brakes, shaky on turbo.</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6 text-gray-900">Maria Santos</td>
                    <td className="px-8 py-6 text-gray-600">Oil Change</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 w-full"></div>
                        </div>
                        <span className="text-sm text-gray-500">100%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-600">Mastered. Ready for next course.</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

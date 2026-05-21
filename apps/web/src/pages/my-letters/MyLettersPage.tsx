import { useState } from 'react';
import { FileText, Download, Loader2, Briefcase, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import { printLetter } from '@/lib/printLetter';

interface LetterOrg {
  name: string; address: string; email: string; phone: string; logoUrl: string | null;
}

function buildExperienceHtml(d: any): string {
  const emp = d.employee;
  const org = d.organization as LetterOrg;
  const gender = emp.gender === 'FEMALE' ? 'she' : 'he';
  const genderCap = gender.charAt(0).toUpperCase() + gender.slice(1);
  const joiningStr = emp.dateOfJoining
    ? new Date(emp.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';

  return `
<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:40px;">
  ${org.logoUrl ? `<img src="${org.logoUrl}" style="height:60px;margin-bottom:20px;" alt="Logo"/>` : ''}
  <h2 style="text-align:center;text-transform:uppercase;letter-spacing:2px;">Experience Certificate</h2>
  <p style="text-align:right;color:#555;">Date: ${d.issuedDate}</p>
  <p><strong>To Whom It May Concern,</strong></p>
  <p>This is to certify that <strong>${emp.name}</strong> (Employee Code: ${emp.code}) has been associated with <strong>${org.name}</strong>
  as <strong>${emp.designation}</strong>${emp.department ? ` in the <strong>${emp.department}</strong> department` : ''} since <strong>${joiningStr}</strong>.</p>
  <p>During ${gender === 'she' ? 'her' : 'his'} tenure, ${genderCap} has demonstrated commendable skills and dedication.
  We wish ${gender === 'she' ? 'her' : 'him'} the very best in all future endeavours.</p>
  <br/>
  <p>For <strong>${org.name}</strong></p>
  <br/><br/>
  <p>Authorised Signatory</p>
  <p style="color:#555;font-size:12px;">${org.address} | ${org.email} | ${org.phone}</p>
</div>`;
}

function buildSalaryHtml(d: any): string {
  const emp = d.employee;
  const org = d.organization as LetterOrg;
  const sal = d.salary;

  return `
<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:40px;">
  ${org.logoUrl ? `<img src="${org.logoUrl}" style="height:60px;margin-bottom:20px;" alt="Logo"/>` : ''}
  <h2 style="text-align:center;text-transform:uppercase;letter-spacing:2px;">Salary Certificate</h2>
  <p style="text-align:right;color:#555;">Date: ${d.issuedDate}</p>
  <p><strong>To Whom It May Concern,</strong></p>
  <p>This is to certify that <strong>${emp.name}</strong> (Employee Code: ${emp.code}) is employed with
  <strong>${org.name}</strong> as <strong>${emp.designation}</strong>${emp.department ? ` in the <strong>${emp.department}</strong> department` : ''}.</p>
  ${sal ? `
  <table style="border-collapse:collapse;width:100%;margin-top:20px;">
    <tr style="background:#f0f4f8;"><th style="padding:10px;text-align:left;border:1px solid #ddd;">Component</th><th style="padding:10px;text-align:right;border:1px solid #ddd;">Amount (₹)</th></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;">Annual CTC</td><td style="padding:8px;text-align:right;border:1px solid #ddd;">₹${sal.ctc.toLocaleString('en-IN')}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;">Monthly Gross</td><td style="padding:8px;text-align:right;border:1px solid #ddd;">₹${sal.gross.toLocaleString('en-IN')}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ddd;">Basic</td><td style="padding:8px;text-align:right;border:1px solid #ddd;">₹${sal.basic.toLocaleString('en-IN')}</td></tr>
    <tr style="font-weight:bold;background:#f0f4f8;"><td style="padding:8px;border:1px solid #ddd;">Monthly Net Pay</td><td style="padding:8px;text-align:right;border:1px solid #ddd;">₹${sal.netPay.toLocaleString('en-IN')}</td></tr>
  </table>` : '<p>Salary details are confidential.</p>'}
  <br/>
  <p>For <strong>${org.name}</strong></p>
  <br/><br/>
  <p>Authorised Signatory</p>
  <p style="color:#555;font-size:12px;">${org.address} | ${org.email} | ${org.phone}</p>
</div>`;
}

const LETTERS = [
  {
    id: 'experience',
    title: 'Experience Letter',
    description: 'Certifies your tenure and designation at the company',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-600',
    endpoint: '/letters/me/experience',
    build: buildExperienceHtml,
    docTitle: 'Experience Certificate',
  },
  {
    id: 'salary',
    title: 'Salary Certificate',
    description: 'Confirms your current salary details',
    icon: IndianRupee,
    color: 'bg-green-100 text-green-600',
    endpoint: '/letters/me/salary-certificate',
    build: buildSalaryHtml,
    docTitle: 'Salary Certificate',
  },
];

export default function MyLettersPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDownload = async (letter: typeof LETTERS[0]) => {
    setLoading(letter.id);
    try {
      const res = await apiClient.get(letter.endpoint);
      const html = letter.build(res.data.data);
      printLetter(html, letter.docTitle);
    } catch {
      toast.error('Failed to generate letter. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">My Letters</h1>
        <p className="text-muted-foreground text-sm">Download your employment letters instantly</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {LETTERS.map(letter => {
          const Icon = letter.icon;
          return (
            <Card key={letter.id}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className={`rounded-xl p-3 ${letter.color} shrink-0`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{letter.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{letter.description}</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    size="sm"
                    disabled={loading === letter.id}
                    onClick={() => handleDownload(letter)}
                  >
                    {loading === letter.id
                      ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      : <Download className="h-4 w-4 mr-2" />}
                    Download / Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <FileText className="text-muted-foreground h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Need a custom letter?</p>
              <p className="text-muted-foreground text-xs mt-1">
                For employment verification letters, visa support letters, or bank letters,
                please raise an HR request via the Helpdesk and mention the specific purpose.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

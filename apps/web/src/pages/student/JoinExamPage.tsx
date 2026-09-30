import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';

// TODO(QN-11): validate with POST /api/exam-access/validate, then go to the instructions page.
export function JoinExamPage() {
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Join an exam</h1>
      <p className="mt-1 text-sm text-slate-600">
        Your teacher will give you the exam code. Use your school roll number.
      </p>

      <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()} noValidate>
        <TextField
          label="Exam code"
          name="examCode"
          placeholder="e.g. PHY-4821"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
        />
        <TextField label="Roll number" name="rollNumber" autoComplete="off" required />
        <Button type="submit" size="lg" className="w-full" disabled>
          Continue
        </Button>
      </form>
    </Card>
  );
}

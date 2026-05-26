import { useState } from 'react';
import { useSessionStorageState } from '@/hooks/useSessionStorageState';
import { BookOpen, Plus, Play, CheckCircle, Clock, Users, ExternalLink, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLmsCourses, useMyLmsCourses, useCreateCourse, useDeleteCourse, useEnrollCourse, useUpdateProgress } from '@/hooks/useLms';
import { useAuthStore } from '@/stores/auth.store';
import type { LearningCourse, CourseLevel } from '@hrms/shared-types';

type Tab = 'catalog' | 'my-courses';

const LEVEL_META: Record<CourseLevel, { label: string; color: string }> = {
  BEGINNER: { label: 'Beginner', color: 'bg-green-100 text-green-700 border-green-200' },
  INTERMEDIATE: { label: 'Intermediate', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ADVANCED: { label: 'Advanced', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const LEVELS: CourseLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim();
}

export default function LmsPage() {
  const [tab, setTab] = useSessionStorageState<Tab>('lms_tab', 'catalog');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAdmin = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(user?.role ?? '');

  const { data: courses, isLoading } = useLmsCourses(search ? { search } : undefined);
  const { data: myCourses, isLoading: loadingMy } = useMyLmsCourses();
  const enroll = useEnrollCourse();
  const updateProgress = useUpdateProgress();
  const del = useDeleteCourse();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            Learning Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Grow your skills with curated courses</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['catalog', 'Course Catalog'], ['my-courses', 'My Learning']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              tab === t
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-background border-border text-muted-foreground hover:border-emerald-400'
            }`}
          >
            {label}
            {t === 'my-courses' && myCourses && myCourses.length > 0 && (
              <span className="ml-2 bg-emerald-500 text-white rounded-full px-1.5 py-0.5 text-xs">
                {myCourses.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Catalog */}
      {tab === 'catalog' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
            </div>
          ) : !courses || courses.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="font-semibold">No courses found</p>
              {isAdmin && <p className="text-muted-foreground text-sm">Add your first course to get started.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isAdmin={isAdmin}
                  onEnroll={() => enroll.mutate(course.id)}
                  onUpdateProgress={(pct) => updateProgress.mutate({ courseId: course.id, progressPct: pct })}
                  onDelete={() => del.mutate(course.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* My Courses */}
      {tab === 'my-courses' && (
        loadingMy ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : !myCourses || myCourses.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="font-semibold">No enrolled courses yet</p>
            <p className="text-muted-foreground text-sm">Browse the catalog and enroll in a course.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myCourses.map((e) => (
              <Card key={e.id} className="border shadow-sm">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${LEVEL_META[e.course.level].color}`}>
                          {LEVEL_META[e.course.level].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{e.course.category}</span>
                      </div>
                      <p className="font-semibold text-sm truncate">{e.course.title}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${e.progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">{e.progressPct}%</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {e.status === 'COMPLETED' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateProgress.mutate({ courseId: e.courseId, progressPct: Math.min(100, e.progressPct + 25) })}
                          className="text-emerald-600 border-emerald-200"
                        >
                          +25%
                        </Button>
                      )}
                      {e.course.externalUrl && (
                        <a href={e.course.externalUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <CreateCourseDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function CourseCard({
  course,
  isAdmin,
  onEnroll,
  onUpdateProgress,
  onDelete,
}: {
  course: LearningCourse;
  isAdmin: boolean;
  onEnroll: () => void;
  onUpdateProgress: (pct: number) => void;
  onDelete: () => void;
}) {
  const meta = LEVEL_META[course.level];
  const enrolled = course.myEnrollment;

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {course.thumbnailUrl ? (
        <div className="h-32 rounded-t-xl overflow-hidden">
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-32 rounded-t-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
          <BookOpen className="w-12 h-12 text-white/70" />
        </div>
      )}
      <CardContent className="pt-3 pb-4 px-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
          <span className="text-xs text-muted-foreground">{course.category}</span>
        </div>
        <p className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{course.title}</p>
        {course.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{course.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto mb-3">
          {course.durationMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(course.durationMinutes)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {course._count.enrollments}
          </span>
        </div>

        {enrolled ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-emerald-600">{enrolled.progressPct}%</span>
            </div>
            <div className="bg-muted rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${enrolled.progressPct}%` }} />
            </div>
            <div className="flex gap-2 pt-1">
              {course.externalUrl && (
                <a href={course.externalUrl} target="_blank" rel="noreferrer" className="flex-1">
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    <Play className="w-3 h-3 mr-1" />
                    Continue
                  </Button>
                </a>
              )}
              {enrolled.status !== 'COMPLETED' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-emerald-600 border-emerald-200 text-xs"
                  onClick={() => onUpdateProgress(Math.min(100, enrolled.progressPct + 25))}
                >
                  +25%
                </Button>
              )}
              {enrolled.status === 'COMPLETED' && (
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Done
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={onEnroll}
            >
              Enroll Now
            </Button>
            {course.externalUrl && (
              <a href={course.externalUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="text-xs">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            )}
          </div>
        )}

        {isAdmin && (
          <button
            onClick={onDelete}
            className="mt-2 text-xs text-red-400 hover:text-red-600 flex items-center gap-1 self-end"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function CreateCourseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [level, setLevel] = useState<CourseLevel>('BEGINNER');
  const [duration, setDuration] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const create = useCreateCourse();

  async function handleSubmit() {
    if (!title.trim()) return;
    await create.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim() || 'General',
      level,
      durationMinutes: parseInt(duration) || 0,
      externalUrl: externalUrl.trim() || undefined,
    });
    setTitle(''); setDescription(''); setCategory('General');
    setLevel('BEGINNER'); setDuration(''); setExternalUrl('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Leadership" />
            </div>
            <div>
              <Label>Level</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
              >
                {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_META[l].label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Duration (minutes)</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="60" />
          </div>
          <div>
            <Label>External Course URL</Label>
            <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || create.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Create Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useStudiesWithTimes } from '@/hooks/api/study/useStudyHooks'

export default function StudyTestPage() {
  const { data, loading, error } = useStudiesWithTimes({
    page: 1,
    pageSize: 10
  });

  return (
    <div className="p-4">
      {data.map(study => (
        <div key={study.study_id} className="p-2 border-b">
          <pre>{JSON.stringify(study, null, 2)}</pre>
        </div>
      ))}
    </div>
  )
} 
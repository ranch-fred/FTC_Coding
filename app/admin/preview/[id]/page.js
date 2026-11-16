'use client';
// Mentor preview: play any lesson without locks. Answers, XP and battery are not recorded.
// This is a convenience, not a secret: lesson content ships to every browser anyway.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Player from '../../../../components/Player';
import { getLesson } from '../../../../lib/curriculum';
import { store } from '../../../../lib/store';

export default function Preview() {
  const { id } = useParams();
  const router = useRouter();
  const lesson = getLesson(id);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    store.adminData().then((d) => setIsAdmin(d.isAdmin));
  }, []);

  if (!lesson) return <p>Lesson not found. <Link href="/admin">Back to the mentor view</Link></p>;
  if (isAdmin === null) return <p>Loading…</p>;
  if (!isAdmin) return <p role="alert">Mentors only.</p>;
  return (
    <>
      <p className="muted small">Preview of &quot;{lesson.title}&quot;. Answers, XP and battery are not recorded.</p>
      <Player key={lesson.id} steps={lesson.steps} mode="preview" exitTo="/admin" onDone={() => router.push('/admin')} />
    </>
  );
}

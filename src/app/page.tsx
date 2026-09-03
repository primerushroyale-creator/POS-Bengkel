import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function HomePage() {
  const cookieStore = cookies();
  const role = cookieStore.get('bengkel_role')?.value;

  if (role === 'mekanik') {
    redirect('/admin/work-orders');
  }
  redirect('/pos');
}
